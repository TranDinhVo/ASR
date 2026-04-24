const fs = require('fs');
const path = require('path');
const Job = require('../models/Job');
const User = require('../models/User');
const geminiService = require('../services/geminiService');
const documentService = require('../services/documentService');
const { uploadToCloud, deleteFromCloud } = require('../services/cloudinaryService');


// ─── UPLOAD & START JOB ──────────────────────────────────────────────────────
exports.uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file' });
    }

    const { language = 'vi', title } = req.body;
    const mimeType = req.file.mimetype;
    const localPath = req.file.path;
    
    // Detect file type
    let fileType = 'audio';
    if (mimeType.startsWith('video/')) fileType = 'video';
    else if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('officedocument')) fileType = 'document';

    // Upload to Cloudinary (keep local copy until Gemini processes it)
    console.log(`☁️  [Upload] Uploading to Cloudinary...`);
    let cloudUrl = null;
    let cloudPublicId = null;
    try {
      // Upload to cloud - but DON'T delete local yet (Gemini needs it)
      const { v2: cloudinary } = require('cloudinary');
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      let resource_type = 'raw';
      if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) resource_type = 'video';
      const result = await cloudinary.uploader.upload(localPath, {
        resource_type,
        folder: 'student-ai',
        use_filename: true,
        unique_filename: true,
      });
      cloudUrl = result.secure_url;
      cloudPublicId = result.public_id;
      console.log(`✅ [Cloudinary] Uploaded: ${cloudUrl}`);
    } catch (cloudErr) {
      console.warn(`⚠️  [Cloudinary] Upload failed, using local:`, cloudErr.message);
    }

    // Create job with cloud info
    const job = await Job.create({
      userId: req.userId,
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ''),
      fileType,
      originalFilename: req.file.originalname,
      filePath: localPath,
      cloudUrl,
      cloudPublicId,
      fileSize: req.file.size,
      mimeType,
      language,
      status: 'pending',
    });

    res.status(202).json({
      message: 'File đã được tải lên, đang xử lý...',
      jobId: job._id,
      status: 'pending',
    });

    // Background processing (local file still exists at this point)
    processJob(job._id, localPath, mimeType, fileType);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Background: gọi model và cập nhật DB ────────────────────────────────────
async function processJob(jobId, filePath, mimeType, fileType) {
  try {
    console.log(`🧵 [Background] Starting job ${jobId} (${fileType})...`);
    await Job.findByIdAndUpdate(jobId, { status: 'processing', progress: 10 });

    let textContent = null;
    if (fileType === 'document') {
      console.log(`📄 [Background] Extracting text from document...`);
      textContent = await documentService.extractText(filePath, mimeType);
      await Job.findByIdAndUpdate(jobId, { progress: 30 });
    }

    console.log(`🤖 [Background] Job ${jobId}: Calling Gemini Pipeline...`);
    const result = await geminiService.processPipeline(filePath, mimeType, textContent);
    await Job.findByIdAndUpdate(jobId, { progress: 80 });

    // Delete local file after Gemini has processed it
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  [Background] Local file cleaned up: ${filePath}`);
      }
    } catch (e) {
      console.warn(`⚠️  [Background] Could not delete local file: ${e.message}`);
    }

    console.log(`🧠 [Background] Job ${jobId}: Generating embeddings...`);
    const embedding = await geminiService.generateEmbedding(result.stage2_clean);

    await Job.findByIdAndUpdate(jobId, {
      status: 'done',
      progress: 100,
      completedAt: new Date(),
      pipeline: {
        stage1_raw: result.stage1_raw,
        stage2_clean: result.stage2_clean,
        stage3_summary: result.stage3_summary,
      },
      'transcript.content': result.stage2_clean,
      'transcript.segments': result.segments || [],
      'transcript.wordCount': result.stage2_clean.split(/\s+/).filter(Boolean).length,
      'summary.content': result.stage3_summary,
      'summary.keyPoints': result.keyPoints || [],
      'summary.keywords': result.keywords || [],
      embeddings: embedding,
    });

    const completedJob = await Job.findById(jobId);
    if (completedJob?.userId) {
      await User.findByIdAndUpdate(completedJob.userId, { $inc: { totalJobs: 1 } });
    }

    console.log(`✅ [Background] Job ${jobId} completed successfully`);
  } catch (err) {
    console.error(`❌ [Background] Job ${jobId} failed:`, err);
    // Try to clean up local file even on failure
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    await Job.findByIdAndUpdate(jobId, {
      status: 'failed',
      errorMessage: err.message,
      progress: 0,
    });
  }
}


// ─── GET JOB (poll status) ───────────────────────────────────────────────────
// Guest có thể truy cập bằng jobId (không cần đăng nhập)
exports.getJob = async (req, res) => {
  try {
    const { isValid } = require('mongoose').Types.ObjectId;
    if (!isValid(req.params.id)) {
      return res.status(404).json({ message: 'Không tìm thấy job (ID không hợp lệ)' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy job' });

    // Nếu đã đăng nhập, kiểm tra job có thuộc về user không
    // (guest job có userId = null → ai cũng truy cập được bằng ID)
    if (job.userId && req.userId && job.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET ALL JOBS (lịch sử) ──────────────────────────────────────────────────
exports.getJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-transcript.segments'), // bỏ segments để nhẹ hơn
      Job.countDocuments(filter),
    ]);

    res.json({
      jobs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE JOB ──────────────────────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy job' });
    if (job.userId && req.userId && job.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Không có quyền xóa' });
    }

    // Delete from Cloudinary if exists
    if (job.cloudPublicId) {
      await deleteFromCloud(job.cloudPublicId, job.mimeType);
    }

    // Delete local file if still exists
    if (job.filePath && fs.existsSync(job.filePath)) {
      fs.unlinkSync(job.filePath);
    }

    await job.deleteOne();
    res.json({ message: 'Đã xóa thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── UPDATE TITLE ─────────────────────────────────────────────────────────────
exports.updateJob = async (req, res) => {
  try {
    const { title } = req.body;
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Không tìm thấy job' });
    if (job.userId && req.userId && job.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa' });
    }
    job.title = title;
    await job.save();
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

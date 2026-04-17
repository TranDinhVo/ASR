const fs = require('fs');
const path = require('path');
const Job = require('../models/Job');
const User = require('../models/User');
const geminiService = require('../services/geminiService');


// ─── UPLOAD & START JOB ──────────────────────────────────────────────────────
exports.uploadAudio = async (req, res) => {
  console.log('[Backend] Received upload request:', {
    filename: req.file?.originalname,
    language: req.body.language,
    title: req.body.title
  });
  try {
    if (!req.file) {
      console.warn('[Backend] No file attached to request');
      return res.status(400).json({ message: 'Vui lòng chọn file audio' });
    }

    const { language = 'vi', title } = req.body;

    // Tạo job trong DB
    console.log('💾 [Backend] Creating job in DB...');
    const job = await Job.create({
      userId: req.userId,
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ''),
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      language,
      status: 'pending',
    });

    // Trả về ngay, xử lý bất đồng bộ ở background
    console.log('[Backend] Job created successfully, starting background processing:', job._id);
    res.status(202).json({
      message: 'File đã được tải lên, đang xử lý...',
      jobId: job._id,
      status: 'pending',
    });

    // ─── Background processing ───────────────────────────────────────────────
    processJob(job._id, req.file.path, language);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Background: gọi model và cập nhật DB ────────────────────────────────────
async function processJob(jobId, filePath, language) {
  try {
    console.log(`🧵 [Background] Starting job ${jobId}...`);
    // Lấy thông tin mimeType từ job
    const job = await Job.findById(jobId);
    const mimeType = job?.mimeType || 'audio/mpeg';

    // Cập nhật status → processing
    await Job.findByIdAndUpdate(jobId, { status: 'processing', progress: 10 });
    console.log(`⏳ [Background] Job ${jobId}: Processing (10%)`);

    // Gọi Gemini service
    console.log(`🤖 [Background] Job ${jobId}: Calling Gemini service...`);
    const result = await geminiService.transcribeAndSummarize(filePath, language, mimeType);

    // Cập nhật progress
    await Job.findByIdAndUpdate(jobId, { progress: 80 });
    console.log(`⏳ [Background] Job ${jobId}: Transcription received (80%)`);

    // Parse kết quả từ Gemini
    const transcriptContent = result.transcript || '';
    const segments = result.segments || [];
    const summaryContent = result.summary || '';
    const keyPoints = result.keyPoints || [];
    const keywords = result.keywords || [];

    // Lưu kết quả vào DB
    console.log(`💾 [Background] Job ${jobId}: Updating DB with results...`);
    await Job.findByIdAndUpdate(jobId, {
      status: 'done',
      progress: 100,
      completedAt: new Date(),
      'transcript.content': transcriptContent,
      'transcript.segments': segments,
      'transcript.wordCount': transcriptContent.split(/\s+/).filter(Boolean).length,
      'summary.content': summaryContent,
      'summary.keyPoints': keyPoints,
      'summary.keywords': keywords,
    });

    // Tăng số job của user (chỉ khi có tài khoản)
    const completedJob = await Job.findById(jobId);
    if (completedJob?.userId) {
      await User.findByIdAndUpdate(completedJob.userId, { $inc: { totalJobs: 1 } });
    }

    console.log(`✅ [Background] Job ${jobId} completed successfully`);
  } catch (err) {
    console.error(`❌ [Background] Job ${jobId} failed:`, err.message);
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
    // Chỉ owner mới được xóa (guest job: userId = null → cần biết jobId)
    if (job.userId && req.userId && job.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Không có quyền xóa' });
    }

    // Xóa file khỏi disk
    if (fs.existsSync(job.filePath)) {
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

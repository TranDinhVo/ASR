const mongoose = require('mongoose');

// Schema cho từng đoạn transcript (có timestamp)
const segmentSchema = new mongoose.Schema(
  {
    start: { type: Number },      // giây bắt đầu
    end: { type: Number },        // giây kết thúc
    text: { type: String },       // nội dung đoạn
    speaker: { type: String },    // (nếu model hỗ trợ diarization)
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    // ─── Thông tin chủ sở hữu ───────────────────────────────────────────────
    // null = guest (không cần đăng nhập)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,  // guest không có userId
      default: null,
      index: true,
    },

    // ─── Thông tin file ──────────────────────────────────────────────────────
    title: {
      type: String,
      default: 'Untitled',
    },
    fileType: {
      type: String,
      enum: ['audio', 'video', 'document', 'text'],
      default: 'audio',
    },
    originalFilename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    cloudUrl: {
      type: String,
      default: null,           // Cloudinary secure_url
    },
    cloudPublicId: {
      type: String,
      default: null,           // Cloudinary public_id (for deletion)
    },
    fileSize: {
      type: Number,           // bytes
    },
    duration: {
      type: Number,           // seconds (for audio/video)
    },
    mimeType: {
      type: String,
    },
    language: {
      type: String,
      default: 'vi',          // 'vi' | 'en' | 'auto'
    },

    // ─── Trạng thái xử lý ───────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'failed'],
      default: 'pending',
      index: true,
    },
    progress: {
      type: Number,
      default: 0,             // 0-100
    },
    errorMessage: {
      type: String,
      default: null,
    },

    // ─── Kết quả 3-Model Pipeline ───────────────────────────────────────────
    pipeline: {
      stage1_raw: { type: String, default: null },      // Whisper equivalent
      stage2_clean: { type: String, default: null },    // ViT5-Correct equivalent
      stage3_summary: { type: String, default: null },  // ViT5-Summarize equivalent
    },

    // ─── Kết quả Transcript (Compatibility) ──────────────────────────────────
    transcript: {
      content: { type: String, default: null },       // full text (usually same as cleanText)
      segments: { type: [segmentSchema], default: [] }, // timestamps
      wordCount: { type: Number, default: 0 },
    },

    // ─── Kết quả Summary (Compatibility) ─────────────────────────────────────
    summary: {
      content: { type: String, default: null },        // paragraph tóm tắt
      keyPoints: { type: [String], default: [] },      // danh sách ý chính
      keywords: { type: [String], default: [] },       // từ khóa nổi bật
    },

    // ─── Vector Data (RAG) ──────────────────────────────────────────────────
    embeddings: {
      type: [Number],  // For full document embedding
      default: [],
    },

    // ─── Metadata ────────────────────────────────────────────────────────────
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index tìm kiếm toàn văn trên transcript
// language_override: 'none' để MongoDB không tự ý dùng field 'language' (có thể là 'auto') cho stemming
jobSchema.index(
  { 'transcript.content': 'text', title: 'text' },
  { default_language: 'none', language_override: 'none' }
);

module.exports = mongoose.model('Job', jobSchema);

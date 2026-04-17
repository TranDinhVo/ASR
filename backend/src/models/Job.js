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
    originalFilename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,           // bytes
    },
    duration: {
      type: Number,           // seconds
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

    // ─── Kết quả Transcript ──────────────────────────────────────────────────
    transcript: {
      content: { type: String, default: null },       // full text
      segments: { type: [segmentSchema], default: [] }, // timestamps
      wordCount: { type: Number, default: 0 },
    },

    // ─── Kết quả Summary ─────────────────────────────────────────────────────
    summary: {
      content: { type: String, default: null },        // paragraph tóm tắt
      keyPoints: { type: [String], default: [] },      // danh sách ý chính
      keywords: { type: [String], default: [] },       // từ khóa nổi bật
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

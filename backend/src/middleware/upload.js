const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Các định dạng được phép
const ALLOWED_TYPES = [
  'audio/mpeg',       // .mp3
  'audio/mp4',        // .m4a
  'audio/wav',        // .wav
  'audio/x-wav',
  'audio/ogg',        // .ogg
  'audio/webm',       // .webm
  'audio/flac',       // .flac
  'video/mp4',        // .mp4
  'video/webm',
  'video/quicktime',  // .mov
  'application/pdf',  // .pdf
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
];

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Lưu file vào thư mục uploads/ với tên duy nhất
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

// Kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng file không hỗ trợ: ${file.mimetype}. Hỗ trợ: MP3, WAV, M4A, OGG, FLAC`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

module.exports = upload;

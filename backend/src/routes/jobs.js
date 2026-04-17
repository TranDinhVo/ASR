const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const upload = require('../middleware/upload');
const {
  uploadAudio,
  getJob,
  getJobs,
  deleteJob,
  updateJob,
} = require('../controllers/jobController');

// ─── Public (guest + user) ────────────────────────────────────────────────────
// POST /api/jobs/upload — không cần đăng nhập, guest vẫn dùng được
router.post('/upload', optionalAuth, upload.single('file'), uploadAudio);

// GET /api/jobs/:id — poll kết quả theo jobId, guest truy cập được
router.get('/:id', optionalAuth, getJob);

// ─── Chỉ dành cho user đã đăng nhập ──────────────────────────────────────────
// GET /api/jobs — lịch sử cần login
router.get('/', auth, getJobs);

// PATCH /api/jobs/:id — cập nhật tiêu đề
router.patch('/:id', optionalAuth, updateJob);

// DELETE /api/jobs/:id — xóa job
router.delete('/:id', optionalAuth, deleteJob);

module.exports = router;

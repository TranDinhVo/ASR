const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/verify/:token  ← click link trong email
router.get('/verify/:token', verifyEmail);

// POST /api/auth/resend-verification  ← gửi lại email
router.post('/resend-verification', resendVerification);

// GET /api/auth/me (cần token)
router.get('/me', auth, getMe);

// PATCH /api/auth/me — cập nhật profile
router.patch('/me', auth, updateMe);

module.exports = router;

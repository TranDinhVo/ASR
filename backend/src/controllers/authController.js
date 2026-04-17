const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail, sendWelcomeEmail } = require('../services/emailService');

// ─── Tạo JWT token ────────────────────────────────────────────────────────────
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Check tồn tại
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    // Tạo token xác thực ngẫu nhiên (32 bytes hex)
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    // Tạo user (chưa xác thực)
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verifyToken,
      verifyTokenExpire,
    });

    // Gửi email xác thực
    try {
      await sendVerificationEmail(email, name, verifyToken);
    } catch (emailErr) {
      // Nếu gửi mail lỗi → xóa user vừa tạo và báo lỗi
      await User.findByIdAndDelete(user._id);
      console.error('Email send failed:', emailErr.message);
      return res.status(500).json({
        message: 'Không thể gửi email xác thực. Vui lòng kiểm tra cấu hình email.',
      });
    }

    res.status(201).json({
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Tìm user có token hợp lệ và chưa hết hạn
    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpire: { $gt: new Date() }, // phải còn hạn
      isVerified: false,
    }).select('+verifyToken +verifyTokenExpire');

    if (!user) {
      return res.status(400).json({
        message: 'Link xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.',
      });
    }

    // Kích hoạt tài khoản
    user.isVerified = true;
    user.verifyToken = null;
    user.verifyTokenExpire = null;
    await user.save();

    // Gửi email chào mừng (không cần await)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    // Tự động đăng nhập sau khi xác thực
    const jwtToken = signToken(user._id);

    res.json({
      message: 'Xác thực email thành công! Chào mừng bạn đến với ASR App.',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: true,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── RESEND VERIFICATION EMAIL ────────────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    const user = await User.findOne({ email }).select('+verifyToken +verifyTokenExpire');
    if (!user) {
      return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'Tài khoản này đã được xác thực rồi' });
    }

    // Tạo token mới
    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.verifyToken = verifyToken;
    user.verifyTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, user.name, verifyToken);

    res.json({ message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    // Lấy user kèm password (select: false nên phải chỉ định rõ)
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    // ── Kiểm tra đã xác thực email chưa ──
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.',
        needVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user._id);

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        totalJobs: user.totalJobs,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        totalJobs: user.totalJobs,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

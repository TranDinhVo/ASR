const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT KHÔNG bắt buộc.
 * Nếu có token hợp lệ → gắn req.userId
 * Nếu không có / sai token → vẫn cho đi tiếp (req.userId = null)
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    } else {
      req.userId = null; // guest
    }
  } catch {
    req.userId = null; // token lỗi → xem như guest
  }
  next();
};

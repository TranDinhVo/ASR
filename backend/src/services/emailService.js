const nodemailer = require('nodemailer');

// ─── Tạo transporter (kết nối Gmail SMTP) ────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App Password (16 ký tự)
    },
  });
};

// ─── Gửi email xác thực tài khoản ────────────────────────────────────────────
exports.sendVerificationEmail = async (email, name, token) => {
  const transporter = createTransporter();

  // Link xác thực → Frontend sẽ gọi API này khi user click
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"ASR App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Xac thuc tai khoan ASR',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0; color: #111827; }
          .container { max-width: 560px; margin: 40px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          .header { padding: 32px; text-align: center; border-bottom: 1px solid #f3f4f6; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #111827; }
          .body { padding: 32px; }
          .body p { line-height: 1.6; margin: 0 0 16px; font-size: 15px; }
          .name { font-weight: 700; }
          .btn { display: inline-block; padding: 12px 32px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; text-align: center; margin-top: 16px; }
          .note { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f3f4f6; }
          .note p { color: #6b7280; font-size: 13px; margin: 0 0 8px; }
          .footer { text-align: center; padding: 24px; background: #f9fafb; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ASR</h1>
          </div>
          <div class="body">
            <p>Xin chao <span class="name">${name}</span>,</p>
            <p>Vui long nhan vao nut duoi day de xac thuc tai khoan email cua ban.</p>
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="btn">Xac thuc Email</a>
            </div>
            <div class="note">
              <p>Link nay se het han sau 24 gio.</p>
              <p>Neu ban không thuc hien yeu cau nay, vui long bo qua email.</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2025 ASR</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Verification email sent to ${email}`);
};

// ─── Gửi email chào mừng sau khi xác thực thành công ─────────────────────────
exports.sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"ASR App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Chao mung ban den voi ASR',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0; color: #111827; }
          .container { max-width: 560px; margin: 40px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
          .header { padding: 32px; text-align: center; border-bottom: 1px solid #f3f4f6; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #111827; }
          .body { padding: 32px; }
          .body p { line-height: 1.6; margin: 0 0 20px; font-size: 15px; }
          .feature { padding: 12px; background: #f3f4f6; border-radius: 6px; margin-bottom: 8px; font-size: 14px; font-weight: 500; }
          .footer { text-align: center; padding: 24px; background: #f9fafb; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ASR</h1>
          </div>
          <div class="body">
            <p>Chao mung <strong>${name}</strong> den voi ASR!</p>
            <p>Tai khoan cua ban da duoc kich hoat thanh công. Ban co the bat dau su dung cac tinh nang:</p>
            <div class="feature">Chuyen doi giong noi thanh van ban tu dong</div>
            <div class="feature">Tom tat noi dung thong minh</div>
            <div class="feature">Luu tru lich su xu ly</div>
          </div>
          <div class="footer">
            <p>© 2025 ASR</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Welcome email sent to ${email}`);
};

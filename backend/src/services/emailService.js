const nodemailer = require('nodemailer');

async function getTransporter() {
  // In development: use Ethereal (fake SMTP, preview URL logged to console)
  if (process.env.NODE_ENV !== 'production') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // In production: use real SMTP from env vars
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

/**
 * Send a 6-digit OTP to the given email address.
 * @param {string} to  - recipient email
 * @param {string} code - plain-text 6-digit OTP
 */
async function sendOtpEmail(to, code) {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: `"Happy App" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: 'Your password reset code',
    text: `Your password reset code is: ${code}\n\nIt expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto">
        <h2 style="color:#6C63FF">Happy App</h2>
        <p>Your password reset code is:</p>
        <h1 style="letter-spacing:8px;color:#1a1a2e;background:#f3f0ff;padding:16px;border-radius:8px;text-align:center">${code}</h1>
        <p style="color:#888;font-size:13px">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  // In development: log the Ethereal preview URL so you can read the email
  if (process.env.NODE_ENV !== 'production') {
    console.log('📧 Preview OTP email at:', nodemailer.getTestMessageUrl(info));
  }
}

module.exports = { sendOtpEmail };

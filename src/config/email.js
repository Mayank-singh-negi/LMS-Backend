import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 DNS resolution globally — Render free tier blocks IPv6
dns.setDefaultResultOrder("ipv4first");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
    socketTimeout: 15000,
    connectionTimeout: 15000,
  });
}

async function send(to, subject, html) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n📧 [DEV] Email to ${to} | Subject: ${subject}\n`);
    return;
  }
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"Learnovora" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`[EMAIL SENT] to=${to} messageId=${info.messageId}`);
}

export const sendOTPEmail = async (to, otp) => {
  await send(to, "Your Verification Code – Learnovora", `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#004643;margin-bottom:8px;">Verify your email</h2>
      <p style="color:#555;margin-bottom:24px;">Use the code below to complete your signup. It expires in <strong>5 minutes</strong>.</p>
      <div style="background:#004643;color:#fff;font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:20px 32px;border-radius:10px;">${otp}</div>
      <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `);
};

export const sendAdminOTPEmail = async (to, adminName, otp) => {
  await send(to, "Your Admin Login OTP – Learnovora", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">🔐</div>
        <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Admin Login OTP</h2>
        <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Learnovora Admin Panel</p>
      </div>
      <div style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <p style="color:#1e293b;font-size:15px;margin:0 0 8px;">Hi <strong>${adminName || "Admin"}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">Use the code below to sign in. Expires in <strong>5 minutes</strong>.</p>
        <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your OTP</p>
          <p style="color:#38bdf8;font-size:40px;font-weight:800;letter-spacing:14px;margin:0;font-family:monospace;">${otp}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:0;">Never share this OTP with anyone.</p>
      </div>
    </div>
  `);
};

export const sendPasswordResetOTPEmail = async (to, userName, otp) => {
  await send(to, "Reset Your Password – Learnovora", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#004643 0%,#0d9488 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">🔑</div>
        <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Reset Your Password</h2>
      </div>
      <div style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;">
        <p style="color:#1e293b;font-size:15px;">Hi <strong>${userName || "there"}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">Use the code below to reset your password. Expires in <strong>5 minutes</strong>.</p>
        <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your OTP</p>
          <p style="color:#0d9488;font-size:40px;font-weight:800;letter-spacing:14px;margin:0;font-family:monospace;">${otp}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:0;">If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `);
};

export const sendCourseApprovedEmail = async (teacherEmail, teacherName, courseTitle) => {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;
  await send(teacherEmail, "Your Course Has Been Approved 🎉", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#004643 0%,#0d9488 100%);padding:36px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">🎉</div>
        <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Course Approved!</h1>
      </div>
      <div style="background:#ffffff;padding:36px 40px;border-radius:0 0 16px 16px;">
        <p style="color:#1e293b;font-size:16px;">Hi <strong>${teacherName}</strong>,</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;">Your course <strong style="color:#004643;">${courseTitle}</strong> has been approved. Go to your dashboard and click Publish to make it live.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#004643,#0d9488);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">Go to Dashboard →</a>
        </div>
      </div>
    </div>
  `);
};

export const sendCourseRejectedEmail = async (teacherEmail, teacherName, courseTitle, reason = "") => {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;
  await send(teacherEmail, "Update on Your Course Submission – Learnovora", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);padding:36px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">📋</div>
        <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Course Needs Revision</h1>
      </div>
      <div style="background:#ffffff;padding:36px 40px;border-radius:0 0 16px 16px;">
        <p style="color:#1e293b;font-size:16px;">Hi <strong>${teacherName}</strong>,</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;">Your course <strong>${courseTitle}</strong> needs some changes before it can be published.</p>
        ${reason ? `<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:16px 0;"><p style="color:#78350f;font-size:14px;margin:0;">${reason}</p></div>` : ""}
        <div style="text-align:center;margin:28px 0;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">Go to Dashboard →</a>
        </div>
      </div>
    </div>
  `);
};

export const sendLiveClassEmail = async (to, studentName, courseTitle, liveLink) => {
  await send(to, `Live Class Started 🎥 — ${courseTitle}`, `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">🔴 Live Class Started!</h1>
      </div>
      <div style="background:#fff;padding:32px 40px;border-radius:0 0 16px 16px;">
        <p style="color:#1e293b;font-size:15px;">Hi <strong>${studentName || "Student"}</strong>,</p>
        <p style="color:#475569;font-size:14px;">Your instructor is live for <strong>${courseTitle}</strong>.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${liveLink}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;">🎥 Join Now</a>
        </div>
      </div>
    </div>
  `);
};

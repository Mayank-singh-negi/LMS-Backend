import { Resend } from "resend";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const FROM = process.env.EMAIL_FROM || "Learnovora <onboarding@resend.dev>";

async function send(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n📧 [DEV] Email to ${to} | Subject: ${subject}\n`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ from: FROM, to, subject, html });
}

export const sendOTPEmail = async (to, otp) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n📧 OTP for ${to}: \x1b[33m${otp}\x1b[0m (dev mode)\n`);
    return;
  }
  await send(to, "Your Verification Code – Learnovora", `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#004643;">Verify your email</h2>
      <p style="color:#555;">Use the code below. Expires in <strong>5 minutes</strong>.</p>
      <div style="background:#004643;color:#fff;font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:20px 32px;border-radius:10px;">${otp}</div>
    </div>
  `);
};

export const sendCourseApprovedEmail = async (teacherEmail, teacherName, courseTitle) => {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;
  await send(teacherEmail, "Your Course Has Been Approved 🎉", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 16px;">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#004643,#0d9488);padding:36px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:26px;">🎉 Course Approved!</h1>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#1e293b;">Hi <strong>${teacherName}</strong>,</p>
          <p style="color:#475569;">Your course <strong>${courseTitle}</strong> has been approved. Go publish it!</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#004643,#0d9488);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;display:inline-block;">Go to Dashboard →</a>
          </div>
        </div>
      </div>
    </div>
  `);
};

export const sendCourseRejectedEmail = async (teacherEmail, teacherName, courseTitle, reason = "") => {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;
  await send(teacherEmail, "Update on Your Course Submission – Learnovora", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 16px;">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:36px 40px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:26px;">📋 Course Needs Revision</h1>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#1e293b;">Hi <strong>${teacherName}</strong>,</p>
          <p style="color:#475569;">Your course <strong>${courseTitle}</strong> needs changes before it can be published.</p>
          ${reason ? `<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:16px 0;"><p style="color:#78350f;font-size:14px;margin:0;">${reason}</p></div>` : ""}
          <div style="text-align:center;margin:28px 0;">
            <a href="${dashboardUrl}" style="background:#dc2626;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;display:inline-block;">Go to Dashboard →</a>
          </div>
        </div>
      </div>
    </div>
  `);
};

export const sendAdminOTPEmail = async (to, adminName, otp) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔐 [DEV] Admin OTP for ${to}: \x1b[33m${otp}\x1b[0m\n`);
    return;
  }
  await send(to, "Your Admin Login OTP – Learnovora", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">🔐</div>
        <h2 style="color:#fff;margin:0;font-size:22px;">Admin Login OTP</h2>
        <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Learnovora Admin Panel</p>
      </div>
      <div style="background:#fff;padding:32px 40px;border-radius:0 0 16px 16px;">
        <p style="color:#1e293b;">Hi <strong>${adminName || "Admin"}</strong>,</p>
        <p style="color:#64748b;font-size:14px;">Use the code below. Expires in <strong>5 minutes</strong>.</p>
        <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your OTP</p>
          <p style="color:#38bdf8;font-size:40px;font-weight:800;letter-spacing:14px;margin:0;font-family:monospace;">${otp}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;">Never share this OTP with anyone.</p>
      </div>
    </div>
  `);
};

export const sendLiveClassEmail = async (to, studentName, courseTitle, liveLink) => {
  await send(to, `Live Class Started 🎥 — ${courseTitle}`, `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;">
      <div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🔴 Live Class Started!</h1>
      </div>
      <div style="background:#fff;padding:32px 40px;border-radius:0 0 16px 16px;">
        <p style="color:#1e293b;">Hi <strong>${studentName || "Student"}</strong>,</p>
        <p style="color:#475569;">Your instructor is live for <strong>${courseTitle}</strong>.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${liveLink}" style="background:#dc2626;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;display:inline-block;">🎥 Join Now</a>
        </div>
      </div>
    </div>
  `);
};

export const sendPasswordResetOTPEmail = async (to, userName, otp) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔑 [DEV] Password Reset OTP for ${to}: \x1b[33m${otp}\x1b[0m\n`);
    return;
  }
  await send(to, "Reset Your Password – Learnovora", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#004643,#0d9488);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:36px;margin-bottom:8px;">🔑</div>
        <h2 style="color:#fff;margin:0;font-size:22px;">Reset Your Password</h2>
      </div>
      <div style="background:#fff;padding:32px 40px;border-radius:0 0 16px 16px;">
        <p style="color:#1e293b;">Hi <strong>${userName || "there"}</strong>,</p>
        <p style="color:#64748b;font-size:14px;">Use the code below to reset your password. Expires in <strong>5 minutes</strong>.</p>
        <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin:16px 0;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your OTP</p>
          <p style="color:#0d9488;font-size:40px;font-weight:800;letter-spacing:14px;margin:0;font-family:monospace;">${otp}</p>
        </div>
        <p style="color:#94a3b8;font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `);
};

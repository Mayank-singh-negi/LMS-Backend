import { Resend } from "resend";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Learnovora <onboarding@resend.dev>";

async function send(to, subject, html) {
  if (!process.env.RESEND_API_KEY) {
    // dev fallback — log to console
    console.log(`\n📧 [DEV] Email to ${to} | Subject: ${subject}\n`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export const sendOTPEmail = async (to, otp) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n📧 OTP for ${to}: \x1b[33m${otp}\x1b[0m (dev mode)\n`);
    return;
  }
  await send(to, "Your Verification Code – Learnovora", `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#004643;margin-bottom:8px;">Verify your email</h2>
      <p style="color:#555;margin-bottom:24px;">Use the code below to complete your signup. It expires in <strong>5 minutes</strong>.</p>
      <div style="background:#004643;color:#fff;font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:20px 32px;border-radius:10px;">${otp}</div>
      <p style="color:#999;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `);
};

export const sendCourseApprovedEmail = async (teacherEmail, teacherName, courseTitle) => {
export const sendCourseApprovedEmail = async (teacherEmail, teacherName, courseTitle) => {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;
  await send(teacherEmail, "Your Course Has Been Approved 🎉", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f0fdf4;padding:40px 16px;">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#004643 0%,#0d9488 100%);padding:36px 40px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">🎉</div>
          <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Course Approved!</h1>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#1e293b;font-size:16px;">Hi <strong>${teacherName}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.7;">Your course <strong style="color:#004643;">${courseTitle}</strong> has been approved. Go to your dashboard and click Publish to make it live.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#004643,#0d9488);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">Go to Dashboard →</a>
          </div>
        </div>
      </div>
    </div>
  `);
};

export const sendCourseRejectedEmail = async (teacherEmail, teacherName, courseTitle, reason = "") => {
  const dashboardUrl = `${FRONTEND_URL}/dashboard`;
  await send(teacherEmail, "Update on Your Course Submission – Learnovora", `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff7f7;padding:40px 16px;">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);padding:36px 40px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">📋</div>
          <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Course Needs Revision</h1>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#1e293b;font-size:16px;">Hi <strong>${teacherName}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.7;">Your course <strong>${courseTitle}</strong> needs some changes before it can be published.</p>
          ${reason ? `<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin:16px 0;"><p style="color:#78350f;font-size:14px;margin:0;">${reason}</p></div>` : ""}
          <div style="text-align:center;margin:28px 0;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">Go to Dashboard →</a>
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
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
        <div style="font-size:32px;margin-bottom:8px;">🔐</div>
        <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Admin Login OTP</h2>
        <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Learnovora Admin Panel</p>
      </div>
      <div style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;">
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

export const sendPasswordResetOTPEmail = async (to, userName, otp) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`\n🔑 [DEV] Password Reset OTP for ${to}: \x1b[33m${otp}\x1b[0m\n`);
    return;
  }
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


  const dashboardUrl = `${FRONTEND_URL}/dashboard`;

  await transporter.sendMail({
    from: `"Learnovora" <${process.env.SMTP_USER}>`,
    to: teacherEmail,
    subject: "Your Course Has Been Approved 🎉",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 16px;">
          <tr><td align="center">
            <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#004643 0%,#0d9488 100%);padding:36px 40px;text-align:center;">
                  <div style="font-size:40px;margin-bottom:8px;">🎉</div>
                  <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Course Approved!</h1>
                  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Great news from the Learnovora team</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="color:#1e293b;font-size:16px;margin:0 0 16px;">Hi <strong>${teacherName}</strong>,</p>
                  <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                    Congratulations! Your course has been reviewed by our admin team and has been <strong style="color:#0d9488;">approved</strong>.
                  </p>

                  <!-- Course card -->
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
                    <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Approved Course</p>
                    <p style="color:#004643;font-size:18px;font-weight:700;margin:0;">${courseTitle}</p>
                  </div>

                  <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
                    Your course is now ready to be published. Head to your dashboard, open the course, and click <strong>Publish</strong> to make it live for students.
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align:center;margin:0 0 28px;">
                    <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#004643,#0d9488);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      Go to Dashboard →
                    </a>
                  </div>

                  <!-- Steps -->
                  <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin:0 0 8px;">
                    <p style="color:#1e293b;font-size:13px;font-weight:700;margin:0 0 12px;">Next steps:</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      ${["Open your dashboard and go to <strong>My Courses</strong>", "Find your approved course", "Click <strong>Publish</strong> to make it live for students"].map((step, i) => `
                      <tr>
                        <td style="width:28px;vertical-align:top;padding-bottom:10px;">
                          <div style="width:22px;height:22px;background:#0d9488;border-radius:50%;text-align:center;line-height:22px;color:#fff;font-size:11px;font-weight:700;">${i + 1}</div>
                        </td>
                        <td style="padding-bottom:10px;padding-left:10px;color:#475569;font-size:13px;line-height:1.5;">${step}</td>
                      </tr>`).join("")}
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Learnovora · You're receiving this because you submitted a course for review.</p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};

export const sendCourseRejectedEmail = async (teacherEmail, teacherName, courseTitle, reason = "") => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n❌ [DEV] Course rejected email → ${teacherEmail} | Course: "${courseTitle}" | Reason: ${reason || "N/A"}\n`);
    return;
  }

  const dashboardUrl = `${FRONTEND_URL}/dashboard`;

  await transporter.sendMail({
    from: `"Learnovora" <${process.env.SMTP_USER}>`,
    to: teacherEmail,
    subject: "Update on Your Course Submission – Learnovora",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#fff7f7;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7f7;padding:40px 16px;">
          <tr><td align="center">
            <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%);padding:36px 40px;text-align:center;">
                  <div style="font-size:40px;margin-bottom:8px;">📋</div>
                  <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">Course Needs Revision</h1>
                  <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Feedback from the Learnovora review team</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="color:#1e293b;font-size:16px;margin:0 0 16px;">Hi <strong>${teacherName}</strong>,</p>
                  <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px;">
                    Thank you for submitting your course. After review, our team has requested some changes before it can be published.
                  </p>

                  <!-- Course card -->
                  <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:20px 24px;margin:0 0 20px;">
                    <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Course</p>
                    <p style="color:#7f1d1d;font-size:18px;font-weight:700;margin:0;">${courseTitle}</p>
                  </div>

                  ${reason ? `
                  <!-- Reason -->
                  <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
                    <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Reviewer Feedback</p>
                    <p style="color:#78350f;font-size:14px;line-height:1.7;margin:0;">${reason}</p>
                  </div>` : ""}

                  <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
                    Please address the feedback above, update your course, and resubmit it for review from your dashboard.
                  </p>

                  <div style="text-align:center;margin:0 0 8px;">
                    <a href="${dashboardUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;">
                      Go to Dashboard →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Learnovora · Questions? Reply to this email.</p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};

export const sendAdminOTPEmail = async (to, adminName, otp) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n🔐 [DEV] Admin OTP for ${to}: \x1b[33m${otp}\x1b[0m\n`);
    return;
  }

  await transporter.sendMail({
    from: `"Learnovora Admin" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Admin Login OTP – Learnovora",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:0;background:#f8fafc;">
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🔐</div>
          <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Admin Login OTP</h2>
          <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Learnovora Admin Panel</p>
        </div>
        <div style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <p style="color:#1e293b;font-size:15px;margin:0 0 8px;">Hi <strong>${adminName || "Admin"}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Use the code below to sign in to the admin panel. This OTP expires in <strong>5 minutes</strong> and can only be used once.
          </p>
          <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your OTP</p>
            <p style="color:#38bdf8;font-size:40px;font-weight:800;letter-spacing:14px;margin:0;font-family:monospace;">${otp}</p>
          </div>
          <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:0 0 20px;">
            <p style="color:#92400e;font-size:13px;margin:0;">
              ⚠️ <strong>Never share this OTP.</strong> Learnovora will never ask for your OTP via phone or chat.
            </p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">If you didn't request this, your account may be at risk. Please contact support immediately.</p>
        </div>
      </div>
    `,
  });
};

export const sendLiveClassEmail = async (to, studentName, courseTitle, liveLink) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n🔴 [DEV] Live class email → ${to} | Course: "${courseTitle}" | Link: ${liveLink}\n`);
    return;
  }

  await transporter.sendMail({
    from: `"Learnovora" <${process.env.SMTP_USER}>`,
    to,
    subject: `Live Class Started 🎥 — ${courseTitle}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:0;">
        <div style="background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">🔴</div>
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Live Class Started!</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Your instructor is live right now</p>
        </div>
        <div style="background:#fff;padding:32px 40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <p style="color:#1e293b;font-size:15px;margin:0 0 12px;">Hi <strong>${studentName || "Student"}</strong>,</p>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
            Your instructor has started a live class for:
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px 20px;margin:0 0 24px;">
            <p style="color:#991b1b;font-size:17px;font-weight:700;margin:0;">📚 ${courseTitle}</p>
          </div>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="${liveLink}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 40px;border-radius:10px;">
              🎥 Join Live Class Now
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
            Or copy this link: <a href="${liveLink}" style="color:#dc2626;">${liveLink}</a>
          </p>
        </div>
      </div>
    `,
  });
};

export const sendPasswordResetOTPEmail = async (to, userName, otp) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n🔑 [DEV] Password Reset OTP for ${to}: \x1b[33m${otp}\x1b[0m\n`);
    return;
  }

  await transporter.sendMail({
    from: `"Learnovora" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset Your Password – Learnovora",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;padding:0;">
        <div style="background:linear-gradient(135deg,#004643 0%,#0d9488 100%);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
          <div style="font-size:36px;margin-bottom:8px;">🔑</div>
          <h2 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Reset Your Password</h2>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">Learnovora Account Security</p>
        </div>
        <div style="background:#ffffff;padding:32px 40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <p style="color:#1e293b;font-size:15px;margin:0 0 8px;">Hi <strong>${userName || "there"}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px;">
            We received a request to reset your password. Use the code below to proceed. This OTP expires in <strong>5 minutes</strong>.
          </p>
          <div style="background:#0f172a;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
            <p style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your OTP</p>
            <p style="color:#0d9488;font-size:40px;font-weight:800;letter-spacing:14px;margin:0;font-family:monospace;">${otp}</p>
          </div>
          <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:0 0 20px;">
            <p style="color:#92400e;font-size:13px;margin:0;">⚠️ If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">This OTP will expire in 5 minutes and can only be used once.</p>
        </div>
      </div>
    `,
  });
};

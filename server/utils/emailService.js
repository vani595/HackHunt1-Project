// ============================================================
// server/utils/emailService.js
// Email notification service using Nodemailer
// ============================================================

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendHackathonApprovalNotification = async (hackathon, users) => {
  if (!users || users.length === 0) return;

  const emails = users.map((u) => u.email).filter(Boolean);
  if (emails.length === 0) return;

  const startDate = hackathon.startDate
    ? new Date(hackathon.startDate).toDateString()
    : "TBA";
  const endDate = hackathon.endDate
    ? new Date(hackathon.endDate).toDateString()
    : "TBA";
  const prize = hackathon.prize || "Not specified";
  const location = hackathon.location || "Online";
  const mode = hackathon.mode || "online";

  const mailOptions = {
    from: `"HackHunt 🚀" <${process.env.EMAIL_USER}>`,
    bcc: emails, // bcc so users don't see each other's emails
    subject: `🎉 New Hackathon Live: ${hackathon.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background:#0b0a14;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

          <!-- Header -->
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:12px 28px;border-radius:30px;">
              <span style="color:white;font-size:22px;font-weight:800;letter-spacing:1px;">🚀 HackHunt</span>
            </div>
          </div>

          <!-- Main Card -->
          <div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid rgba(139,92,246,0.3);border-radius:20px;overflow:hidden;">

            <!-- Banner -->
            <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:32px 28px;text-align:center;">
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">New Hackathon Just Approved</p>
              <h1 style="color:white;font-size:26px;font-weight:800;margin:0;line-height:1.3;">${hackathon.title}</h1>
              ${hackathon.organizerName ? `<p style="color:rgba(255,255,255,0.7);font-size:13px;margin:10px 0 0;">by ${hackathon.organizerName}</p>` : ""}
            </div>

            <!-- Body -->
            <div style="padding:28px;">

              <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 24px;">
                Hey there! 👋 A new hackathon has just been approved on <strong style="color:#a78bfa;">HackHunt</strong>. 
                Don't miss this opportunity to showcase your skills!
              </p>

              <!-- Details -->
              <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px;">
                <h3 style="color:#a78bfa;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Hackathon Details</h3>
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="color:#64748b;font-size:13px;padding:6px 0;width:120px;">📅 Start Date</td>
                    <td style="color:#e2e8f0;font-size:13px;padding:6px 0;font-weight:600;">${startDate}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:13px;padding:6px 0;">🏁 End Date</td>
                    <td style="color:#e2e8f0;font-size:13px;padding:6px 0;font-weight:600;">${endDate}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:13px;padding:6px 0;">📍 Location</td>
                    <td style="color:#e2e8f0;font-size:13px;padding:6px 0;font-weight:600;">${location}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:13px;padding:6px 0;">💻 Mode</td>
                    <td style="color:#e2e8f0;font-size:13px;padding:6px 0;font-weight:600;">${mode.charAt(0).toUpperCase() + mode.slice(1)}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b;font-size:13px;padding:6px 0;">🏆 Prize</td>
                    <td style="color:#fbbf24;font-size:13px;padding:6px 0;font-weight:700;">${prize}</td>
                  </tr>
                </table>
              </div>

              ${hackathon.description ? `
              <div style="margin-bottom:24px;">
                <h3 style="color:#a78bfa;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">About</h3>
                <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0;">${hackathon.description.substring(0, 200)}${hackathon.description.length > 200 ? "..." : ""}</p>
              </div>
              ` : ""}

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0 8px;">
                <a href="http://localhost:5173/login-user" 
                   style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:white;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:0.5px;box-shadow:0 8px 24px rgba(99,102,241,0.4);">
                  🚀 View Hackathon →
                </a>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div style="text-align:center;margin-top:24px;">
            <p style="color:#334155;font-size:12px;margin:0;">
              You're receiving this because you're registered on HackHunt.<br/>
              © 2026 HackHunt. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification sent to ${emails.length} users for: ${hackathon.title}`);
  } catch (error) {
    console.error("❌ Email notification error:", error.message);
  }
};

module.exports = { sendHackathonApprovalNotification };
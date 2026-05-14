import { Worker, type Job } from "bullmq";
import nodemailer from "nodemailer";
import { EMAIL_OTP_QUEUE_NAME, type OtpEmailJobData } from "@unihub/shared";
import { redis } from "../queue";
import { requireEnv } from "../env";

const smtpUser = requireEnv("SMTP_USER");
const smtpPass = requireEnv("SMTP_PASS");
const emailFrom = requireEnv("EMAIL_FROM");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

function buildOtpHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="420" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <tr>
            <td style="background: #4f46e5; padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                UniHub Workshop
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Here is your one-time password to log in:
              </p>
              <div style="background-color: #f8fafc; border: 2px dashed #4f46e5; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #1e293b; font-family: 'Courier New', monospace;">
                  ${otp}
                </span>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                This code expires in <strong>10 minutes</strong>.
              </p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                If you did not request this code, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const mailProcessor = new Worker<OtpEmailJobData>(
  EMAIL_OTP_QUEUE_NAME,
  async (job: Job<OtpEmailJobData>) => {
    const { to, otp } = job.data;

    console.log(`[MAIL_PROCESSOR] Processing job ${job.id} for ${to}`);

    await transporter.sendMail({
      from: emailFrom,
      to,
      subject: "Your UniHub Login OTP",
      html: buildOtpHtml(otp),
    });

    console.log(`[MAIL_PROCESSOR] Email sent to ${to}`);
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

mailProcessor.on("failed", (job, err) => {
  console.error(`[MAIL_PROCESSOR] Job ${job?.id} failed:`, err.message);
});

mailProcessor.on("completed", (job) => {
  console.log(`[MAIL_PROCESSOR] Job ${job.id} completed`);
});

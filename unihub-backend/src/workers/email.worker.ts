import { Worker, Job, Queue } from "bullmq";
import nodemailer from "nodemailer";
import { redis } from "../config/redis";
import { env } from "../config/env";

export interface OtpEmailJobData {
  to: string;
  otp: string;
}

// Create the Queue (exported for use by EmailService)
export const emailOtpQueue = new Queue<OtpEmailJobData>("email-otp", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Generates styled HTML for the OTP email
 */
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
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                🎓 UniHub Workshop
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Here is your one-time password to log in:
              </p>
              <!-- OTP Code Box -->
              <div style="background-color: #f8fafc; border: 2px dashed #667eea; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #1e293b; font-family: 'Courier New', monospace;">
                  ${otp}
                </span>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                ⏱ This code expires in <strong>10 minutes</strong>.
              </p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                UniHub Workshop System &bull; Do not reply to this email
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

// Create and start the worker
const emailWorker = new Worker<OtpEmailJobData>(
  "email-otp",
  async (job: Job<OtpEmailJobData>) => {
    const { to, otp } = job.data;

    console.log(`[EMAIL_WORKER] Processing job ${job.id} → sending OTP to ${to}`);

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: "Your UniHub Login OTP",
      html: buildOtpHtml(otp),
    });

    console.log(`[EMAIL_WORKER] ✓ Email sent to ${to}`);
  },
  {
    connection: redis,
    concurrency: 5,
  },
);

emailWorker.on("failed", (job, err) => {
  console.error(`[EMAIL_WORKER] ✗ Job ${job?.id} failed:`, err.message);
});

emailWorker.on("completed", (job) => {
  console.log(`[EMAIL_WORKER] ✓ Job ${job.id} completed`);
});

export default emailWorker;

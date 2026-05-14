import { emailOtpQueue } from "../../workers/email.worker";

export interface IEmailService {
  sendOtpEmail(email: string, otp: string): Promise<void>;
}

/**
 * Email service that dispatches OTP emails via BullMQ queue.
 * The actual sending is handled by the email worker using Nodemailer.
 */
export class EmailService implements IEmailService {
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    await emailOtpQueue.add("send-otp", { to: email, otp });
    console.log(`[EMAIL_SERVICE] OTP email job enqueued for ${email}`);
  }
}

export const emailService = new EmailService();

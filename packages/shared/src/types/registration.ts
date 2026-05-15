export enum RegStatus {
  PENDING = "PENDING",
  HOLDING = "HOLDING",
  PAID = "PAID",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED",
}

export interface RegistrationJobData {
  userId: string;
  workshopId: string;
  idempotencyKey: string;
}

export interface PaymentTimeoutJobData {
  registrationId: string;
  workshopId: string;
}

export interface NotificationJobData {
  userId: string;
  workshopId: string;
  registrationId: string;
  type: "REGISTRATION_PAID" | "REGISTRATION_FAILED" | "REGISTRATION_EXPIRED" | "PAYMENT_RETRY";
}

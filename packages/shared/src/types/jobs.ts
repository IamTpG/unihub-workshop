export interface OtpEmailJobData {
  to: string;
  otp: string;
}

export interface RegistrationConfirmedEmailJobData {
  to: string;
  userName: string;
  workshopTitle: string;
  workshopDate: string;
  workshopLocation: string;
  registrationId: string;
}

export interface AiSummaryJobData {
  workshopId: string;
  filePath: string;
}

export interface StudentImportJobData {
  importLogId: string;
  filePath: string;
}

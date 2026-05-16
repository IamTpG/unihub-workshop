export interface OtpEmailJobData {
  to: string;
  otp: string;
}

export interface AiSummaryJobData {
  workshopId: string;
  filePath: string;
}

export interface StudentImportJobData {
  importLogId: string;
  filePath: string;
}

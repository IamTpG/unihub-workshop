export interface OtpEmailJobData {
  to: string;
  otp: string;
}

export interface AiSummaryJobData {
  workshopId: string;
  pdfUrl: string;
}

export interface StudentImportJobData {
  importLogId: string;
  filePath: string;
}

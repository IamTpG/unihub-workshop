import { studentImportRepository } from "./student-import.repository.js";
import { studentImportQueue } from "../../infra/queue/student-import.queue.js";

export class StudentImportService {
  async startImport(filename: string, filePath: string) {
    const importLog = await studentImportRepository.createImportLog(filename);

    await studentImportQueue.add("import", {
      importLogId: importLog.id,
      filePath,
    });

    return { importLogId: importLog.id, message: "Import started" };
  }

  async listLogs() {
    return studentImportRepository.listRecentLogs();
  }
}

export const studentImportService = new StudentImportService();

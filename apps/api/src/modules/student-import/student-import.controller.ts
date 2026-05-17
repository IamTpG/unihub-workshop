import { createReadStream, unlinkSync } from "fs";
import { createInterface } from "readline";
import type { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../../infra/errors/AppError.js";
import { studentImportService } from "./student-import.service.js";

const REQUIRED_HEADERS = ["studentId", "email", "fullName"];

async function readFirstLine(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = createInterface({
      input: createReadStream(filePath, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });
    rl.once("line", (line) => {
      // resolve BEFORE close — rl.close() emits "close" synchronously, which would
      // call resolve("") and win the race if we closed first.
      resolve(line.replace(/^\uFEFF/, "")); // strip UTF-8 BOM added by Excel/Windows editors
      rl.close();
    });
    rl.once("error", reject);
    rl.once("close", () => resolve(""));
  });
}

function validateCsvHeaders(headerLine: string): string[] {
  const headers = headerLine.split(",").map((h) =>
    h
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/^\uFEFF/, ""),
  );
  return REQUIRED_HEADERS.filter((required) => !headers.includes(required));
}

export class StudentImportController {
  async uploadStudents(req: Request, res: Response, next: NextFunction) {
    const file = req.file;

    try {
      if (!file) {
        throw new BadRequestError("CSV file is required");
      }

      const ext = file.originalname.split(".").pop()?.toLowerCase();
      const mime = file.mimetype.toLowerCase();
      const isValidType =
        ext === "csv" ||
        mime === "text/csv" ||
        mime === "application/csv" ||
        mime === "text/plain";

      if (!isValidType) {
        unlinkSync(file.path);
        throw new BadRequestError("Only CSV files are accepted");
      }

      const firstLine = await readFirstLine(file.path);
      const missingColumns = validateCsvHeaders(firstLine);

      if (missingColumns.length > 0) {
        unlinkSync(file.path);
        throw new BadRequestError(
          `CSV is missing required columns: ${missingColumns.join(", ")}`,
        );
      }

      const result = await studentImportService.startImport(file.originalname, file.path);

      return res.status(202).json({ success: true, data: result });
    } catch (error) {
      if (req.file?.path) {
        try {
          unlinkSync(req.file.path);
        } catch {
          /* already deleted or never saved */
        }
      }
      return next(error);
    }
  }

  async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await studentImportService.listLogs();
      return res.ok("Import logs retrieved successfully", logs);
    } catch (error) {
      return next(error);
    }
  }
}

export const studentImportController = new StudentImportController();

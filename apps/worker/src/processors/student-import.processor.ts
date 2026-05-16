import { unlinkSync, readFileSync } from "fs";
import { Worker, type Job } from "bullmq";
import { parse } from "csv-parse/sync";
import { prisma } from "@unihub/db";
import { STUDENT_IMPORT_QUEUE_NAME, type StudentImportJobData } from "@unihub/shared";
import { redis } from "../queue.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CsvRow {
  studentId?: string;
  email?: string;
  fullName?: string;
  status?: string;
  [key: string]: string | undefined;
}

async function processStudentImport(job: Job<StudentImportJobData>) {
  const { importLogId, filePath } = job.data;

  console.log(`[STUDENT_IMPORT] Starting job ${job.id}, log ${importLogId}`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // Parse CSV synchronously
    let records: CsvRow[];
    try {
      const content = readFileSync(filePath, "utf-8");
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvRow[];
    } catch (parseErr) {
      console.error(`[STUDENT_IMPORT] Fatal parse error for log ${importLogId}:`, parseErr);
      await prisma.importLog.update({
        where: { id: importLogId },
        data: { status: "FAILED", inserted, updated, skipped, failed },
      });
      return;
    }

    const totalRows = records.length;
    await prisma.importLog.update({
      where: { id: importLogId },
      data: { totalRows },
    });

    // Deduplicate by studentId — last row wins; earlier duplicates counted as skipped
    const deduped = new Map<string, CsvRow>();
    for (const row of records) {
      const sid = row.studentId?.trim();
      if (!sid) continue;
      if (deduped.has(sid)) {
        skipped++;
      }
      deduped.set(sid, row);
    }

    // Count rows with no studentId as failed (they were not added to the map)
    const noIdCount = records.filter((r) => !r.studentId?.trim()).length;
    failed += noIdCount;

    // Process each unique studentId row
    for (const row of deduped.values()) {
      const studentId = row.studentId!.trim();
      const email = row.email?.trim() ?? "";
      const fullName = row.fullName?.trim() ?? "";
      const status = row.status?.trim() || "ACTIVE";

      // Row validation
      if (!email || !fullName || !EMAIL_RE.test(email)) {
        failed++;
        continue;
      }

      try {
        // Check email conflict: email already belongs to a different studentId
        const existingByEmail = await prisma.studentRecord.findUnique({
          where: { email },
          select: { studentId: true },
        });

        if (existingByEmail && existingByEmail.studentId !== studentId) {
          failed++;
          continue;
        }

        // Upsert by studentId
        const existing = await prisma.studentRecord.findUnique({
          where: { studentId },
          select: { id: true },
        });

        if (existing) {
          await prisma.studentRecord.update({
            where: { studentId },
            data: { email, fullName, status },
          });
          updated++;
        } else {
          await prisma.studentRecord.create({
            data: { studentId, email, fullName, status },
          });
          inserted++;
        }
      } catch (rowErr) {
        console.warn(`[STUDENT_IMPORT] Row error for studentId ${studentId}:`, rowErr);
        failed++;
      }
    }

    await prisma.importLog.update({
      where: { id: importLogId },
      data: { status: "DONE", inserted, updated, skipped, failed },
    });

    console.log(
      `[STUDENT_IMPORT] Log ${importLogId} DONE — inserted:${inserted} updated:${updated} skipped:${skipped} failed:${failed}`,
    );
  } finally {
    // Always attempt to delete the temp file
    try {
      unlinkSync(filePath);
    } catch {
      console.warn(`[STUDENT_IMPORT] Could not delete temp file: ${filePath}`);
    }
  }
}

export const studentImportProcessor = new Worker<StudentImportJobData>(
  STUDENT_IMPORT_QUEUE_NAME,
  processStudentImport,
  { connection: redis, concurrency: 1 },
);

studentImportProcessor.on("failed", (job, err) => {
  console.error(`[STUDENT_IMPORT] Job ${job?.id} failed:`, err.message);
});

studentImportProcessor.on("completed", (job) => {
  console.log(`[STUDENT_IMPORT] Job ${job.id} completed`);
});

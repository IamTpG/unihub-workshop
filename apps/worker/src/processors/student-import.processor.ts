import { unlink, readFile } from "fs/promises";
import { Worker, type Job } from "bullmq";
import { parse } from "csv-parse/sync";
import { prisma } from "@unihub/db";
import { STUDENT_IMPORT_QUEUE_NAME, type StudentImportJobData } from "@unihub/shared";
import { redis } from "../queue.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BATCH_SIZE = 100; // rows per Prisma transaction

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
    // Async read — avoids blocking the worker event loop.
    let records: CsvRow[];
    try {
      const content = await readFile(filePath, "utf-8");
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvRow[];
    } catch (parseErr) {
      console.error(
        `[STUDENT_IMPORT] Fatal parse error for log ${importLogId}:`,
        parseErr,
      );
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

    // Deduplicate by studentId — last row wins; earlier duplicates are skipped.
    const deduped = new Map<string, CsvRow>();
    for (const row of records) {
      const sid = row.studentId?.trim();
      if (!sid) continue;
      if (deduped.has(sid)) skipped++;
      deduped.set(sid, row);
    }

    // Rows with no studentId are immediately failed.
    failed += records.filter((r) => !r.studentId?.trim()).length;

    // Validate all rows upfront before touching the DB.
    type ValidRow = { studentId: string; email: string; fullName: string; status: string };
    const validRows: ValidRow[] = [];
    for (const row of deduped.values()) {
      const studentId = row.studentId!.trim();
      const email = row.email?.trim() ?? "";
      const fullName = row.fullName?.trim() ?? "";
      const status = row.status?.trim() || "ACTIVE";

      if (!email || !fullName || !EMAIL_RE.test(email)) {
        failed++;
        continue;
      }
      validRows.push({ studentId, email, fullName, status });
    }

    // Process in batches so each transaction is bounded in size.
    for (let batchStart = 0; batchStart < validRows.length; batchStart += BATCH_SIZE) {
      const batch = validRows.slice(batchStart, batchStart + BATCH_SIZE);

      try {
        const results = await prisma.$transaction(async (tx) => {
          const batchResults: { studentId: string; action: "inserted" | "updated" | "failed" }[] = [];

          for (const row of batch) {
            try {
              // Check email conflict: email already belongs to a different studentId
              const existingByEmail = await tx.studentRecord.findUnique({
                where: { email: row.email },
                select: { studentId: true },
              });

              if (existingByEmail && existingByEmail.studentId !== row.studentId) {
                batchResults.push({ studentId: row.studentId, action: "failed" });
                continue;
              }

              const existing = await tx.studentRecord.findUnique({
                where: { studentId: row.studentId },
                select: { id: true },
              });

              if (existing) {
                await tx.studentRecord.update({
                  where: { studentId: row.studentId },
                  data: { email: row.email, fullName: row.fullName, status: row.status },
                });
                batchResults.push({ studentId: row.studentId, action: "updated" });
              } else {
                await tx.studentRecord.create({
                  data: {
                    studentId: row.studentId,
                    email: row.email,
                    fullName: row.fullName,
                    status: row.status,
                  },
                });
                batchResults.push({ studentId: row.studentId, action: "inserted" });
              }
            } catch (rowErr) {
              console.warn(
                `[STUDENT_IMPORT] Row error for studentId ${row.studentId}:`,
                rowErr,
              );
              batchResults.push({ studentId: row.studentId, action: "failed" });
            }
          }

          return batchResults;
        });

        for (const r of results) {
          if (r.action === "inserted") inserted++;
          else if (r.action === "updated") updated++;
          else failed++;
        }
      } catch (batchErr) {
        // Whole batch failed — count all as failed and continue with next batch.
        console.error(`[STUDENT_IMPORT] Batch ${batchStart}-${batchStart + batch.length} failed:`, batchErr);
        failed += batch.length;
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
    try {
      await unlink(filePath);
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

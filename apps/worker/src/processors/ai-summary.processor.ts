import { readFile, unlink } from "fs/promises";
import { Worker, type Job } from "bullmq";
import { PDFParse } from "pdf-parse";
import { prisma } from "@unihub/db";
import { AI_SUMMARY_QUEUE_NAME, type AiSummaryJobData } from "@unihub/shared";
import { redis } from "../queue.js";

const workshopDetailCacheKey = (workshopId: string) => `workshop:${workshopId}:detail`;

export function cleanPdfText(rawText: string) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildMockSummary(cleanedText: string) {
  const first500Chars = cleanedText.slice(0, 500);
  return `[AI Summary] This workshop covers the following topics: ${first500Chars}...`;
}

async function processAiSummary(job: Job<AiSummaryJobData>) {
  const { workshopId, filePath } = job.data;

  try {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    let extractedText = "";

    try {
      const parsed = await parser.getText();
      extractedText = parsed.text ?? "";
    } finally {
      await parser.destroy();
    }

    const cleanedText = cleanPdfText(extractedText);
    const summary = buildMockSummary(cleanedText);

    await prisma.workshop.update({
      where: { id: workshopId },
      data: { aiSummary: summary },
    });

    await redis.del(workshopDetailCacheKey(workshopId));

    console.log(
      `[AI_SUMMARY] Workshop ${workshopId} summary generated (${cleanedText.length} chars)`,
    );
  } catch (error) {
    console.error(
      `[AI_SUMMARY] Failed to generate summary for workshop ${workshopId}:`,
      error,
    );
    await prisma.workshop.update({
      where: { id: workshopId },
      data: { aiSummary: null },
    });
  } finally {
    // Always clean up the temp file regardless of success or failure.
    try {
      await unlink(filePath);
    } catch {
      console.warn(`[AI_SUMMARY] Could not delete temp file: ${filePath}`);
    }
  }
}

export const aiSummaryProcessor = new Worker<AiSummaryJobData>(
  AI_SUMMARY_QUEUE_NAME,
  processAiSummary,
  { connection: redis, concurrency: 2 },
);

aiSummaryProcessor.on("failed", (job, err) => {
  console.error(`[AI_SUMMARY] Job ${job?.id} failed:`, err.message);
});

aiSummaryProcessor.on("completed", (job) => {
  console.log(`[AI_SUMMARY] Job ${job.id} completed`);
});

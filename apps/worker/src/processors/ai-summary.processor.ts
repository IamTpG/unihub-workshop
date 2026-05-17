import { readFile, unlink } from "fs/promises";
import { Worker, type Job } from "bullmq";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";
import { prisma } from "@unihub/db";
import { AI_SUMMARY_QUEUE_NAME, type AiSummaryJobData } from "@unihub/shared";
import { redis } from "../queue.js";

const workshopDetailCacheKey = (workshopId: string) => `workshop:${workshopId}:detail`;

// Initialise OpenAI client only when the key is present so the worker starts
// fine without it and falls back to the mock summary.
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are an assistant that writes workshop summaries for a university event platform called UniHub.

Given extracted text from a workshop PDF, write a concise summary that covers:
- What the workshop is about (2-3 sentences)
- Key topics or learning outcomes
- Target audience if mentioned
- Speaker or presenter names if mentioned

Rules:
- Keep it under 250 words
- Use plain text only. No markdown, no asterisks, no hashes, no backticks, no bold, no italic.
- For lists, use a simple dash and space (e.g. "- Topic one") on its own line.
- Separate sections with a blank line.
- Use plain, friendly language suitable for students browsing events.
- Do not invent information that is not in the source text.
- If the text is too short or unclear to summarize, say so briefly.`;

export function cleanPdfText(rawText: string) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function generateSummary(cleanedText: string): Promise<string> {
  if (!openai) {
    // Fallback when no API key is configured
    return `[Mock] ${cleanedText.slice(0, 500)}...`;
  }

  // Truncate to ~8 000 chars (~2 000 tokens) to stay well within free-tier limits
  const input = cleanedText.slice(0, 8000);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Summarize the following workshop content:\n\n${input}` },
    ],
    max_tokens: 400,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() ?? `[Mock] ${cleanedText.slice(0, 500)}...`;
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
    const summary = await generateSummary(cleanedText);

    await prisma.workshop.update({
      where: { id: workshopId },
      data: { aiSummary: summary },
    });

    await redis.del(workshopDetailCacheKey(workshopId));

    console.log(
      `[AI_SUMMARY] Workshop ${workshopId} summary generated (${cleanedText.length} chars extracted)`,
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

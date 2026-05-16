import { prisma } from "@unihub/db";
import { aiSummaryQueue } from "../../infra/queue/ai-summary.queue.js";
import { NotFoundError } from "../../infra/errors/AppError.js";

export class AiSummaryService {
  async uploadPdf(workshopId: string, filePath: string) {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: { id: true },
    });

    if (!workshop) {
      throw new NotFoundError("Workshop not found");
    }

    await prisma.workshop.update({
      where: { id: workshopId },
      data: {
        pdfUrl: filePath,
        aiSummary: null,
      },
    });

    await aiSummaryQueue.enqueueSummary(workshopId, filePath);

    return { message: "PDF uploaded. Summary generation started." };
  }
}

export const aiSummaryService = new AiSummaryService();

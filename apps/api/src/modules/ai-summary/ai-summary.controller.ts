import { unlinkSync } from "fs";
import type { NextFunction, Request, Response } from "express";
import { aiSummaryService } from "./ai-summary.service.js";

export class AiSummaryController {
  async uploadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return res.error("PDF file is required", [], 400);
      }

      const result = await aiSummaryService.uploadPdf(String(req.params.id), file.path);
      return res.status(202).json({ success: true, data: result });
    } catch (error) {
      if (req.file?.path) {
        try {
          unlinkSync(req.file.path);
        } catch {
          /* file may already be gone */
        }
      }

      return next(error);
    }
  }
}

export const aiSummaryController = new AiSummaryController();

import { mkdirSync } from "fs";
import path from "path";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { Role } from "@unihub/db";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/rbac.middleware.js";
import { BadRequestError } from "../../infra/errors/AppError.js";
import { aiSummaryController } from "./ai-summary.controller.js";

const pdfUploadDir = path.resolve(process.cwd(), "uploads", "pdfs");

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(pdfUploadDir, { recursive: true });
      cb(null, pdfUploadDir);
    },
    filename: (req, _file, cb) => {
      cb(null, `${String(req.params.id)}.pdf`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new BadRequestError("Only PDF files are accepted"));
      return;
    }

    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadPdf: RequestHandler = (req, res, next) => {
  upload.single("pdf")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new BadRequestError("PDF file must be 10MB or smaller"));
    }

    return next(error);
  });
};

const router = Router();
const adminOnly = [authenticate, requireRoles([Role.ADMIN])];

router.post("/:id/pdf", ...adminOnly, uploadPdf, aiSummaryController.uploadPdf);

export default router;

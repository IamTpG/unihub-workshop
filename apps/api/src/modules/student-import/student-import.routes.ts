import os from "os";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { Role } from "@unihub/db";
import { authenticate } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/rbac.middleware.js";
import { studentImportController } from "./student-import.controller.js";

const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `student-import-${unique}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();
const adminOnly = [authenticate, requireRoles([Role.ADMIN])];

router.post(
  "/students",
  ...adminOnly,
  upload.single("file"),
  studentImportController.uploadStudents,
);
router.get("/logs", ...adminOnly, studentImportController.listLogs);

export default router;

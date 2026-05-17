import { mkdirSync } from "fs";
import path from "path";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { Role } from "@unihub/db";
import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/rbac.middleware";
import { validate } from "../../middleware/validate.middleware";
import { BadRequestError } from "../../infra/errors/AppError";
import { adminWorkshopsController } from "./admin-workshops.controller";
import {
  createWorkshopSchema,
  listWorkshopsQuerySchema,
  updateWorkshopSchema,
  workshopIdParamsSchema,
} from "./admin-workshops.schema";

// ---------------------------------------------------------------------------
// Multer — room layout image upload
// ---------------------------------------------------------------------------
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const imageExtMap: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const imageUploadDir = path.resolve(process.cwd(), "uploads", "room-layouts");

const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(imageUploadDir, { recursive: true });
      cb(null, imageUploadDir);
    },
    filename: (req, file, cb) => {
      const ext = imageExtMap[file.mimetype] ?? ".jpg";
      cb(null, `${String(req.params.id)}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(new BadRequestError("Only JPG, PNG, or WebP images are accepted"));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const uploadImage: RequestHandler = (req, res, next) => {
  imageUpload.single("image")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(new BadRequestError("Image must be 5 MB or smaller"));
    }
    return next(error);
  });
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const router = Router();
const adminOnly = [authenticate, requireRoles([Role.ADMIN])];

router.post(
  "/",
  ...adminOnly,
  validate({ body: createWorkshopSchema }),
  adminWorkshopsController.create,
);

router.get(
  "/",
  ...adminOnly,
  validate({ query: listWorkshopsQuerySchema }),
  adminWorkshopsController.list,
);

router.get(
  "/:id",
  ...adminOnly,
  validate({ params: workshopIdParamsSchema }),
  adminWorkshopsController.getById,
);

router.put(
  "/:id",
  ...adminOnly,
  validate({ params: workshopIdParamsSchema, body: updateWorkshopSchema }),
  adminWorkshopsController.update,
);

router.get(
  "/:id/stats",
  ...adminOnly,
  validate({ params: workshopIdParamsSchema }),
  adminWorkshopsController.getStats,
);

router.post(
  "/:id/room-layout",
  ...adminOnly,
  uploadImage,
  adminWorkshopsController.uploadRoomLayout,
);

export default router;

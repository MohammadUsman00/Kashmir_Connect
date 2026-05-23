import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import {
  createStorefront,
  deleteStorefront,
  exploreStorefronts,
  generateStorefrontShareQr,
  getMyStorefront,
  getPublicStorefront,
  updateStorefront,
  uploadStorefrontImage,
} from "../controllers/storefrontController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const storefrontSchema = z.object({
  business_name: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().optional(),
  sector: z.string().min(1),
  district: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  instagram: z.string().optional(),
});

const storefrontUpdateSchema = storefrontSchema
  .extend({ is_active: z.boolean().optional() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "No changes supplied");

router.post("/", requireAuth, validate(storefrontSchema), createStorefront);
router.get("/my", requireAuth, getMyStorefront);
router.get("/public/:slug", getPublicStorefront);
router.put("/:id", requireAuth, validate(storefrontUpdateSchema), updateStorefront);
router.post(
  "/:id/upload-image",
  requireAuth,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "logo", maxCount: 1 },
  ]),
  uploadStorefrontImage
);
router.post("/:id/share-qr", requireAuth, generateStorefrontShareQr);
router.delete("/:id", requireAuth, deleteStorefront);
router.get("/explore", exploreStorefronts);

export default router;

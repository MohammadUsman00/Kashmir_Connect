import { Router } from "express";
import { z } from "zod";
import {
  adminVerifyBadge,
  generateBadgeQr,
  myBadge,
  requestBadge,
  verifyBadgePublic,
} from "../controllers/badgeController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const requestSchema = z.object({
  storefront_id: z.string().uuid(),
  business_type: z.string().min(1),
  years_in_business: z.number().int().nonnegative(),
  address: z.string().min(1),
  description: z.string().optional(),
});

router.post("/request", requireAuth, validate(requestSchema), requestBadge);
router.get("/my", requireAuth, myBadge);
router.get("/verify/:badge_code", verifyBadgePublic);
router.post("/generate-qr/:badge_code", requireAuth, generateBadgeQr);
router.put("/admin/verify/:badge_id", adminVerifyBadge);

export default router;

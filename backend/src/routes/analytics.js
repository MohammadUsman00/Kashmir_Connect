import { Router } from "express";
import { z } from "zod";
import { myAnalytics, recordEvent } from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const eventSchema = z.object({
  storefront_id: z.string().uuid(),
  event_type: z.enum(["view", "whatsapp_click", "product_view", "badge_scan"]),
  product_id: z.string().uuid().optional(),
  referrer: z.string().optional(),
});

router.post("/event", validate(eventSchema), recordEvent);
router.get("/my", requireAuth, myAnalytics);

export default router;

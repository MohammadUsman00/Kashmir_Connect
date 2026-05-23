import { Router } from "express";
import { z } from "zod";
import { listStorefronts, platformStats, setFeatured } from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const featuredSchema = z.object({
  is_featured: z.boolean(),
});

router.get("/stats", requireAuth, requireAdmin, platformStats);
router.get("/storefronts", requireAuth, requireAdmin, listStorefronts);
router.patch("/storefronts/:id/featured", requireAuth, requireAdmin, validate(featuredSchema), setFeatured);

export default router;

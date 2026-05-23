import { Router } from "express";
import { z } from "zod";
import { approveReview, createReview, myReviews, publicReviews } from "../controllers/reviewsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createSchema = z.object({
  storefront_id: z.string().uuid(),
  author_name: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().optional(),
});

const approveSchema = z.object({
  is_approved: z.boolean(),
});

router.post("/", validate(createSchema), createReview);
router.get("/storefront/:storefrontId", publicReviews);
router.get("/my", requireAuth, myReviews);
router.patch("/:id", requireAuth, validate(approveSchema), approveReview);

export default router;

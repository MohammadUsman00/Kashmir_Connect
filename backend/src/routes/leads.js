import { Router } from "express";
import { z } from "zod";
import { createLead, myLeads, updateLeadStatus } from "../controllers/leadsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createSchema = z.object({
  storefront_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["new", "contacted", "closed"]),
});

router.post("/", validate(createSchema), createLead);
router.get("/my", requireAuth, myLeads);
router.patch("/:id", requireAuth, validate(statusSchema), updateLeadStatus);

export default router;

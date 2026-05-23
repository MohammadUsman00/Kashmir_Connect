import { Router } from "express";
import { z } from "zod";
import { importProductsCsv } from "../controllers/importController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const schema = z.object({
  storefront_id: z.string().uuid(),
  csv: z.string().min(10),
});

router.post("/products-csv", requireAuth, validate(schema), importProductsCsv);

export default router;

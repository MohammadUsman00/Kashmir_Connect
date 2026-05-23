import { Router } from "express";
import { z } from "zod";
import { createOrder, myOrders, updateOrderStatus } from "../controllers/ordersController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const createSchema = z.object({
  storefront_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(5),
  quantity: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "delivered", "cancelled"]),
});

router.post("/", validate(createSchema), createOrder);
router.get("/my", requireAuth, myOrders);
router.patch("/:id", requireAuth, validate(statusSchema), updateOrderStatus);

export default router;

import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import {
  createProduct,
  deleteProduct,
  getStorefrontProducts,
  reorderProducts,
  updateProduct,
  uploadProductImage,
} from "../controllers/productsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const createSchema = z.object({
  storefront_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  price_unit: z.string().optional(),
  category: z.string().optional(),
});

const updateSchema = createSchema.omit({ storefront_id: true }).partial().refine((v) => Object.keys(v).length > 0, "No changes supplied");

const reorderSchema = z.object({
  products: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int(),
    })
  ),
});

router.post("/", requireAuth, validate(createSchema), createProduct);
router.get("/storefront/:storefrontId", getStorefrontProducts);
router.put("/reorder", requireAuth, validate(reorderSchema), reorderProducts);
router.put("/:id", requireAuth, validate(updateSchema), updateProduct);
router.post("/:id/upload-image", requireAuth, upload.single("image"), uploadProductImage);
router.delete("/:id", requireAuth, deleteProduct);

export default router;

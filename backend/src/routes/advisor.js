import { Router } from "express";
import { z } from "zod";
import {
  chat,
  deleteConversation,
  getConversationById,
  listConversations,
} from "../controllers/advisorController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1),
  storefront_id: z.string().uuid().optional(),
  conversation_id: z.string().uuid().optional(),
});

router.post("/chat", requireAuth, validate(chatSchema), chat);
router.get("/conversations", requireAuth, listConversations);
router.get("/conversations/:id", requireAuth, getConversationById);
router.delete("/conversations/:id", requireAuth, deleteConversation);

export default router;

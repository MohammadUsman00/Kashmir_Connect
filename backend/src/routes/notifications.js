import { Router } from "express";
import {
  markAllNotificationsRead,
  markNotificationRead,
  myNotifications,
} from "../controllers/notificationsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/my", requireAuth, myNotifications);
router.patch("/:id/read", requireAuth, markNotificationRead);
router.post("/read-all", requireAuth, markAllNotificationsRead);

export default router;

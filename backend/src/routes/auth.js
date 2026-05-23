import { Router } from "express";
import { z } from "zod";
import {
  forgotPassword,
  login,
  logout,
  me,
  register,
  updatePassword,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  sector: z.enum(["handicrafts", "agriculture", "tourism", "food", "other"]).optional(),
  district: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profileUpdateSchema = z
  .object({
    full_name: z.string().min(1).optional(),
    phone: z.string().optional(),
    business_name: z.string().optional(),
    sector: z.enum(["handicrafts", "agriculture", "tourism", "food", "other"]).optional(),
    district: z.string().optional(),
    bio: z.string().optional(),
    avatar_url: z.string().url().optional(),
    preferred_language: z.enum(["en", "ur"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

const forgotSchema = z.object({ email: z.string().email() });
const passwordSchema = z.object({ password: z.string().min(6) });

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", validate(forgotSchema), forgotPassword);
router.post("/update-password", requireAuth, validate(passwordSchema), updatePassword);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, validate(profileUpdateSchema), updateProfile);

export default router;

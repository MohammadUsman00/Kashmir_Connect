import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import adminRoutes from "./routes/admin.js";
import analyticsRoutes from "./routes/analytics.js";
import authRoutes from "./routes/auth.js";
import advisorRoutes from "./routes/advisor.js";
import badgeRoutes from "./routes/badge.js";
import importRoutes from "./routes/import.js";
import leadsRoutes from "./routes/leads.js";
import notificationsRoutes from "./routes/notifications.js";
import ordersRoutes from "./routes/orders.js";
import productsRoutes from "./routes/products.js";
import reviewsRoutes from "./routes/reviews.js";
import storefrontRoutes from "./routes/storefront.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimit } from "./middleware/rateLimit.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin blocked"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 60_000, max: 120, keyPrefix: "global" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", rateLimit({ max: 30, keyPrefix: "auth" }), authRoutes);
app.use("/api/v1/storefronts", storefrontRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/advisor", rateLimit({ max: 20, keyPrefix: "advisor" }), advisorRoutes);
app.use("/api/v1/badges", badgeRoutes);
app.use("/api/v1/analytics", rateLimit({ max: 60, keyPrefix: "analytics" }), analyticsRoutes);
app.use("/api/v1/leads", rateLimit({ max: 40, keyPrefix: "leads" }), leadsRoutes);
app.use("/api/v1/orders", rateLimit({ max: 40, keyPrefix: "orders" }), ordersRoutes);
app.use("/api/v1/reviews", rateLimit({ max: 40, keyPrefix: "reviews" }), reviewsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/import", importRoutes);

app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`KashmirConnect backend running on http://localhost:${port}`);
});

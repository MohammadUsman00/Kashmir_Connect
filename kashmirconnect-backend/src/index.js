import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import analyticsRoutes from "./routes/analytics.js";
import authRoutes from "./routes/auth.js";
import advisorRoutes from "./routes/advisor.js";
import badgeRoutes from "./routes/badge.js";
import productsRoutes from "./routes/products.js";
import storefrontRoutes from "./routes/storefront.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(
  cors({
    origin: process.env.APP_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/storefronts", storefrontRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/advisor", advisorRoutes);
app.use("/api/v1/badges", badgeRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`KashmirConnect backend running on http://localhost:${port}`);
});

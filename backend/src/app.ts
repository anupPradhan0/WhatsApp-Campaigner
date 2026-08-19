import express from "express";
import type { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { multerErrorHandler } from "./utils/upload.utils.js";
import { loginLimiter } from "./middleware/rate-limiter.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import newsRoutes from "./routes/news.routes.js";
import campaignRoutes from "./routes/campaign.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import supportRoutes from "./routes/support.routes.js";
import brandingRoutes from "./routes/branding.routes.js";
import domainRoutes from "./routes/domain.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Express {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY);

  // Same-origin deploy needs no CORS at all. Only mount it when an origin is
  // explicitly configured — the old `origin: true` fallback reflected any
  // caller's origin back with credentials enabled.
  const corsOrigin = env.CORS_ORIGIN?.trim();
  if (corsOrigin) {
    app.use(cors({ origin: corsOrigin, credentials: true }));
  }

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
      );
    });
    next();
  });

  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: true, limit: "16kb" }));
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "..", "public", "uploads"))
  );
  app.use(cookieParser());
  app.use(loginLimiter);

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/transaction", transactionRoutes);
  app.use("/api/news", newsRoutes);
  app.use("/api/campaigns", campaignRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/complaints", complaintRoutes);
  app.use("/api/support", supportRoutes);
  app.use("/api/branding", brandingRoutes);
  app.use("/api/domain", domainRoutes);

  app.use(multerErrorHandler);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

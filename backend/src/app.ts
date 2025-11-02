import express from "express";
import type { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./DB/connect.DB.js";
import multerErrorHandler from "./Utils/multerError.Utils.js";
import path from "path";
import { fileURLToPath } from "url";
import startCleanupScheduler from "./Jobs/cleanupScheduler.job.js";
import { loginLimiter } from "./Middlewares/rateLimiter.Middleware.js";
import { startCleanupJob } from "./Jobs/cleanupJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: "./.env" });
const PORT: number = parseInt(process.env.PORT || "3000", 10);
if (isNaN(PORT)) {
  console.error("🔴 PORT environment variable is not a valid number. Exiting.");
  process.exit(1);
}
const app: Express = express();

// --- Middlewares ---
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use(multerErrorHandler);
app.use(cookieParser());
app.use(loginLimiter);

// Routes
import authRoutes from "./Routes/auth.Routes.js";
import userRoutes from "./Routes/user.routes.js";
import transactionRoutes from "./Routes/transaction.Routes.js";
import newsRoutes from "./Routes/news.Routes.js";
import campaignRoutes from "./Routes/campaign.routes.js";
import dashboardRoutes from "./Routes/dashboard.Routes.js";
import complaintRoutes from "./Routes/complaint.Routes.js";
import supportRoutes from "./Routes/support.route.js";

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/transaction", transactionRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/support", supportRoutes);

// Start Cleanup Scheduler
startCleanupScheduler();

// --- Database Connection and Server Initialization ---
const startServer = async () => {
  try {
    await connectDB();
    console.log("🟢 MongoDB connected successfully!");
    const server = app.listen(PORT, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
      // Start cleanup job here
      startCleanupJob();
    });
    server.on("error", (error: Error) => {
      console.error(`🔴 Server emitted an error:`, error);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("🔴 Failed to connect to MongoDB:", error.message);
    } else {
      console.error(
        "🔴 An unknown error occurred during DB connection:",
        error
      );
    }
    process.exit(1);
  }
};

startServer();

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  DB_NAME: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  CORS_ORIGIN: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_RECEIVER: z.string().optional(),
  RABBITMQ_URL: z
    .string()
    .min(1)
    .default("amqp://guest:guest@localhost:5672"),
  WORKER_ENABLED: z
    .union([z.literal("true"), z.literal("false")])
    .default("true")
    .transform((v) => v === "true"),
  WORKER_SEND_DELAY_MS: z.coerce.number().int().min(0).default(50),
  WORKER_MAX_RETRIES: z.coerce.number().int().min(0).default(3),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    console.error("Invalid environment variables:", msg);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();

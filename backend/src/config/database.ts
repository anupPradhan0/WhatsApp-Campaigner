import mongoose from "mongoose";
import Campaign from "../models/campaign.model.js";
import Complaint from "../models/complaint.model.js";
import News from "../models/news.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";
import { env } from "./env.js";

const isProd = env.NODE_ENV === "production";

const connectOptions: mongoose.ConnectOptions = {
  maxPoolSize: isProd ? 50 : 10,
  minPoolSize: isProd ? 5 : 0,
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
  maxIdleTimeMS: 60_000,
  retryWrites: true,
};

export async function connectDatabase(): Promise<void> {
  const mongoURI = env.MONGO_URI;
  const dbName = env.DB_NAME;

  let connectionString = mongoURI;

  try {
    const url = new URL(mongoURI);
    const pathName = url.pathname.replace(/^\/+/, "");
    const hasDbName = pathName.length > 0;

    if (!hasDbName) {
      if (!dbName) {
        console.error("Missing DB_NAME when MONGO_URI has no database path.");
        process.exit(1);
      }
      url.pathname = `/${dbName}`;
      connectionString = url.toString();
    }
  } catch {
    if (!dbName) {
      console.error("Missing DB_NAME for non-URL MONGO_URI.");
      process.exit(1);
    }
    const trimmedUri = mongoURI.replace(/\/+$/, "");
    connectionString = `${trimmedUri}/${dbName}`;
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected.");
  });
  mongoose.connection.on("error", (err: Error) => {
    console.error("MongoDB connection error:", err.message);
  });

  const connectionInstance = await mongoose.connect(connectionString, connectOptions);
  console.log(`MongoDB connected. Host: ${connectionInstance.connection.host}`);

  // Mongoose skips building indexes in production unless we sync explicitly.
  await Promise.all([
    User.syncIndexes(),
    Campaign.syncIndexes(),
    Transaction.syncIndexes(),
    Complaint.syncIndexes(),
    News.syncIndexes(),
  ]);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
}

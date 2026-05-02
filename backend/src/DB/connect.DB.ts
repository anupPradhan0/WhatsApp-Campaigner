
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const connectDB = async (): Promise<void> => {
    // 1. Get and validate environment variables
    const mongoURI = process.env.MONGO_URI;
    const dbName = process.env.DB_NAME;

    if (!mongoURI) {
        console.error("🔴 Missing required environment variable: MONGO_URI");
        process.exit(1);
    }

    try {
        let connectionString = mongoURI;

        try {
            const url = new URL(mongoURI);
            const pathName = url.pathname.replace(/^\/+/, "");
            const hasDbName = pathName.length > 0;

            if (!hasDbName) {
                if (!dbName) {
                    console.error("🔴 Missing required environment variable: DB_NAME");
                    process.exit(1);
                }
                url.pathname = `/${dbName}`;
                connectionString = url.toString();
            }
        } catch (error) {
            if (!dbName) {
                console.error("🔴 Missing required environment variable: DB_NAME");
                process.exit(1);
            }

            const trimmedUri = mongoURI.replace(/\/+$/, "");
            connectionString = `${trimmedUri}/${dbName}`;
        }

        const connectionInstance = await mongoose.connect(connectionString);
        console.log(`🟢 MongoDB Connected! Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        // 2. Safely handle the error type
        if (error instanceof Error) {
            console.error(`🔴 MongoDB connection Error: ${error.message}`);
        } else {
            console.error("🔴 An unknown error occurred during DB connection:", error);
        }
        process.exit(1);
    }
};

export default connectDB;

import mongoose, { Document, Schema, model } from "mongoose";

export type NewsStatus = "ACTIVE" | "INACTIVE";

export interface INews extends Document {
  title: string;
  description: string;
  status: NewsStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [1, "Description cannot be empty"],
      maxlength: [10_000, "Description cannot exceed 10000 characters"],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

newsSchema.index({ status: 1, createdAt: -1 });

export default model<INews>("News", newsSchema);

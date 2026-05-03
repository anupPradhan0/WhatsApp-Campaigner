import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  receiverId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: "success" | "failed";
  transactionDate: Date;
  campaignId?: mongoose.Types.ObjectId;
}

const transactionSchema = new Schema<ITransaction>(
  {
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (v: number) =>
          Number.isFinite(v) && v <= Number.MAX_SAFE_INTEGER,
        message: "Amount must be a finite number",
      },
    },
    balanceBefore: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isFinite(v),
        message: "balanceBefore must be a finite number",
      },
    },
    balanceAfter: {
      type: Number,
      required: true,
      validate: {
        validator: (v: number) => Number.isFinite(v),
        message: "balanceAfter must be a finite number",
      },
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
      default: "success",
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ receiverId: 1, transactionDate: -1 });
transactionSchema.index({ senderId: 1, transactionDate: -1 });
transactionSchema.index({ status: 1, type: 1 });

export default mongoose.model<ITransaction>("Transaction", transactionSchema);

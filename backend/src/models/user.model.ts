import mongoose, { Schema, Document, model } from "mongoose";

export enum UserRole {
  USER = "user",
  RESELLER = "reseller",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DELETED = "deleted",
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  companyName: string;
  /** Admin or reseller that created this account; unset for bootstrap admin and self-registration. */
  userID?: mongoose.Types.ObjectId;
  email: string;
  image: string;
  number: number;
  password: string;
  role: UserRole;
  allAdmin: mongoose.Types.ObjectId[];
  allReseller: mongoose.Types.ObjectId[];
  allUsers: mongoose.Types.ObjectId[];
  allCampaign: mongoose.Types.ObjectId[];
  allTransaction: mongoose.Types.ObjectId[];
  allComplaint: mongoose.Types.ObjectId[];
  totalCampaigns: number;
  balance: number;
  status: UserStatus;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      sparse: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    image: {
      type: String,
      default: "",
    },
    number: {
      type: Number,
      required: [true, "Phone number is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    allAdmin: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    allReseller: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    allUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    totalCampaigns: {
      type: Number,
      default: 0,
      min: 0,
    },
    allCampaign: [
      {
        type: Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],
    allTransaction: [
      {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    allComplaint: [
      {
        type: Schema.Types.ObjectId,
        ref: "Complaint",
      },
    ],
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, status: 1 });
userSchema.index({ status: 1, createdAt: -1 });

const User = model<IUser>("User", userSchema);

export default User;

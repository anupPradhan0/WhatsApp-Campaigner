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
  /** Admin or reseller that created this account; unset for the bootstrap super admin and self-registration. */
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

// Hard guarantee that at most one super admin can ever exist. The partial
// filter scopes the uniqueness to super_admin docs only, so it never affects
// admins/resellers/users. A concurrent second bootstrap insert fails with a
// duplicate-key error, which the bootstrap flow maps to "bootstrap disabled".
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: UserRole.SUPER_ADMIN },
    name: "unique_super_admin",
  }
);

const User = model<IUser>("User", userSchema);

export default User;

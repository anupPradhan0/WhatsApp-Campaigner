import mongoose, { Schema, Document, Model } from "mongoose";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  PDF = "pdf",
}

export enum CampaignStats {
  PENDING = "pending",
  DELIVERED = "delivered",
  FAILED = "failed",
  PROCESSING = "processing",
}

export enum MobileNumberEntryType {
  MANUAL = "manual",
  UPLOAD = "upload",
}

export interface IPhoneButton {
  text: string;
  number: string;
}

export interface ILinkButton {
  text: string;
  url: string;
}

export interface ICampaign extends Document {
  campaignName: string;
  message: string;
  phoneButton?: IPhoneButton;
  linkButton?: ILinkButton;
  media?: string;
  mediaType?: MediaType;
  createdBy: mongoose.Types.ObjectId;
  mobileNumberEntryType: MobileNumberEntryType;
  mobileNumbers: string[];
  countryCode: string;
  numberCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: CampaignStats;
  statusMessage?: string;
}

const PhoneButtonSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    number: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) =>
          /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(
            v
          ),
        message: "Please provide a valid phone number",
      },
    },
  },
  { _id: false }
);

const LinkButtonSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) =>
          /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)*\/?$/.test(
            v
          ),
        message: "Please provide a valid URL",
      },
    },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    campaignName: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
      minlength: [3, "Campaign name must be at least 3 characters long"],
      maxlength: [100, "Campaign name cannot exceed 100 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      minlength: [1, "Message cannot be empty"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    phoneButton: {
      type: PhoneButtonSchema,
    },
    linkButton: {
      type: LinkButtonSchema,
    },
    media: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: Object.values(MediaType),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mobileNumberEntryType: {
      type: String,
      enum: Object.values(MobileNumberEntryType),
      required: [true, "Mobile number entry type is required"],
      default: MobileNumberEntryType.MANUAL,
    },
    mobileNumbers: {
      type: [String],
      required: [true, "At least one mobile number is required"],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "At least one mobile number is required",
      },
    },
    countryCode: {
      type: String,
      required: [true, "Country code is required"],
      trim: true,
      validate: {
        validator: (v: string) => /^\+\d{1,4}$/.test(v),
        message: "Please provide a valid country code (e.g., +91)",
      },
    },
    status: {
      type: String,
      enum: Object.values(CampaignStats),
      default: CampaignStats.PENDING,
    },
    statusMessage: {
      type: String,
      trim: true,
      maxlength: [200, "Status message cannot exceed 200 characters"],
    },
    numberCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.pre("save", function (next) {
  if (Array.isArray(this.mobileNumbers)) {
    this.numberCount = this.mobileNumbers.length;
  }
  next();
});

campaignSchema.index({ createdBy: 1, createdAt: -1 });
campaignSchema.index({ createdBy: 1, status: 1 });
campaignSchema.index({ status: 1, createdAt: -1 });

const Campaign: Model<ICampaign> = mongoose.model<ICampaign>(
  "Campaign",
  campaignSchema
);

export default Campaign;

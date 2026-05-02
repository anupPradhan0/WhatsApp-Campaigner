import mongoose, { Schema, Document, model } from 'mongoose';

export enum UserRole {
  USER = 'user',
  RESELLER = 'reseller',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  companyName: string;
  userID: mongoose.Types.ObjectId;
  email: string;
  image: string;
  number: number;
  password: string;
  role: UserRole;
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

const userSchema = new Schema<IUser>({
  userID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
  },
  image: {
    type: String,
    default: '',
  },
  number: {
    type: Number,
    required: [true, 'Phone number is required'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
  },
  balance: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  },
  allReseller: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  allUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  totalCampaigns: {
    type: Number,
    default: 0,
  },
  allCampaign: [{
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
  }],
  allTransaction: [{
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
  }],
  allComplaint: [{
    type: Schema.Types.ObjectId,
    ref: 'Complaint',
  }],
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true 
});

const User = model<IUser>('User', userSchema);

export default User;

import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';

export interface IDeviceInfo {
  userAgent?: string;
  platform?: string;
  browser?: string;
  ipAddress?: string;
}

export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  socketId: string;
  isOnline: boolean;
  lastActivity: Date;
  deviceInfo: IDeviceInfo;
  createdAt: Date;
}

const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String,
    ipAddress: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const UserSession: Model<IUserSession> = mongoose.models.UserSession || 
  mongoose.model<IUserSession>('UserSession', userSessionSchema);

export default UserSession;
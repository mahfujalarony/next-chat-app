import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';

export interface IBlockedUser extends Document {
  blockedBy: mongoose.Types.ObjectId | IUser;
  blockedUser: mongoose.Types.ObjectId | IUser;
  reason: string;
  blockedAt: Date;
}

const blockedUserSchema = new mongoose.Schema({
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    maxlength: 200,
    default: ""
  },
  blockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const BlockedUser: Model<IBlockedUser> = mongoose.models.BlockedUser || 
  mongoose.model<IBlockedUser>('BlockedUser', blockedUserSchema);

export default BlockedUser;
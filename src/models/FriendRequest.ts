import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface IFriendRequest extends Document {
  sender: mongoose.Types.ObjectId | IUser;
  receiver: mongoose.Types.ObjectId | IUser;
  status: FriendRequestStatus;
  message: string;
  sentAt: Date;
  respondedAt: Date | null;
}

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 200,
    default: ""
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const FriendRequest: Model<IFriendRequest> = mongoose.models.FriendRequest || 
  mongoose.model<IFriendRequest>('FriendRequest', friendRequestSchema);

export default FriendRequest;
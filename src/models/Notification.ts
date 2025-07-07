import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';

export type NotificationType = 'message' | 'group_invite' | 'mention' | 'group_add' | 'friend_request';
export type RelatedType = 'message' | 'group' | 'user' | null;

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  relatedId: mongoose.Types.ObjectId | null;
  relatedType: RelatedType;
  actionUrl: string | null;
  createdAt: Date;
  readAt: Date | null;
}

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['message', 'group_invite', 'mention', 'group_add', 'friend_request'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedType: {
    type: String,
    enum: ['message', 'group', 'user', null],
    default: null
  },
  actionUrl: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Notification: Model<INotification> = mongoose.models.Notification || 
  mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
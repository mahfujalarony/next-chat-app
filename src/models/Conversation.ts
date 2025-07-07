import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';
import { IGroup } from './Group';
import { IMessage } from './Message';

export interface IUnreadCount {
  userId: mongoose.Types.ObjectId | IUser;
  count: number;
}

export interface IArchiveStatus {
  userId: mongoose.Types.ObjectId | IUser;
  archived: boolean;
}

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[] | IUser[];
  type: 'direct' | 'group';
  groupId: mongoose.Types.ObjectId | IGroup | null;
  lastMessage: mongoose.Types.ObjectId | IMessage | null;
  lastActivity: Date;
  unreadCount: IUnreadCount[];
  isArchived: IArchiveStatus[];
  createdAt: Date;
}

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCount: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  isArchived: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    archived: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Conversation: Model<IConversation> = mongoose.models.Conversation || 
  mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
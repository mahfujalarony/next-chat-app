import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';
import { IConversation } from './Conversation';
import { IFileUpload } from './FileUpload';

export interface IAttachment {
  fileId: mongoose.Types.ObjectId | IFileUpload;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export interface IReaction {
  userId: mongoose.Types.ObjectId | IUser;
  emoji: string;
  createdAt: Date;
}

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'location' | 'contact';

export interface IMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId | IUser;
  conversationId: mongoose.Types.ObjectId | IConversation;
  messageType: MessageType;
  attachments: IAttachment[];
  replyTo: mongoose.Types.ObjectId | IMessage | null;
  mentions: (mongoose.Types.ObjectId | IUser)[];
  reactions: IReaction[];
  isEdited: boolean;
  editedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: mongoose.Types.ObjectId | IUser | null;
  timestamp: Date;
}

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'location', 'contact'],
    default: 'text'
  },
  attachments: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FileUpload'
    },
    fileName: String,
    fileType: String,
    fileSize: Number,
    fileUrl: String
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Message: Model<IMessage> = mongoose.models.Message || 
  mongoose.model<IMessage>('Message', messageSchema);

export default Message;
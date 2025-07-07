import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';
import { IMessage } from './Message';

export interface IMessageStatus extends Document {
  messageId: mongoose.Types.ObjectId | IMessage;
  userId: mongoose.Types.ObjectId | IUser;
  status: 'sent' | 'delivered' | 'seen';
  timestamp: Date;
}

const messageStatusSchema = new mongoose.Schema({
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const MessageStatus: Model<IMessageStatus> = mongoose.models.MessageStatus || 
  mongoose.model<IMessageStatus>('MessageStatus', messageStatusSchema);

export default MessageStatus;
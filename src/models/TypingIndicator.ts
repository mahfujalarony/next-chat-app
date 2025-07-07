import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';
import { IConversation } from './Conversation';

export interface ITypingIndicator extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  conversationId: mongoose.Types.ObjectId | IConversation;
  isTyping: boolean;
  startedAt: Date;
  lastActivity: Date;
}

const typingIndicatorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  isTyping: {
    type: Boolean,
    default: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const TypingIndicator: Model<ITypingIndicator> = mongoose.models.TypingIndicator || 
  mongoose.model<ITypingIndicator>('TypingIndicator', typingIndicatorSchema);

export default TypingIndicator;
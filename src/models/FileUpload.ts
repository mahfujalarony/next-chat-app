import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';
import { IMessage } from './Message';

export interface IFileUpload extends Document {
  filename: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  fileUrl: string;
  uploadedBy: mongoose.Types.ObjectId | IUser;
  messageId: mongoose.Types.ObjectId | IMessage | null;
  thumbnailUrl: string | null;
  duration: number | null;
  uploadedAt: Date;
  isDeleted: boolean;
}

const fileUploadSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const FileUpload: Model<IFileUpload> = mongoose.models.FileUpload || 
  mongoose.model<IFileUpload>('FileUpload', fileUploadSchema);

export default FileUpload;
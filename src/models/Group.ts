import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';

export interface IGroupSettings {
  onlyAdminCanPost: boolean;
  onlyAdminCanAddMembers: boolean;
  messageDeleteTime: number;
}

export interface IGroup extends Document {
  name: string;
  description: string;
  groupImage: string | null;
  admin: mongoose.Types.ObjectId | IUser;
  members: mongoose.Types.ObjectId[] | IUser[];
  maxMembers: number;
  groupType: 'public' | 'private';
  settings: IGroupSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200,
    default: ""
  },
  groupImage: {
    type: String,
    default: null
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxMembers: {
    type: Number,
    default: 256
  },
  groupType: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  settings: {
    onlyAdminCanPost: {
      type: Boolean,
      default: false
    },
    onlyAdminCanAddMembers: {
      type: Boolean,
      default: false
    },
    messageDeleteTime: {
      type: Number, // in hours, 0 means no auto-delete
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Group: Model<IGroup> = mongoose.models.Group || mongoose.model<IGroup>('Group', groupSchema);

export default Group;
import mongoose, { Document, Model } from 'mongoose';
import { IUser } from './User';
import { IGroup } from './Group';

export interface IPermissions {
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canDeleteMessages: boolean;
  canEditGroup: boolean;
  canPinMessages: boolean;
}

export interface IGroupMember extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  groupId: mongoose.Types.ObjectId | IGroup;
  role: 'admin' | 'moderator' | 'member';
  permissions: IPermissions;
  joinedAt: Date;
  addedBy: mongoose.Types.ObjectId | IUser;
  isActive: boolean;
  leftAt: Date | null;
}

const groupMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'member'],
    default: 'member'
  },
  permissions: {
    canAddMembers: {
      type: Boolean,
      default: false
    },
    canRemoveMembers: {
      type: Boolean,
      default: false
    },
    canDeleteMessages: {
      type: Boolean,
      default: false
    },
    canEditGroup: {
      type: Boolean,
      default: false
    },
    canPinMessages: {
      type: Boolean,
      default: false
    }
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  leftAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const GroupMember: Model<IGroupMember> = mongoose.models.GroupMember || 
  mongoose.model<IGroupMember>('GroupMember', groupMemberSchema);

export default GroupMember;
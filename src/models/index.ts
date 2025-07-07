import User from './User';
import Group from './Group';
import Conversation from './Conversation';
import Message from './Message';
import GroupMember from './GroupMember';
import MessageStatus from './MessageStatus';
import UserSession from './UserSession';
import Notification from './Notification';
import FileUpload from './FileUpload';
import TypingIndicator from './TypingIndicator';
import BlockedUser from './BlockedUser';
import FriendRequest from './FriendRequest';

// Import types
import type { IUser } from './User';
import type { IGroup, IGroupSettings } from './Group';
import type { IConversation, IUnreadCount, IArchiveStatus } from './Conversation';
import type { IMessage, IAttachment, IReaction, MessageType } from './Message';
import type { IGroupMember, IPermissions } from './GroupMember';
import type { IMessageStatus } from './MessageStatus';
import type { IUserSession, IDeviceInfo } from './UserSession';
import type { INotification, NotificationType, RelatedType } from './Notification';
import type { IFileUpload } from './FileUpload';
import type { ITypingIndicator } from './TypingIndicator';
import type { IBlockedUser } from './BlockedUser';
import type { IFriendRequest, FriendRequestStatus } from './FriendRequest';

// Export models
export {
  User,
  Group,
  Conversation,
  Message,
  GroupMember,
  MessageStatus,
  UserSession,
  Notification,
  FileUpload,
  TypingIndicator,
  BlockedUser,
  FriendRequest,
};

// Export types with the 'export type' syntax
export type {
  IUser,
  IGroup,
  IGroupSettings,
  IConversation,
  IUnreadCount,
  IArchiveStatus,
  IMessage,
  IAttachment,
  IReaction,
  MessageType,
  IGroupMember,
  IPermissions,
  IMessageStatus,
  IUserSession,
  IDeviceInfo,
  INotification,
  NotificationType,
  RelatedType,
  IFileUpload,
  ITypingIndicator,
  IBlockedUser,
  IFriendRequest,
  FriendRequestStatus
};
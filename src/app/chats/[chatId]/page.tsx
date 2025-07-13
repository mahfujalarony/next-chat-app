"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import ChatMessages from '@/components/ChatMessages';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import axios from 'axios';

// API client
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

interface Props {
  params: Promise<{ chatId: string }>;
}

// Types
interface User {
  _id: string;
  username: string;
  avatar: string;
  firebaseUid: string;
  isOnline: boolean;
}

interface Conversation {
  _id: string;
  participants: User[];
  type: 'direct' | 'group';
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: string;
  lastActivity: string;
}

// Fetch conversation details
const fetchConversation = async (conversationId: string): Promise<Conversation> => {
  const { data } = await apiClient.get(`/conversations/getConv/${conversationId}`);
  return data.data;
};

// Fetch my MongoDB ID
const fetchMyMongoId = async (firebaseUid: string): Promise<string> => {
  const { data } = await apiClient.get(`/users/getMongoId/${firebaseUid}`);
  return data.data.mongoId;
};

export default function ChatPage({ params }: Props) {
  const resolvedParams = React.use(params);
  const firebaseUid = useSelector((state: any) => state.user.user?.uid);

  // Get my MongoDB ID
  const { data: myMongoId } = useQuery({
    queryKey: ["myMongoId", firebaseUid],
    queryFn: () => fetchMyMongoId(firebaseUid),
    enabled: !!firebaseUid,
  });

  // Get conversation details (optional - for header info)
  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ["conversation", resolvedParams.chatId],
    queryFn: () => fetchConversation(resolvedParams.chatId),
    enabled: !!resolvedParams.chatId,
  });

  // Get chat partner info for header
  const chatPartner = conversation?.participants?.find(
    (p: User) => p.firebaseUid !== firebaseUid
  );

  const chatName = conversation?.type === 'group' 
    ? conversation.groupName 
    : chatPartner?.username || 'Unknown User';

  const chatAvatar = conversation?.type === 'group'
    ? conversation.groupAvatar
    : chatPartner?.avatar;

  const isOnline = conversation?.type === 'direct' ? chatPartner?.isOnline : false;

  if (conversationLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">চ্যাট লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center space-x-3">
        <img
          src={chatAvatar || '/nouser.png'}
          alt={chatName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{chatName}</h2>
          {conversation?.type === 'direct' && (
            <p className="text-sm text-gray-500">
              {isOnline ? (
                <span className="text-green-500">● অনলাইন</span>
              ) : (
                <span className="text-gray-400">● অফলাইন</span>
              )}
            </p>
          )}
          {conversation?.type === 'group' && (
            <p className="text-sm text-gray-500">
              {conversation.participants.length} জন সদস্য
            </p>
          )}
        </div>
        
        {/* Optional: More options button */}
        <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Chat Messages Component */}
      <ChatMessages conversationId={resolvedParams.chatId} />
    </div>
  );
}

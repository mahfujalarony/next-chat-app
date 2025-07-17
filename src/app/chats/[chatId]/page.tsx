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

  // if page is empty
  if (!resolvedParams.chatId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 max-w-md">
          <div className="mx-auto flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No chat selected</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  if (conversationLoading) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Loading Header */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
        </div>
        
        {/* Loading Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${i % 2 === 0 ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900'}`}>
                  <div className="h-3 w-48 bg-gray-300 dark:bg-gray-500 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-gray-300 dark:bg-gray-500 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Loading Input */}
        <div className="border-t dark:border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center space-x-3">
        <img
          src={chatAvatar || '/nouser.png'}
          alt={chatName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{chatName}</h2>
          {conversation?.type === 'direct' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isOnline ? (
                <span className="text-green-500 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </span>
              ) : (
                <span className="text-gray-400 flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                  Offline
                </span>
              )}
            </p>
          )}
          {conversation?.type === 'group' && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {conversation.participants.length} Members
            </p>
          )}
        </div>
        
        <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      <ChatMessages conversationId={resolvedParams.chatId} />
    </div>
  );
}
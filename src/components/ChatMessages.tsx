"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useSocket } from "@/lib/Hooks/useSocket";
import { apiClient } from "@/lib/apiClient";
import { ENV } from "@/lib/env";

console.log("🌐 API Base URL:", ENV.API_URL);

// Health check function
const checkBackendHealth = async () => {
  try {
    const result = await apiClient.healthCheck();
    console.log("✅ Backend health check successful:", result);
    return result.success;
  } catch (error) {
    console.error("❌ Backend health check failed:", error);
    return false;
  }
};

// Types
interface User {
  _id: string;
  username: string;
  avatar: string;
  firebaseUid: string;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: User;
  content: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl: string | null;
  timestamp: string;
}

interface ChatMessagesProps {
  conversationId: string;
}

// Fetch functions
const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  console.log("🔍 Fetching messages for conversation:", conversationId);
  try {
    const { data } = await apiClient.messages.getByConversation(conversationId);
    console.log("✅ Messages fetched successfully:", data);
    return data.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch messages:", error);
    console.error("❌ Error response:", error.response);
    console.error("❌ Error code:", error.code);
    
    if (error.response?.status === 404) {
      throw new Error("Conversation not found");
    } else if (error.response?.status === 401) {
      throw new Error("Permission denied");
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      throw new Error("Could not connect to server. Please check if the server is running.");
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error("Network issue. Please check your internet connection.");
    }
    throw new Error("Problem loading messages");
  }
};

const fetchMyMongoId = async (firebaseUid: string): Promise<string> => {
  console.log("🔍 Fetching MongoDB ID for firebaseUid:", firebaseUid);
  try {
    const { data } = await apiClient.users.getMongoId(firebaseUid);
    console.log("✅ MongoDB ID fetched successfully:", data);
    return data.data.mongoId;
  } catch (error: any) {
    console.error("❌ Failed to fetch MongoDB ID:", error);
    if (error.response?.status === 404) {
      throw new Error("User not found");
    }
    throw new Error("Problem loading user information");
  }
};

const fetchConversationDetails = async (conversationId: string) => {
  console.log("🔍 Fetching conversation details for:", conversationId);
  console.log("🌐 Full URL will be:", `${ENV.API_URL}/conversations/getConversationById/${conversationId}`);
  try {
    const { data } = await apiClient.conversations.getById(conversationId);
    console.log("✅ Conversation details fetched successfully:", data);
    return data.data;
  } catch (error: any) {
    console.error("❌ Failed to fetch conversation details:", error);
    console.error("❌ Error response:", error.response);
    console.error("❌ Error status:", error.response?.status);
    console.error("❌ Error data:", error.response?.data);
    if (error.response?.status === 404) {
      throw new Error("Conversation not found");
    } else if (error.response?.status === 403) {
      throw new Error("You don't have permission to view this conversation");
    }
    throw new Error("Problem loading conversation details");
  }
};

const ChatMessages: React.FC<ChatMessagesProps> = React.memo(({ conversationId }) => {
  const [newMessage, setNewMessage] = useState("");
  const [whoIsTyping, setWhoIsTyping] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log("🎯 ChatMessages component rendering with conversationId:", conversationId);
  
  const firebaseUid = useSelector((state: any) => state.user.user?.uid);
  const currentUser = useSelector((state: any) => state.user.user);
  const socket = useSocket();
  const queryClient = useQueryClient();
  
  console.log("🔍 Component state:", { firebaseUid, currentUser, socket: !!socket });

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkBackendHealth();
      setBackendStatus(isHealthy ? 'online' : 'offline');
    };
    checkHealth();
  }, []);

  // Fetch data with better error handling
  const { data: myMongoId, error: mongoIdError, isLoading: mongoIdLoading } = useQuery({
    queryKey: ["mongoId", firebaseUid],
    queryFn: () => fetchMyMongoId(firebaseUid),
    enabled: !!firebaseUid,
    staleTime: Infinity,
    retry: 2,
  });

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId && !!firebaseUid,
    retry: 3,
  });

  const { data: conversation, isLoading: convLoading, error: convError } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversationDetails(conversationId),
    enabled: !!conversationId && !!firebaseUid,
    retry: (failureCount, error: any) => {
      console.log(`🔄 Conversation fetch attempt ${failureCount + 1}:`, error?.response?.status);
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !conversationId || !myMongoId) return;

    socket.emit("join_conversation", conversationId);

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    };

    const handleUserTyping = ({ userId, username }: { userId: string; username: string }) => {
      if (userId !== myMongoId) {
        setWhoIsTyping(username);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setWhoIsTyping(null), 3000);
      }
    };

    const handleUserStoppedTyping = ({ userId }: { userId: string }) => {
      if (userId !== myMongoId) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setWhoIsTyping(null);
      }
    };

    const handleOnlineUsers = (users: string[]) => {
      setOnlineUsers(new Set(users));
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("users_online", handleOnlineUsers);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("users_online", handleOnlineUsers);
    };
  }, [socket, conversationId, myMongoId, queryClient]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await apiClient.messages.delete(messageId);
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      setActiveMenu(null);
    } catch (error) {
      console.error("❌ Failed to delete message:", error);
      setError("Failed to delete message");
    }
  }, [conversationId, queryClient]);

  const handleReply = (message: Message) => console.log('reply');
  const handleReport = (message: Message) => console.log('report');

  const handleFileChangeAndUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFile = e.target.files[0];
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setFileUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'Problem uploading file');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && !fileUrl) || !myMongoId) return;

    const typeToSend = fileUrl ? "image" : "text";

    try {
      await apiClient.messages.send({
        senderId: myMongoId,
        conversationId,
        content: newMessage,
        messageType: typeToSend,
        fileUrl,
      });

      setNewMessage("");
      setFileUrl(null);

      if (socket) {
        socket.emit("stop_typing", { conversationId, userId: myMongoId });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to send message");
    }
  }, [newMessage, fileUrl, myMongoId, conversationId, socket]);

  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    if (!socket || !myMongoId) return;

    const username = currentUser?.displayName || currentUser?.email || "Unknown User";
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (value.length > 0) {
      socket.emit("typing", { conversationId, userId: myMongoId, username });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { conversationId, userId: myMongoId });
      }, 1000);
    } else {
      socket.emit("stop_typing", { conversationId, userId: myMongoId });
    }
  }, [socket, myMongoId, conversationId, currentUser]);

  const otherParticipant = conversation?.participants?.find((p: any) => p._id !== myMongoId);

  // If user isn't logged in
  if (!firebaseUid) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-r from-blue-50 via-white to-blue-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <h2 className="text-2xl font-bold">Chat Application</h2>
              <p className="mt-2 text-blue-100">Connect with friends and share messages instantly</p>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Please sign in to continue</h3>
                <p className="text-gray-600">You need to be logged in to view and send messages</p>
              </div>
              
              <div className="space-y-4">
                <Link href="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors duration-300">
                  Sign In
                </Link>
                
                <Link href="/register" className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-center py-3 px-4 rounded-lg font-medium transition-colors duration-300">
                  Create Account
                </Link>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Already have an account but having trouble signing in?</p>
                <Link href="/reset-password" className="text-blue-600 hover:underline">
                  Reset your password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If Firebase authentication or MongoDB ID is loading
  if (mongoIdLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="w-full h-full border-4 border-t-blue-500 border-b-blue-300 border-l-blue-300 border-r-blue-300 rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Chat</h2>
            <p className="text-gray-600 mb-8">Authentication in progress...</p>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If there's a problem getting the MongoDB ID
  if (mongoIdError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
                </path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-8">We couldn't verify your identity</p>
            
            <div className="space-y-4">
              <p className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {mongoIdError.message || "Unable to authenticate user"}
              </p>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Go to Login
                </button>
                
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If messages or conversation details are loading
  if (messagesLoading || convLoading) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
        {/* Header skeleton */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center space-x-3 shadow">
          <Link href="/chats" className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="w-8 h-8 rounded-full bg-white/20"></div>
          <div className="flex-1">
            <div className="h-5 bg-white/20 rounded w-24 mb-1"></div>
            <div className="h-3 bg-white/20 rounded w-16"></div>
          </div>
        </div>
        
        {/* Content loading */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="w-12 h-12 mx-auto mb-4">
              <div className="w-full h-full border-4 border-t-blue-500 border-b-blue-200 border-l-blue-200 border-r-blue-200 rounded-full animate-spin"></div>
            </div>
            <p className="text-center text-gray-600">Loading conversation...</p>
            
            {/* Message skeleton */}
            <div className="mt-8 space-y-4">
              <div className="flex justify-start">
                <div className="bg-white rounded-lg shadow-sm p-4 max-w-xs">
                  <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="bg-blue-500/20 rounded-lg shadow-sm p-4 max-w-xs">
                  <div className="h-3 bg-blue-200 rounded w-36 mb-2"></div>
                  <div className="h-3 bg-blue-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Input skeleton */}
        <div className="bg-white border-t p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="flex-1 mx-3 h-10 bg-gray-200 rounded-full"></div>
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  // If conversation details error but we have messages
  if (convError && messages.length === 0) {
    console.log("🚨 Error details:", { messagesError, convError });
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
                </path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Conversation Error</h2>
            <p className="text-gray-600 mb-6">We couldn't load this conversation</p>
            
            <div className="space-y-4">
              <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm text-left">
                {messagesError && <p className="mb-2">Message loading failed: {messagesError.message}</p>}
                {convError && <p>Conversation details failed to load: {convError.message}</p>}
              </div>
              
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Try Again
                </button>
                
                <button 
                  onClick={() => window.location.href = '/chats'}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Back to Chats
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error loading messages but we have conversation details
  if (messagesError && !convError) {
    console.log("🚨 Messages Error:", messagesError);
    return (
      <div className="h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center space-x-3 shadow-lg">
          <Link href="/chats" className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          
          <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
            {otherParticipant?.avatar ? (
              <img 
                src={otherParticipant.avatar} 
                alt={otherParticipant.username || "User"} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/nouser.png";
                }}
              />
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="font-semibold">
              {otherParticipant?.username || "Conversation"}
            </h2>
            <p className="text-sm text-blue-200">Error loading messages</p>
          </div>
        </div>

        {/* Error content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-amber-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z">
                </path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Messages Unavailable</h3>
            <p className="text-gray-600 mb-6">
              {messagesError.message || "We couldn't load messages for this conversation"}
            </p>
            
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Backend Status Warning */}
      {backendStatus === 'offline' && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          No connection to server. Please check if the server is running.
        </div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center space-x-3 shadow-lg">
        <Link href="/chats" className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        
        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
          {otherParticipant?.avatar ? (
            <img 
              src={otherParticipant.avatar} 
              alt={otherParticipant.username || "User"} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/nouser.png";
              }}
            />
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <h2 className="font-semibold">
            {otherParticipant?.username || "Conversation"}
          </h2>
          {whoIsTyping ? (
            <p className="text-sm text-blue-200 flex items-center">
              <span className="mr-1">{whoIsTyping} is typing</span>
              <span className="flex space-x-1">
                <span className="w-1 h-1 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1 h-1 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1 h-1 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
            </p>
          ) : onlineUsers.has(otherParticipant?._id) ? (
            <p className="text-sm text-blue-200 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
              Online
            </p>
          ) : convError ? (
            <p className="text-sm text-blue-200">Loading conversation details...</p>
          ) : (
            <p className="text-sm text-blue-200">Last seen recently</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            disabled={convError}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button 
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] })}
            title="Refresh conversation"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ 
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\" fill=\"%239C92AC\" fill-opacity=\"0.05\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')",
          backgroundSize: "cover"
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-700 mb-1">No messages yet</h3>
            <p className="text-center text-sm text-gray-500 max-w-xs">
              Start a new conversation by typing a message below
            </p>
          </div>
        ) : (
          messages.map((message: Message, index: number) => {
            const isMyMessage = message.sender._id === myMongoId;
            const showTimestamp = index === 0 || new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000;
            return (
              <div key={message._id}>
                {showTimestamp && (
                  <div className="flex justify-center my-4">
                    <div className="bg-white/70 backdrop-blur-sm text-xs text-gray-500 px-3 py-1 rounded-full shadow-sm">
                      {new Date(message.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
                <div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-2`}>
                  {!isMyMessage && (
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 self-end">
                      <img 
                        src={message.sender.avatar || "/nouser.png"} 
                        alt={message.sender.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/nouser.png";
                        }}
                      />
                    </div>
                  )}
                  
                  <div className={`relative max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow-sm ${
                    isMyMessage 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white text-gray-800 rounded-bl-none border"
                  }`}>
                    {message.messageType === "image" && message.fileUrl && (
                      <div className="mb-2 rounded-lg overflow-hidden">
                        <img 
                          src={message.fileUrl} 
                          alt="sent image" 
                          className="max-h-60 w-full object-contain" 
                        />
                      </div>
                    )}
                    
                    {message.content && <p className="text-sm">{message.content}</p>}
                    
                    <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                      isMyMessage ? "text-blue-200" : "text-gray-500"
                    }`}>
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {isMyMessage && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>

                    {/* Message options menu */}
                    {isMyMessage && (
                      <div className="absolute top-1 right-1">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === message._id ? null : message._id)} 
                          className="p-1 rounded-full hover:bg-black/10 text-white/80 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {activeMenu === message._id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-10 overflow-hidden">
                            <button 
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 text-sm font-medium flex items-center" 
                              onClick={() => handleDeleteMessage(message._id)}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isMyMessage && (
                    <div className="w-8 h-8 rounded-full overflow-hidden ml-2 flex-shrink-0 self-end">
                      <img 
                        src={currentUser?.photoURL || "/nouser.png"} 
                        alt="You"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "/nouser.png";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-3 md:p-4">
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm flex items-center">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {fileUrl && (
          <div className="mb-3 relative">
            <div className="relative inline-block">
              <img src={fileUrl} alt="Preview" className="max-w-xs h-auto rounded-lg border" />
              <button 
                onClick={() => setFileUrl(null)} 
                className="absolute top-1 right-1 bg-gray-800/60 text-white p-1 rounded-full hover:bg-gray-900/80"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <label className="cursor-pointer text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChangeAndUpload} disabled={isUploading || !myMongoId} />
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </label>
          
          {isUploading && (
            <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin mr-1"></div>
          )}
          
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 border focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <input 
              type="text" 
              value={newMessage} 
              onChange={(e) => handleTyping(e.target.value)} 
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} 
              placeholder={myMongoId ? "Type a message..." : "Loading..."} 
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500 min-w-0" 
              disabled={!myMongoId}
            />
          </div>
          
          <button 
            onClick={handleSendMessage} 
            disabled={(!newMessage.trim() && !fileUrl) || !myMongoId} 
            className={`p-3 rounded-full transition-colors flex items-center justify-center ${
              (newMessage.trim() || fileUrl) && myMongoId 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatMessages;
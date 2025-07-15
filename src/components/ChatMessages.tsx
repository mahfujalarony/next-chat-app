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
      throw new Error("কথোপকথন খুঁজে পাওয়া যায়নি");
    } else if (error.response?.status === 401) {
      throw new Error("অনুমতি নেই");
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      throw new Error("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে চেক করুন যে সার্ভার চালু আছে।");
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error("নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ চেক করুন।");
    }
    throw new Error("মেসেজ লোড করতে সমস্যা হয়েছে");
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
      throw new Error("ব্যবহারকারী খুঁজে পাওয়া যায়নি");
    }
    throw new Error("ব্যবহারকারীর তথ্য লোড করতে সমস্যা হয়েছে");
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
      throw new Error("কথোপকথন খুঁজে পাওয়া যায়নি");
    } else if (error.response?.status === 403) {
      throw new Error("এই কথোপকথনে অংশগ্রহণের অনুমতি নেই");
    }
    throw new Error("কথোপকথনের তথ্য লোড করতে সমস্যা হয়েছে");
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
    staleTime: Infinity, // firebaseUid পরিবর্তন না হলে রিফেচ হবে না
    retry: 2, // সর্বোচ্চ ২ বার চেষ্টা করবে
  });

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
    retry: 3, // মেসেজের জন্য ৩ বার চেষ্টা
    // refetchInterval সরিয়ে দেওয়া হয়েছে কারণ আমরা Socket.IO ব্যবহার করছি
  });

  const { data: conversation, isLoading: convLoading, error: convError } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversationDetails(conversationId),
    enabled: !!conversationId,
    retry: (failureCount, error: any) => {
      console.log(`🔄 Conversation fetch attempt ${failureCount + 1}:`, error?.response?.status);
      // 404 এর জন্য retry করবে না, অন্য error এর জন্য ২ বার চেষ্টা করবে
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // exponential backoff
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
    } catch (error) {
      console.error("❌ Failed to delete message:", error);
      setError("মেসেজ মুছতে সমস্যা হয়েছে");
    }
  }, [conversationId, queryClient]);

  const handleReply = (message: Message) => console.log('reply');
  const handleReport = (message: Message) => console.log('report');

  const handleFileChangeAndUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFile = e.target.files[0];
    if (!selectedFile.type.startsWith('image/')) {
      setError('অনুগ্রহ করে একটি ছবি ফাইল আপলোড করুন');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('ফাইলের আকার ৫ মেগাবাইটের কম হতে হবে');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'আপলোড ব্যর্থ হয়েছে');
      setFileUrl(data.url);
    } catch (err: any) {
      setError(err.message || 'আপলোড করতে সমস্যা হয়েছে');
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
      setError("মেসেজ পাঠাতে সমস্যা হয়েছে");
    }
  }, [newMessage, fileUrl, myMongoId, conversationId, socket]);

  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    if (!socket || !myMongoId) return;

    const username = currentUser?.displayName || currentUser?.email || "অজানা ব্যবহারকারী";
    
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

  // Firebase authentication বা MongoDB ID লোড হচ্ছে
  if (mongoIdLoading || !firebaseUid) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-t-2 border-green-600 rounded-full animate-spin"></div>
          <div className="text-gray-500">ব্যবহারকারী প্রমাণীকরণ হচ্ছে...</div>
        </div>
      </div>
    );
  }

  // MongoDB ID পেতে সমস্যা হলে
  if (mongoIdError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="text-red-600 font-medium">ব্যবহারকারী প্রমাণীকরণে সমস্যা</div>
          <div className="text-gray-500 text-sm">
            অনুগ্রহ করে আবার লগইন করুন
          </div>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            লগইন পেজে যান
          </button>
        </div>
      </div>
    );
  }

  if (messagesLoading || convLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-t-2 border-green-600 rounded-full animate-spin"></div>
          <div className="text-gray-500">কথোপকথন লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  // যদি কনভার্সেশন ডিটেইলস না পাওয়া যায় কিন্তু মেসেজ আছে, তাহলে মেসেজ দেখাবো
  if (convError && messages.length === 0) {
    console.log("🚨 Error details:", { messagesError, convError });
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="text-red-600 font-medium">কথোপকথন লোড করতে সমস্যা হয়েছে</div>
          <div className="text-gray-500 text-sm">
            {messagesError && <div>মেসেজ লোড করতে ব্যর্থ: {messagesError.message}</div>}
            {convError && <div>কথোপকথনের তথ্য লোড করতে ব্যর্থ: {convError.message}</div>}
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              আবার চেষ্টা করুন
            </button>
            <button 
              onClick={() => window.location.href = '/chats'} 
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              চ্যাট তালিকায় ফিরুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  // যদি শুধু মেসেজ error হয় কিন্তু কনভার্সেশন ডিটেইলস আছে
  if (messagesError && !convError) {
    console.log("🚨 Messages Error:", messagesError);
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4 text-center max-w-md">
          <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div className="text-red-600 font-medium">মেসেজ লোড করতে সমস্যা হয়েছে</div>
          <div className="text-gray-500 text-sm">
            মেসেজ লোড করতে ব্যর্থ: {messagesError.message}
          </div>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["messages", conversationId] })} 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Backend Status Warning */}
      {backendStatus === 'offline' && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm">
          ⚠️ সার্ভারের সাথে সংযোগ নেই। অনুগ্রহ করে সার্ভার চালু আছে কি না চেক করুন।
        </div>
      )}
      
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center space-x-3 shadow-lg">
        <Link href="/chats" className="text-white hover:bg-green-700 rounded-full p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <img 
          src={otherParticipant?.avatar || "/nouser.png"} 
          alt={otherParticipant?.username || "User"} 
          className="w-10 h-10 rounded-full border-2 border-white" 
        />
        <div className="flex-1">
          <h2 className="font-semibold">
            {otherParticipant?.username || "কথোপকথন"}
          </h2>
          {whoIsTyping ? (
            <p className="text-sm text-green-200">{whoIsTyping} টাইপ করছে...</p>
          ) : onlineUsers.has(otherParticipant?._id) ? (
            <p className="text-sm text-green-200">অনলাইন</p>
          ) : convError ? (
            <p className="text-sm text-green-200">কথোপকথনের তথ্য লোড হচ্ছে...</p>
          ) : (
            <p className="text-sm text-green-200">সম্প্রতি দেখা গেছে</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button className="text-white hover:bg-green-700 rounded-full p-2" disabled={convError}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button 
            className="text-white hover:bg-green-700 rounded-full p-2"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] })}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundImage: "url('data:image/svg+xml,...')" }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-center">শুরু করুন একটি নতুন কথোপকথন</p>
          </div>
        ) : (
          messages.map((message: Message, index: number) => {
            const isMyMessage = message.sender._id === myMongoId;
            const showTimestamp = index === 0 || new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000;
            return (
              <div key={message._id}>
                {showTimestamp && <div className="text-center text-xs text-gray-500 my-4">{new Date(message.timestamp).toLocaleString()}</div>}
                <div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-2`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm relative ${isMyMessage ? "bg-green-500 text-white rounded-br-none" : "bg-white text-gray-900 rounded-bl-none border"}`}>
                    <div className="absolute top-0 right-0 m-1">
                      {isMyMessage && (
                        <button onClick={() => setActiveMenu(activeMenu === message._id ? null : message._id)} className="p-1 rounded-full hover:bg-black/10">
                          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" /></svg>
                        </button>
                      )}
                      {activeMenu === message._id && isMyMessage && (
                        <div className="absolute right-0 mt-2 w-24 bg-white border rounded shadow-lg z-10">
                          
                            <button className="block w-full px-4 py-2 text-red-600 hover:bg-gray-100 text-left" onClick={() => handleDeleteMessage(message._id)}>মুছুন</button>
                        
                        </div>
                      )}
                    </div>
                    {message.messageType === "image" && message.fileUrl && <img src={message.fileUrl} alt="sent image" className="rounded-lg mb-2 max-h-60 object-contain" style={{ maxWidth: "320px" }} />}
                    {message.content && <p className="text-sm pr-5">{message.content}</p>}
                    <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${isMyMessage ? "text-green-100" : "text-gray-500"}`}>
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {isMyMessage && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        {error && (
          <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        {fileUrl && <div className="mb-2"><img src={fileUrl} alt="Preview" className="max-w-xs rounded-lg" /></div>}
        <div className="flex items-center space-x-3">
          <label className="cursor-pointer text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChangeAndUpload} disabled={isUploading || !myMongoId} />
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </label>
          {isUploading && <div className="w-5 h-5 border-t-2 border-green-600 rounded-full animate-spin"></div>}
          
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
            <input 
              type="text" 
              value={newMessage} 
              onChange={(e) => handleTyping(e.target.value)} 
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} 
              placeholder={myMongoId ? "একটি মেসেজ লিখুন..." : "লোড হচ্ছে..."} 
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500" 
              disabled={!myMongoId}
            />
          </div>
          
          <button 
            onClick={handleSendMessage} 
            disabled={(!newMessage.trim() && !fileUrl) || !myMongoId} 
            className={`p-3 rounded-full transition-colors ${
              (newMessage.trim() || fileUrl) && myMongoId 
                ? "bg-green-600 text-white hover:bg-green-700" 
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        
        {convError && (
          <div className="mt-2 text-center">
            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] })}
              className="text-sm text-green-600 hover:text-green-700 hover:underline"
            >
              কথোপকথনের তথ্য পুনরায় লোড করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessages;

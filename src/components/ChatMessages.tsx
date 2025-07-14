"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useSocket } from "@/lib/Hooks/useSocket";
import axios from "axios";

// API client
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

console.log("🌐 API Base URL:", apiClient.defaults.baseURL);

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
  timestamp: string;
}

interface ChatMessagesProps {
  conversationId: string;
}

// Fetch functions
const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  console.log("🔍 Fetching messages for conversation:", conversationId);
  try {
    const { data } = await apiClient.get(`/messages/${conversationId}`);
    console.log("✅ Messages fetched successfully:", data);
    return data.data;
  } catch (error) {
    console.error("❌ Failed to fetch messages:", error);
    throw error;
  }
};

const fetchMyMongoId = async (firebaseUid: string): Promise<string> => {
  console.log("🔍 Fetching MongoDB ID for firebaseUid:", firebaseUid);
  try {
    const { data } = await apiClient.get(`/users/getMongoId/${firebaseUid}`);
    console.log("✅ MongoDB ID fetched successfully:", data);
    return data.data.mongoId;
  } catch (error) {
    console.error("❌ Failed to fetch MongoDB ID:", error);
    throw error;
  }
};

const fetchConversationDetails = async (conversationId: string) => {
  console.log("🔍 Fetching conversation details for:", conversationId);
  try {
    const { data } = await apiClient.get(`/conversations/getConversationById/${conversationId}`);
    console.log("✅ Conversation details fetched successfully:", data);
    return data.data;
  } catch (error) {
    console.error("❌ Failed to fetch conversation details:", error);
    throw error;
  }
};

const ChatMessages: React.FC<ChatMessagesProps> = ({ conversationId }) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log("🎯 ChatMessages component rendering with conversationId:", conversationId);
  
  const firebaseUid = useSelector((state: any) => state.user.user?.uid);
  const currentUser = useSelector((state: any) => state.user.user);
  const socket = useSocket();
  const queryClient = useQueryClient();
  
  console.log("🔍 Component state:", { firebaseUid, currentUser, socket: !!socket });

  // Fetch data
  const { data: myMongoId, error: mongoIdError } = useQuery({
    queryKey: ["mongoId", firebaseUid],
    queryFn: () => fetchMyMongoId(firebaseUid),
    enabled: !!firebaseUid,
  });

  console.log("💾 MongoDB ID Query:", { myMongoId, mongoIdError, firebaseUid });

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 1000, // Refetch every second for real-time effect
  });

  console.log("📨 Messages Query:", { messagesCount: messages.length, messagesLoading, messagesError });

  const { data: conversation, isLoading: convLoading, error: convError } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversationDetails(conversationId),
    enabled: !!conversationId,
  });

  console.log("💬 Conversation Query:", { conversation, convLoading, convError });

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug whoIsTyping state changes
  useEffect(() => {
    console.log("🔄 whoIsTyping state changed to:", whoIsTyping);
  }, [whoIsTyping]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !conversationId || !myMongoId) return;

    // Join conversation room
    socket.emit("join_conversation", conversationId);

    // Listen for new messages
    socket.on("new_message", (newMessage: Message) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    });

    // Listen for typing indicators
    socket.on("user_typing", ({ userId, username }: { userId: string; username: string }) => {
      console.log("👨‍💻 User typing received:", { userId, username, myMongoId });
      console.log("👨‍💻 Current whoIsTyping state before:", whoIsTyping);
      if (userId !== myMongoId) {
        console.log("✅ Setting whoIsTyping to:", username);
        setWhoIsTyping(username);
        setTimeout(() => setWhoIsTyping(null), 3000);
      } else {
        console.log("❌ Ignoring own typing event");
      }
    });

    socket.on("user_stopped_typing", ({ userId }: { userId: string }) => {
      console.log("⏹️ User stopped typing received:", { userId, myMongoId });
      if (userId !== myMongoId) {
        console.log("✅ Clearing whoIsTyping");
        setWhoIsTyping(null);
      } else {
        console.log("❌ Ignoring own stop typing event");
      }
    });

    // Listen for online users
    socket.on("users_online", (users: string[]) => {
      setOnlineUsers(new Set(users));
    });

    return () => {
      socket.off("new_message");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
      socket.off("users_online");
    };
  }, [socket, conversationId, myMongoId, queryClient]);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !myMongoId) return;

    try {
      await apiClient.post("/messages/send", {
        senderId: myMongoId,
        conversationId,
        content: newMessage,
        messageType: "text",
      });

      setNewMessage("");
      
      // Stop typing indicator
      if (socket) {
        socket.emit("stop_typing", { conversationId, userId: myMongoId });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Handle typing
  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!socket || !myMongoId) return;
    
    const username = currentUser?.displayName || currentUser?.email || "Unknown User";

    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      console.log("📤 Emitting typing event:", { conversationId, userId: myMongoId, username });
      socket.emit("typing", { 
        conversationId, 
        userId: myMongoId,
        username: username
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      console.log("📤 Emitting stop_typing event:", { conversationId, userId: myMongoId });
      socket.emit("stop_typing", { conversationId, userId: myMongoId });
    }, 1000);
  };

  // Get other participant info
  const otherParticipant = conversation?.participants?.find((p: any) => p._id !== myMongoId);

  if (messagesLoading || convLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">Failed to load messages</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center space-x-3 shadow-lg">
        <Link href="/chats" className="text-white hover:bg-green-700 rounded-full p-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        
        <img
          src={otherParticipant?.avatar || "/nouser.png"}
          alt={otherParticipant?.username || "User"}
          className="w-10 h-10 rounded-full border-2 border-white"
        />
        
        <div className="flex-1">
          <h2 className="font-semibold">{otherParticipant?.username || "Unknown User"}</h2>
          {whoIsTyping ? (
            <p className="text-sm text-green-200">typing...</p>
          ) : onlineUsers.has(otherParticipant?._id) ? (
            <p className="text-sm text-green-200">online</p>
          ) : (
            <p className="text-sm text-green-200">last seen recently</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button className="text-white hover:bg-green-700 rounded-full p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="text-white hover:bg-green-700 rounded-full p-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{
        backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"25\" cy=\"25\" r=\"1\" fill=\"%23f0f0f0\" opacity=\"0.3\"/><circle cx=\"75\" cy=\"75\" r=\"1\" fill=\"%23f0f0f0\" opacity=\"0.3\"/><circle cx=\"50\" cy=\"10\" r=\"0.5\" fill=\"%23f0f0f0\" opacity=\"0.2\"/><circle cx=\"10\" cy=\"60\" r=\"0.5\" fill=\"%23f0f0f0\" opacity=\"0.2\"/><circle cx=\"90\" cy=\"40\" r=\"0.5\" fill=\"%23f0f0f0\" opacity=\"0.2\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>')",
        backgroundSize: "100px 100px"
      }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-center">শুরু করুন একটি নতুন কথোপকথন</p>
          </div>
        ) : (
          messages.map((message: Message, index: number) => {
            const isMyMessage = message.sender._id === myMongoId;
            const showTimestamp = index === 0 || 
              new Date(message.timestamp).getTime() - new Date(messages[index-1].timestamp).getTime() > 300000;

            return (
              <div key={message._id}>
                {showTimestamp && (
                  <div className="text-center text-xs text-gray-500 my-4">
                    {new Date(message.timestamp).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                
                <div className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-2`}>
                  <div 
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      isMyMessage 
                        ? "bg-green-500 text-white rounded-br-none" 
                        : "bg-white text-gray-900 rounded-bl-none border"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
                      isMyMessage ? "text-green-100" : "text-gray-500"
                    }`}>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </span>
                      {isMyMessage && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {whoIsTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-white text-gray-900 rounded-lg rounded-bl-none border px-4 py-2 shadow-sm">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-600">{whoIsTyping} is typing</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
            />
            <button className="text-gray-500 hover:text-gray-700 ml-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2-10H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-colors ${
              newMessage.trim()
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;

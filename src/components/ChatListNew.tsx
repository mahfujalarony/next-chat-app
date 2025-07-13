"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useSocket } from "@/lib/Hooks/useSocket";

// API client
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

// Types
interface User {
  id: string;
  name: string;
  profileImage: string;
  firebaseUid: string;
}

interface ChatItem {
  id: string;
  name: string;
  profileImage: string;
  lastChat: string;
  lastChatTime?: string;
  isOnline: boolean;
  unreadCount: number;
  isTyping: boolean;
  isGroup: boolean;
}

// API functions
const fetchAllUsers = async (firebaseUid: string): Promise<User[]> => {
  const { data } = await apiClient.get(`/users/getAllUsers/${firebaseUid}`);
  return data.data.map((user: any) => ({
    id: user._id,
    name: user.username,
    profileImage: user.avatar || "/nouser.png",
    firebaseUid: user.firebaseUid,
  }));
};

const fetchMongoId = async (firebaseUid: string): Promise<string> => {
  const { data } = await apiClient.get(`/users/getMongoId/${firebaseUid}`);
  return data.data.mongoId;
};

const fetchConversations = async (firebaseUid: string) => {
  const { data } = await apiClient.get(`/conversations/getConvList/${firebaseUid}`);
  return data.data;
};

const ChatList: React.FC = () => {
  const [showContacts, setShowContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const firebaseUid = useSelector((state: any) => state.user.user?.uid);
  const socket = useSocket();
  const queryClient = useQueryClient();

  // MongoDB ID fetch
  const { data: myMongoId } = useQuery({
    queryKey: ["mongoId", firebaseUid],
    queryFn: () => fetchMongoId(firebaseUid),
    enabled: !!firebaseUid,
  });

  // All users fetch (for contact selection)
  const { data: allContacts = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers", firebaseUid],
    queryFn: () => fetchAllUsers(firebaseUid),
    enabled: !!firebaseUid,
  });

  // Conversations fetch and UI mapping
  const { data: allConversations = [], isLoading: convLoading, error: convError } = useQuery({
    queryKey: ["allConversations", firebaseUid],
    queryFn: () => fetchConversations(firebaseUid),
    enabled: !!firebaseUid && !!myMongoId,
    select: (conversations: any[]) => conversations.map((conv: any): ChatItem => {
        const otherParticipant = conv.participants.find((p: any) => p.firebaseUid !== firebaseUid) || conv.participants[0];
        return {
          id: conv._id,
          name: conv.type === 'group' ? conv.groupName || 'Group' : otherParticipant?.username || 'Unknown User',
          profileImage: conv.type === 'group' ? conv.groupAvatar || '/group.png' : otherParticipant?.avatar || '/nouser.png',
          lastChat: conv.lastMessage || "No messages yet",
          lastChatTime: conv.lastActivity,
          isOnline: otherParticipant?.isOnline ?? false,
          unreadCount: conv.unreadCount.find((u: any) => u.userId === myMongoId)?.count ?? 0,
          isTyping: false,
          isGroup: conv.type === 'group',
        };
      }),
  });

  // Create conversation handler
  const handleCreateConversation = async () => {
    if (!myMongoId || selectedContacts.size === 0) {
      alert("কমপক্ষে ১ জন ইউজার সিলেক্ট করুন এবং নিশ্চিত করুন আপনি লগইন আছেন।");
      return;
    }

    try {
      const participants = [myMongoId, ...Array.from(selectedContacts)];
      const type = participants.length > 2 ? 'group' : 'direct';

      let groupName: string | null = null;
      if (type === 'group') {
        groupName = prompt("গ্রুপের নাম দিন:");
        if (!groupName || groupName.trim() === "") {
            return alert("গ্রুপের নাম আবশ্যক।");
        }
      }
      
      const response = await apiClient.post("/conversations/createConv", {
        participants,
        type,
        groupName,
      });

      if (response.status === 201 || response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ["allConversations", firebaseUid] });
        setShowContacts(false);
        setSelectedContacts(new Set());
        alert(response.data.message || "Conversation তৈরি হয়েছে!");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || "Conversation তৈরি করা যায়নি।";
      alert(message);
      console.error("Conversation creation failed:", error);
    }
  };

  // Delete conversation handler
  const handleDelete = async (chatId: string) => {
    if (!confirm("আপনি কি এই কনভার্সেশনটি মুছে ফেলতে চান?")) return;
    try {
      await apiClient.delete(`/conversations/deleteConv/${firebaseUid}/${chatId}`);
      queryClient.invalidateQueries({ queryKey: ["allConversations", firebaseUid] });
      alert("Conversation মুছে ফেলা হয়েছে।");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("মুছে ফেলা যায়নি।");
    }
    setActiveMenuId(null);
  };

  const handleMenuToggle = (chatId: string) => {
    setActiveMenuId((prevId) => (prevId === chatId ? null : chatId));
  };
  
  const handleMarkAsUnread = (chatId: string) => {
    alert(`Marked ${chatId} as unread (এই ফিচারটি implement করতে হবে)`);
    setActiveMenuId(null);
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) newSet.delete(contactId);
      else newSet.add(contactId);
      return newSet;
    });
  };

  // Socket event listener for new conversations
  useEffect(() => {
    if (!firebaseUid || !myMongoId || !socket) return;

    // Socket connection
    socket.connect();

    // Join user room
    socket.emit("join", myMongoId);

    // New conversation listener
    socket.on("new-conversation", (newConv: any) => {
      console.log("New conversation via socket:", newConv);

      if (newConv.participants.some((p: any) => p.toString() === myMongoId)) {
        queryClient.invalidateQueries({ queryKey: ["allConversations", firebaseUid] });
      }
    });

    // Conversation deleted listener
    socket.on("conversation-deleted", (data: any) => {
      console.log("Conversation deleted via socket:", data);
      queryClient.invalidateQueries({ queryKey: ["allConversations", firebaseUid] });
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.off("new-conversation");
        socket.off("conversation-deleted");
      }
    };
  }, [firebaseUid, myMongoId, queryClient, socket]);

  if (usersLoading || convLoading) {
    return <div className="text-center p-4">লোড হচ্ছে...</div>;
  }

  if (convError) {
    return <div className="text-center p-4">ডাটা লোড করতে সমস্যা হচ্ছে: {convError.message}</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header - WhatsApp style */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/nouser.png" 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <h1 className="text-xl font-semibold">WhatsApp</h1>
        </div>
        <button
          onClick={() => setShowContacts((prev) => !prev)}
          className="bg-green-700 hover:bg-green-800 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
          title="নতুন চ্যাট"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 border-b">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full bg-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Contact Selection Modal */}
      {showContacts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-11/12 max-w-md max-h-[80vh] overflow-hidden">
            <div className="bg-green-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">নতুন চ্যাট</h3>
              <button
                onClick={() => {
                  setShowContacts(false);
                  setSelectedContacts(new Set());
                }}
                className="text-white hover:bg-green-700 rounded-full p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="text-sm text-gray-600 mb-2">
                {selectedContacts.size === 0 ? "Select contacts" : `${selectedContacts.size} selected`}
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              {usersLoading ? (
                <div className="p-8 text-center text-gray-500">লোড হচ্ছে...</div>
              ) : allContacts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">কোনো ইউজার পাওয়া যায়নি</div>
              ) : (
                allContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedContacts.has(contact.id) ? "bg-green-50" : ""
                    }`}
                    onClick={() => toggleContactSelection(contact.id)}
                  >
                    <div className="relative">
                      <img
                        src={contact.profileImage || "/nouser.png"}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {selectedContacts.has(contact.id) && (
                        <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{contact.name}</div>
                      <div className="text-sm text-gray-500">WhatsApp এ আছে</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedContacts.size > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={handleCreateConversation}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  চ্যাট শুরু করুন ({selectedContacts.size})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {convLoading ? (
          <div className="p-8 text-center text-gray-500">লোড হচ্ছে...</div>
        ) : convError ? (
          <div className="p-8 text-center text-red-500">ডাটা লোড করতে সমস্যা হচ্ছে</div>
        ) : allConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <svg className="w-24 h-24 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">কোনো চ্যাট নেই</h3>
            <p className="text-center mb-4">আপনার বন্ধুদের সাথে চ্যাট শুরু করুন</p>
            <button
              onClick={() => setShowContacts(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              নতুন চ্যাট শুরু করুন
            </button>
          </div>
        ) : (
          allConversations.map((chat: ChatItem) => (
            <div key={chat.id} className="relative group border-b border-gray-100 hover:bg-gray-50">
              <Link href={`/chats/${chat.id}`} className="flex items-center p-4 space-x-3">
                <div className="relative">
                  <img
                    src={chat.profileImage || "/nouser.png"}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-gray-500">
                        {chat.lastChatTime ? new Date(chat.lastChatTime).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        }) : ""}
                      </span>
                      {chat.unreadCount > 0 && (
                        <div className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-1">
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-1">
                    {chat.isTyping ? (
                      <div className="flex items-center text-green-600">
                        <span className="text-sm">typing</span>
                        <div className="flex space-x-1 ml-2">
                          <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                          <div className="w-1 h-1 bg-green-600 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 truncate">{chat.lastChat}</p>
                    )}
                    {!chat.isTyping && (
                      <div className="ml-auto">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Context Menu */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMenuToggle(chat.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
                
                {activeMenuId === chat.id && (
                  <div className="absolute right-0 top-8 w-48 bg-white border rounded-lg shadow-lg z-50 py-1">
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleMarkAsUnread(chat.id)}
                    >
                      Mark as unread
                    </button>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      onClick={() => handleDelete(chat.id)}
                    >
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;

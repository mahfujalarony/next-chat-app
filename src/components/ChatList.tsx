"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useSocket } from "@/lib/Hooks/useSocket";
import { auth } from "@/lib/firebase";
import { FiSearch, FiMessageSquare, FiX, FiCheck, FiMoreVertical, FiTrash2, FiEyeOff } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

// API client
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
} );

// --- TYPES ---
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

// --- API FUNCTIONS ---
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

// --- SUB-COMPONENTS ---

// Skeleton Loader for Chat List
const ChatListItemSkeleton: React.FC = () => (
  <div className="flex items-center p-4 space-x-4 animate-pulse">
    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

// Header Component
const ChatListHeader: React.FC<{ onNewChat: () => void }> = ({ onNewChat }) => (
  <div className="bg-gray-100 text-gray-800 p-3 flex items-center justify-between border-b">
    <div className="flex items-center gap-3">
        <FaWhatsapp className="text-green-500 text-3xl" />
        <h1 className="text-xl font-bold">Chats</h1>
    </div>
    <button
      onClick={onNewChat}
      className="text-gray-500 hover:text-green-600 hover:bg-gray-200 rounded-full p-2 transition-colors"
      title="New chat"
    >
      <FiMessageSquare size={22} />
    </button>
  </div>
);

// Search Bar Component
const SearchBar: React.FC<{ onSearch: (term: string) => void }> = ({ onSearch }) => (
    <div className="p-3 bg-gray-100 border-b">
        <div className="relative">
            <FiSearch className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
                type="text"
                placeholder="Search or start new chat"
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-white rounded-full pl-10 pr-4 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
            />
        </div>
    </div>
);

// Empty State for Chat List
const EmptyChatView: React.FC<{ onNewChat: () => void }> = ({ onNewChat }) => (
  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
    <FiMessageSquare className="w-24 h-24 mb-4 text-gray-300" />
    <h3 className="text-xl font-medium mb-2">No Chats Yet</h3>
    <p className="mb-6">Click the button below to start a new conversation.</p>
    <button
      onClick={onNewChat}
      className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
    >
      Start a New Chat
    </button>
  </div>
);

// Individual Chat Item Component
// Individual Chat Item Component with State-based Hover for guaranteed stability
const ChatListItem: React.FC<{ 
    chat: ChatItem; 
    onMenuToggle: (id: string) => void; 
    activeMenuId: string | null; 
    onDelete: (id: string) => void; 
    onMarkUnread: (id: string) => void; 
}> = ({ chat, onMenuToggle, activeMenuId, onDelete, onMarkUnread }) => {
    // State to reliably track hover status
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative"
            // These events control the hover state reliably
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link href={`/chats/${chat.id}`} className="flex items-center p-3 space-x-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                {/* Profile Image and Online Status */}
                <div className="relative">
                    <img src={chat.profileImage} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                    {chat.isOnline && !chat.isGroup && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                </div>
                
                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 truncate">{chat.name}</h3>
                        <span className="text-xs text-gray-500">
                            {chat.lastChatTime ? new Date(chat.lastChatTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <p className={`text-sm truncate ${chat.unreadCount > 0 ? 'text-gray-800 font-semibold' : 'text-gray-600'}`}>
                            {chat.isTyping ? <span className="text-green-600">typing...</span> : chat.lastChat}
                        </p>
                        {chat.unreadCount > 0 && (
                            <div className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Context Menu - Controlled by isHovered or activeMenuId state */}
            {(isHovered || activeMenuId === chat.id) && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                    {/* More Options Button */}
                    <button 
                        onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            onMenuToggle(chat.id); 
                        }} 
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-gray-700"
                    >
                        <FiMoreVertical size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === chat.id && (
                        <div className="absolute right-0 top-10 w-48 bg-white border rounded-md shadow-xl z-20 py-1 animate-fade-in-fast">
                            <button onClick={() => onMarkUnread(chat.id)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <FiEyeOff /> Mark as unread
                            </button>
                            <button onClick={() => onDelete(chat.id)} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <FiTrash2 /> Delete chat
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// Contact Selection Modal
const ContactModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    contacts: User[];
    isLoading: boolean;
    selectedContacts: Set<string>;
    onToggle: (id: string) => void;
    onCreate: () => void;
}> = ({ isOpen, onClose, contacts, isLoading, selectedContacts, onToggle, onCreate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
                <div className="bg-gray-100 p-4 flex items-center justify-between border-b">
                    <h3 className="text-lg font-bold text-gray-800">New Chat</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2">
                        <FiX size={22} />
                    </button>
                </div>
                <div className="overflow-y-auto flex-grow">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <ChatListItemSkeleton key={i} />)
                    ) : contacts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No users found.</div>
                    ) : (
                        contacts.map((contact) => (
                            <div key={contact.id} onClick={() => onToggle(contact.id)} className="flex items-center space-x-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="relative">
                                    <img src={contact.profileImage} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                                    {selectedContacts.has(contact.id) && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                            <FiCheck className="text-white text-2xl" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-900">{contact.name}</div>
                                    <div className="text-sm text-gray-500">Available</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {selectedContacts.size > 0 && (
                    <div className="p-4 border-t bg-gray-50">
                        <button onClick={onCreate} className="w-full bg-green-600 text-white py-3 rounded-full font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg">
                            Start Chat ({selectedContacts.size})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const ChatList: React.FC = () => {
  const [showContacts, setShowContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window !== "undefined" && auth) {
      setUser(auth.currentUser);
    }
  }, []);

  const firebaseUid = useSelector((state: any) => state.user.user?.uid) || user?.uid;

  const { data: myMongoId } = useQuery({
    queryKey: ["mongoId", firebaseUid],
    queryFn: () => fetchMongoId(firebaseUid),
    enabled: !!firebaseUid,
  });

  const { data: allContacts = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers", firebaseUid],
    queryFn: () => fetchAllUsers(firebaseUid),
    enabled: !!firebaseUid,
  });

  const { data: allConversations = [], isLoading: convLoading, error: convError } = useQuery({
    queryKey: ["allConversations", firebaseUid],
    queryFn: () => fetchConversations(firebaseUid),
    enabled: !!firebaseUid && !!myMongoId,
    select: (conversations: any[]) =>
      conversations.map((conv: any): ChatItem => {
        const otherParticipant = conv.participants.find((p: any) => p.firebaseUid !== firebaseUid) || conv.participants[0];
        return {
          id: conv._id,
          name: conv.type === "group" ? conv.groupName || "Group" : otherParticipant?.username || "Unknown User",
          profileImage: conv.type === "group" ? conv.groupAvatar || "/group.png" : otherParticipant?.avatar || "/nouser.png",
          lastChat: conv.lastMessage || "No messages yet",
          lastChatTime: conv.lastActivity,
          isOnline: otherParticipant?.isOnline ?? false,
          unreadCount: conv.unreadCount.find((u: any) => u.userId === myMongoId)?.count ?? 0,
          isTyping: false, // This needs real-time logic
          isGroup: conv.type === "group",
        };
      }),
  });

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return allConversations;
    return allConversations.filter((chat: ChatItem) =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allConversations, searchTerm]);

  const handleCreateConversation = async () => {
    if (!myMongoId || selectedContacts.size === 0) return alert("Please select at least one user.");

    try {
      const participants = [myMongoId, ...Array.from(selectedContacts)];
      const type = participants.length > 2 ? "group" : "direct";
      let groupName: string | null = null;

      if (type === "group") {
        groupName = prompt("Enter a group name:");
        if (!groupName?.trim()) return alert("Group name is required.");
      }

      await apiClient.post("/conversations/createConv", { participants, type, groupName });
      queryClient.invalidateQueries({ queryKey: ["allConversations", firebaseUid] });
      setShowContacts(false);
      setSelectedContacts(new Set());
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      alert(axiosError.response?.data?.message || "Failed to create conversation.");
      console.error("Conversation creation failed:", error);
    }
  };

  const handleDelete = async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await apiClient.delete(`/conversations/deleteConv/${firebaseUid}/${chatId}`);
      queryClient.invalidateQueries({ queryKey: ["allConversations", firebaseUid] });
    } catch (err) {
      alert("Failed to delete conversation.");
    }
    setActiveMenuId(null);
  };

  const handleMarkAsUnread = (chatId: string) => {
    alert(`Marked ${chatId} as unread (feature not implemented)`);
    setActiveMenuId(null);
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev);
      newSet.has(contactId) ? newSet.delete(contactId) : newSet.add(contactId);
      return newSet;
    });
  };

  useEffect(() => {
    if (!firebaseUid || !myMongoId || !socket) return;
    socket.connect();
    socket.emit("join", myMongoId);

    const invalidateConv = () => queryClient.invalidateQueries({ queryKey: ["allConversations", firebaseUid] });

    socket.on("new-conversation", invalidateConv);
    socket.on("conversation-deleted", invalidateConv);

    return () => {
      socket.off("new-conversation", invalidateConv);
      socket.off("conversation-deleted", invalidateConv);
    };
  }, [firebaseUid, myMongoId, queryClient, socket]);

  const handleCloseModal = () => {
    setShowContacts(false);
    setSelectedContacts(new Set());
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto flex flex-col bg-white shadow-lg border-r">
      <ChatListHeader onNewChat={() => setShowContacts(true)} />
      <SearchBar onSearch={setSearchTerm} />

      <ContactModal
        isOpen={showContacts}
        onClose={handleCloseModal}
        contacts={allContacts}
        isLoading={usersLoading}
        selectedContacts={selectedContacts}
        onToggle={toggleContactSelection}
        onCreate={handleCreateConversation}
      />

      <div className="flex-1 overflow-y-auto">
        {convLoading ? (
          Array.from({ length: 8 }).map((_, i) => <ChatListItemSkeleton key={i} />)
        ) : convError ? (
          <div className="p-8 text-center text-red-500">Failed to load chats: {convError.message}</div>
        ) : filteredConversations.length === 0 ? (
          <EmptyChatView onNewChat={() => setShowContacts(true)} />
        ) : (
          filteredConversations.map((chat: ChatItem) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              activeMenuId={activeMenuId}
              onMenuToggle={(id) => setActiveMenuId(prev => prev === id ? null : id)}
              onDelete={handleDelete}
              onMarkUnread={handleMarkAsUnread}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;

"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";

const dummyChats = [
  { id: 1, name: "Friend 1", lastMessage: "last msg...", time: "10:31" },
  { id: 2, name: "Friend 2", lastMessage: "hello!", time: "10:32" },
];

const dummyFriend = {
  name: "Friend 1",
  status: "online",
  photoURL: "/nouser.png",
};

const initialMessages = [
  { id: 1, fromMe: false, text: "Hi! How are you?", time: "10:30" },
  { id: 2, fromMe: true, text: "I'm fine, thanks! 😊", time: "10:31" },
];

export default function ChatPage() {
  const { user, loading } = useSelector((state: RootState) => state.user);
  const [messages, setMessages] = useState(initialMessages);

  const handleSend = (msg: string) => {
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, fromMe: true, text: msg, time: new Date().toLocaleTimeString().slice(0, 5) },
    ]);
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in</p>;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        user={{
          name: user.displayName || "Unknown",
          photoURL: user.photoURL || "/nouser.png",
        }}
        chats={dummyChats}
      />
      <main className="flex-1 flex flex-col">
        <ChatHeader friend={dummyFriend} />
        <ChatMessages messages={messages} />
        <ChatInput onSend={handleSend} />
      </main>
    </div>
  );
}

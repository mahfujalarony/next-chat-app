import React from "react";

interface ChatHeaderProps {
  friend: {
    name: string;
    status: string;
    photoURL?: string;
  };
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ friend }) => (
  <div className="flex items-center px-6 py-4 border-b bg-white shadow">
    <img
      src={friend.photoURL || "/avatar.png"}
      alt={friend.name}
      className="w-10 h-10 rounded-full mr-4"
    />
    <div className="flex-1">
      <div className="font-semibold">{friend.name}</div>
      <div className="text-xs text-gray-400">{friend.status}</div>
    </div>
    <button className="text-gray-500 hover:text-gray-700 ml-2">⋮</button>
  </div>
);

export default ChatHeader;
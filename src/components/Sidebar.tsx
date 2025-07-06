import React from "react";

interface SidebarProps {
  user: {
    name: string;
    photoURL?: string;
  };
  chats: {
    id: number;
    name: string;
    lastMessage: string;
    time: string;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ user, chats }) => (
  <aside className="w-1/3 md:w-1/4 bg-white border-r flex flex-col">
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={user.photoURL || "/avatar.png"}
          alt="profile"
          className="w-10 h-10 rounded-full border"
        />
        <span className="font-bold">{user.name}</span>
      </div>
      <button className="text-green-500 font-bold text-2xl">+</button>
    </div>
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => (
        <div key={chat.id} className="flex items-center px-4 py-3 hover:bg-gray-100 border-b cursor-pointer">
          <div className="w-10 h-10 bg-green-300 rounded-full mr-3"></div>
          <div className="flex-1">
            <div className="font-semibold">{chat.name}</div>
            <div className="text-xs text-gray-500 truncate">{chat.lastMessage}</div>
          </div>
          <div className="text-xs text-gray-400 ml-2">{chat.time}</div>
        </div>
      ))}
    </div>
  </aside>
);

export default Sidebar;
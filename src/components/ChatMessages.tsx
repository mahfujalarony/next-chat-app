import React from "react";

interface Message {
  id: number;
  fromMe: boolean;
  text: string;
  time: string;
}

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => (
  <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2 bg-gray-50">
    {messages.map((msg) =>
      msg.fromMe ? (
        <div key={msg.id} className="flex flex-col items-end">
          <div className="bg-green-200 px-4 py-2 rounded-2xl shadow text-sm max-w-xs">
            {msg.text}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 mr-2">{msg.time}</span>
        </div>
      ) : (
        <div key={msg.id} className="flex flex-col items-start">
          <div className="bg-white px-4 py-2 rounded-2xl shadow text-sm max-w-xs">
            {msg.text}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 ml-2">{msg.time}</span>
        </div>
      )
    )}
  </div>
);

export default ChatMessages;
import React, { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  };

  return (
    <form className="flex items-center px-4 py-3 border-t bg-white" onSubmit={handleSubmit}>
      <input
        type="text"
        className="flex-1 border rounded-full px-4 py-2 mr-2 outline-none focus:ring-2 focus:ring-green-400"
        placeholder="Type a message"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full px-4 py-2"
      >
        Send
      </button>
    </form>
  );
};

export default ChatInput;
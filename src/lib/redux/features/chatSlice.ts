// src/lib/redux/features/chat/chatSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Message interface define করুন
interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  timestamp: string;
}

// State interface define করুন
interface ChatState {
  messages: Message[];
  currentChatId: string | null;
}

const initialState: ChatState = {
  messages: [],
  currentChatId: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    setCurrentChatId: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
  },
});

export const { setMessages, setCurrentChatId, addMessage } = chatSlice.actions;
export default chatSlice.reducer;
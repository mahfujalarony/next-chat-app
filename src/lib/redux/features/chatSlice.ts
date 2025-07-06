// src/lib/redux/features/chat/chatSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  currentChatId: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setCurrentChatId: (state, action) => {
      state.currentChatId = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
});

export const { setMessages, setCurrentChatId, addMessage } = chatSlice.actions;
export default chatSlice.reducer;

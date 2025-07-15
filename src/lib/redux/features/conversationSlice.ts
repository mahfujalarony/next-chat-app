// src/lib/redux/features/conversation/conversationSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Conversation interface define করুন
interface Conversation {
  _id: string;
  participants: {
    _id: string;
    username: string;
    avatar: string;
  }[];
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: string;
  };
  updatedAt: string;
  createdAt: string;
}

// State interface define করুন
interface ConversationState {
  list: Conversation[];
  selectedConversationId: string | null;
}

const initialState: ConversationState = {
  list: [], // সব conversation
  selectedConversationId: null,
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.list = action.payload;
    },
    selectConversation: (state, action: PayloadAction<string | null>) => {
      state.selectedConversationId = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.list.push(action.payload);
    },
  },
});

export const {
  setConversations,
  selectConversation,
  addConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;
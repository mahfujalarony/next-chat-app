// src/lib/redux/features/conversation/conversationSlice.ts

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [], // সব conversation
  selectedConversationId: null,
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.list = action.payload;
    },
    selectConversation: (state, action) => {
      state.selectedConversationId = action.payload;
    },
    addConversation: (state, action) => {
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

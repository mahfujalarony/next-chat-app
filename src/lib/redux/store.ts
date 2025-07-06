import { configureStore } from "@reduxjs/toolkit";
import registerReducer from "./features/registerSlice"; 
import  chatReducer  from "./features/chatSlice";
import conversationReducer from "./features/conversationSlice"; 

export const store = configureStore({
  reducer: {
    register: registerReducer,
    chat: chatReducer,
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

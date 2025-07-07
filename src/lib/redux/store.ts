import { configureStore } from "@reduxjs/toolkit";
import registerReducer from "./features/registerSlice"; 
import  chatReducer  from "./features/chatSlice";
import conversationReducer from "./features/conversationSlice";
import userReducer from "./features/userSlice";

export const store = configureStore({
  reducer: {
    register: registerReducer,
    chat: chatReducer,
    user: userReducer,
    conversation: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

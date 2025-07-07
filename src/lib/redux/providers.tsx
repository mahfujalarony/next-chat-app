"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import useAuthObserver from "../Hooks/useAuthObserver";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <WithAuthObserver>{children}</WithAuthObserver>
    </Provider>
  );
}


function WithAuthObserver({ children }: { children: React.ReactNode }) {
  useAuthObserver(); 
  return <>{children}</>;
}

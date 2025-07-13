"use client";

import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import useAuthObserver from "../Hooks/useAuthObserver"; 

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {isClient && <WithAuthObserver />}
        {children}
      </QueryClientProvider>
    </ReduxProvider>
  );
}

function WithAuthObserver() {
  useAuthObserver();
  return null;
}
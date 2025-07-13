// lib/Hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Client-side only
    if (typeof window === 'undefined') return;

    const socketInstance = io("http://localhost:5000", {
      autoConnect: false,
    });

    setSocket(socketInstance);

    // Cleanup
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return socket;
};

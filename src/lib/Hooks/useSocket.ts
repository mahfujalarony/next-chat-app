// lib/Hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Client-side only
    if (typeof window === 'undefined') return;

    const socketInstance = io("http://localhost:5000", {
      autoConnect: true,
    });

    socketInstance.connect();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    // Cleanup
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return socket;
};

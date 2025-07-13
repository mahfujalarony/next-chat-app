// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') {
    // Server-side এ socket return করবো না
    return null;
  }

  if (!socket) {
    socket = io("http://localhost:5000", {
      autoConnect: false, 
    });
  }
  
  return socket;
};

export default getSocket();

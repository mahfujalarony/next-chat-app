// lib/socket.ts
import { io, Socket } from "socket.io-client";
import { ENV } from "./env";

let socket: Socket | null = null;

const getSocket = (): Socket | null => {
  if (typeof window === 'undefined') {
    // Server-side এ socket return করবো না
    return null;
  }

  if (!socket) {
    socket = io(ENV.SOCKET_URL, {
      autoConnect: false, 
    });
  }
  
  return socket;
};

export default getSocket;

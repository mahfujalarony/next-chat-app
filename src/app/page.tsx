"use client";

import { useEffect } from "react";
import getSocket from "@/lib/socket"; 

export default function ChatPage() {
  useEffect(() => {
    const socket = getSocket();
    
    if (!socket) return; 

    socket.connect(); 

    socket.emit("join", "room123");

    socket.on("message", (data) => {
      console.log("Got message:", data);
    });

    return () => {
      if (socket) { // cleanup এর সময়ও null check
        socket.off("message"); // event cleanup
        socket.disconnect();   // optional, যদি বারবার navigate করো
      }
    };
  }, []);

  return <div>Chat Page</div>;
}
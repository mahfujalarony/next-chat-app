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

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Chat Page</h1>
        <p className="text-lg text-gray-600">Tailwind CSS is working!</p>
        <button className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Test Button
        </button>
      </div>
    </div>
  );
}
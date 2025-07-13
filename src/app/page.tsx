"use client";

import { useEffect } from "react";
import socket from "@/lib/socket"; // ← তুমি যেভাবে path সেট করো

export default function ChatPage() {
  useEffect(() => {
    socket.connect(); // যদি autoConnect: false দাও

    socket.emit("join", "room123");

    socket.on("message", (data) => {
      console.log("Got message:", data);
    });

    return () => {
      socket.off("message"); // event cleanup
      socket.disconnect();   // optional, যদি বারবার navigate করো
    };
  }, []);

  return <div>Chat Page</div>;
}

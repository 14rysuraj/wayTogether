// @/context/SocketProvider.tsx
import React, { useEffect } from "react";
import socket from "@/constants/socket";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Connect socket only once when the provider is mounted
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      
      socket.disconnect();
    };
  }, []);

  return <>{children}</>;
};
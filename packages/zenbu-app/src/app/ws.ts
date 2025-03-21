import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useChatWS = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log("a");

    const socketInstance = io("http://localhost:5001", {
      path: "/ws",
      transports: ["websocket"],
    });
    console.log("b");
    socketInstance.on("connect", () => {
      console.log("Socket connected successfully");
    });

    console.log("Socket connection status:", socketInstance.connected);

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);
  console.log("me socket", socket);

  return { socket };
};

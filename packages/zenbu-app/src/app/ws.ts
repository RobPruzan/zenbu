import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { EventLogEvent } from "zenbu-plugin/src/ws/ws";

export const useEventWS = (opts?: { onMessage?: (message: EventLogEvent) => void }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {

    const socketInstance = io("http://localhost:5001", {
      path: "/ws",
      transports: ["websocket"],
      query: {
        roomId: "todo-impl-rooms-based-on-project-hostname"
      }
    });
    socketInstance.on("connect", () => {
      // console.log("Socket connected successfully");
    });


    socketInstance.on("message", (message) => {
      opts?.onMessage?.(message)
    })

    // console.log("Socket connection status:", socketInstance.connected);

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

  return { socket };
};

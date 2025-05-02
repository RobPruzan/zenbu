import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { PluginServerEvent } from "zenbu-plugin/src/ws/schemas";
import { PartialEvent } from "zenbu-redis";

export const useWS = <Message={ event: PartialEvent; projectName: string }>(opts: {
  projectName?: string;
  onMessage?: (message: Message) => void;
  url?: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!opts.projectName) {
      return
    }
    const socketInstance = io(opts.url ?? "http://localhost:5001", {
      path: "/ws",
      transports: ["websocket"],
      query: {
        roomId: opts.projectName,
      },
    });
    socketInstance.on("connect", () => {
      // console.log("Socket connected successfully");
    });

    socketInstance.on("message", (message) => {
      opts?.onMessage?.(message);
    });

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
  }, [opts.projectName]);

  return { socket };
};

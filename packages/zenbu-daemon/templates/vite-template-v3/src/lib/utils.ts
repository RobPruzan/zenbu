import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { EventEmitter } from "stream";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const useWS = <Message>(opts: {
  roomName?: string;
  onMessage?: (message: Message) => void;
  url?: string;
}): { socket: Socket | null } => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!opts.roomName) {
      return;
    }
    const socketInstance = io(opts.url ?? "http://localhost:4200", {
      path: "/ws",
      transports: ["websocket"],
      query: {
        roomId: opts.roomName,
      },
    });
    socketInstance.on("connect", () => {});

    socketInstance.on("message", (message) => {
      opts?.onMessage?.(message);
    });

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
  }, [opts.roomName]);

  return { socket };
};

type Teardown = () => void;

type Args = {
  client: (messageChannel: { subscribe: () => void }) => void;
  remote: ({}: {
    eventEmitter: EventEmitter;
    environment: {
      vscode: {};
      // can just hard code modules i want the model to be able to access :)
      // not a lib rn really just testing the waters for kyju
    };
  }) => Teardown;
};

// export const useRemoteSync = (args: Args) => {
//   /**
//    * what does this require?
//    *
//    * well client is just ran in an effect? Does that need a teardown?
//    *
//    * i mean not necessarily, id rather that just be ran synchronously
//    * so i can run hooks
//    *
//    *
//    */
// };

export const useMessage = (
  cb: (e: { name: string; data: unknown }) => void
) => {
  const { socket } = useWS({
    roomName: "extensions",
    url: "http://localhost:6001",
  });

  useEffect(() => {
    if (!socket) {
      return;
    }
    const handleMessage = (e: any) => {
      cb(e);
    };

    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, [socket]);
};

/**
 *
 * wait do i want vscode api's, or do i want to just have an ingest server to post to :O
 *
 * well no it needs to be a message boundary
 *
 * okay then i just need to setup a socket.io client?
 *
 * well there needs to be a server that we post to
 *
 * so it posts to local socket server that we have setup
 *
 * then those messages get read in a simple api on client, something like
 *
 *
 * sendMessage("<name>", {...data})
 *
 *
 *
 * socketServer.listen((event) => {
 *  ioServer.get("extensions").emit(event)
 * })
 *
 *
 * useMessage((event: {manually type data, its for llm anyways}) => {
 *  event.name
 *  event.data
 * })
 */

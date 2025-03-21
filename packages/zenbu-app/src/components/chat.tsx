"use client";
import { useState } from "react";
import { useChatStore } from "./chat-instance-context";
import { Textarea } from "./ui/textarea";
import { iife } from "~/lib/utils";
import { useEventWS } from "~/app/ws";
import { ClientEvent } from "zenbu-plugin/src/ws/ws";
import { nanoid } from "nanoid";

export const Chat = () => {
  const { eventLog } = useChatStore();
  const [input, setInput] = useState("");

  const { socket } = useEventWS({
    onMessage: (message) => {
      console.log("got back message", message);

      if (message.kind === "user-message") {
        throw new Error("Invariant: user message cannot come from server");
      }

      eventLog.actions.pushEvent(message);
    },
  });

  return (
    <div className="flex h-full w-full flex-col justify-start">
      {eventLog.events.map((event) => (
        <div>
          {iife(() => {
            switch (event.kind) {
              case "assistant-simple-message": {
                return <div>{event.text}</div>;
              }
              case "user-message": {
                return (
                  <div className="rounded-md border bg-gray-700 p-3">
                    {event.text}
                  </div>
                );
              }
            }
          })}
        </div>
      ))}
      <Textarea
        value={input}
        onKeyDown={(e) => {
          if (e.key !== "Enter") {
            return;
          }
          if (!socket) {
            return;
          }

          e.preventDefault();
          console.log("sending", input);
          setInput("");

          socket.emit("message", {
            requestId: nanoid(),
            context: [],
            kind: "user-message",
            text: input,
            timestamp: Date.now(),
          } satisfies ClientEvent);
        }}
        onChange={(e) => {
          setInput(e.target.value);
        }}
      />
    </div>
  );
};

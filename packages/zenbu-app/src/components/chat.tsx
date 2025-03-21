"use client";
import { useState } from "react";
import { useChatStore } from "./chat-instance-context";
import { Textarea } from "./ui/textarea";
import { iife } from "~/lib/utils";
import { useEventWS } from "~/app/ws";
import { ClientEvent } from "zenbu-plugin/src/ws/ws";
import { nanoid } from "nanoid";
import { InspectIcon } from "lucide-react";
import { Button } from "./ui/button";
import { toChatMessages } from "zenbu-plugin/src/ws/utils";

export const Chat = () => {
  const { eventLog, inspector } = useChatStore();
  const [input, setInput] = useState("");

  // we will want to optimistically update our local event log but dedupe events
  // with the same id received, its how we will handle multi tab support (which is crucial)
  //
  const { socket } = useEventWS({
    onMessage: (message) => {
      console.log("got back message", message);

      if (message.kind === "user-message") {
        throw new Error("Invariant: user message cannot come from server");
      }

      eventLog.actions.pushEvent(message);
    },
  });

  const messages = toChatMessages(eventLog.events);

  return (
    <div className="flex h-full w-full flex-col bg-[#151515]">
      {/* oof this has to be dynamically calculatel;kdcjsakls;djfkl;adsjfd;lks */}
      <div className="h-[calc(100%-100px)] overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index}>
            {iife(() => {
              switch (message.role) {
                case "assistant": {
                  return <div>{message.content}</div>;
                }
                case "user": {
                  return (
                    <div className="rounded-md border bg-gray-700 p-3">
                      {message.content}
                    </div>
                  );
                }
              }
            })}
          </div>
        ))}
      </div>

      <div className="px-4 pb-2">
        <div className="h-10 rounded-t-md border-x border-t">
          <Button
            className={`${
              inspector.state.kind === "inspecting"
                ? "bg-purple-500/20 text-purple-400"
                : ""
            }`}
            variant={"ghost"}
            onClick={() => {
              inspector.actions.setInspectorState({
                kind:
                  inspector.state.kind === "inspecting" ? "off" : "inspecting",
              });
            }}
          >
            <InspectIcon />
          </Button>
        </div>

        <Textarea
          placeholder="Ask me anything..."
          className="rounded-t-none bg-[#1D1D20] outline-0 focus-visible:ring-0"
          style={{
            height: "100px",
            resize: "none",
          }}
          value={input}
          onKeyDown={(e) => {
            if (e.key !== "Enter") {
              return;
            }

            if (!socket) {
              return;
            }

            const clientEvent: ClientEvent = {
              requestId: nanoid(),
              context: [],
              kind: "user-message",
              text: input,
              timestamp: Date.now(),
              id: nanoid(),
              previousEvents: eventLog.events,
            };
            console.log(
              "previous",
              toChatMessages(eventLog.events),
              "vs event log",
              eventLog,
            );

            eventLog.actions.pushEvent(clientEvent);

            e.preventDefault();
            console.log("sending", input);
            setInput("");

            socket.emit("message", clientEvent);
          }}
          onChange={(e) => {
            setInput(e.target.value);
          }}
        />
      </div>
    </div>
  );
};

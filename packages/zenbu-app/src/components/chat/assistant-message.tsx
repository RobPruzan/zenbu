"use client";

import { ChatMessage } from "zenbu-plugin/src/ws/utils";
import { cn, iife } from "src/lib/utils";

export function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="group mb-6 max-w-full pl-2">
      <div className="text-xs text-foreground whitespace-pre-wrap font-light leading-relaxed break-words overflow-auto">
        {iife(() => {
          switch (typeof message.content) {
            case "string": {
              return message.content;
            }
            case "object": {
              return message.content.map((content, i) => (
                <div key={i}>
                  {iife(() => {
                    switch (content.type) {
                      case "image": {
                        return (
                          <img
                            src={(content.image as URL).href}
                            alt="Assistant shared image"
                            className="rounded-md max-w-[300px] my-2"
                          />
                        );
                      }
                      case "file": {
                        return (
                          <video
                            controls
                            src={(content.data as URL).toString()}
                            className="rounded-md max-w-[300px] my-2"
                          />
                        );
                      }
                      case "text": {
                        return <span>{content.text}</span>;
                      }
                      default: {
                        return null;
                      }
                    }
                  })}
                </div>
              ));
            }
            default: {
              return null;
            }
          }
        })}
      </div>
    </div>
  );
}

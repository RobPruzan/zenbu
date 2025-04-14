"use client";

import { ChatMessage } from "zenbu-plugin/src/ws/utils";
import { RefreshCw } from "lucide-react";
import { cn, iife } from "src/lib/utils";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="group mb-6 max-w-full">
      <div
        className={cn(
          "rounded-xl bg-accent/5 backdrop-blur-xl border border-border/40",
          "shadow-sm overflow-hidden max-w-full",
          "transform hover:translate-y-[-1px] transition-all duration-300",
          "hover:shadow-md hover:border-border/60",
        )}
      >
        <div className="px-4 py-3 text-xs text-foreground whitespace-pre-wrap font-light leading-relaxed break-words overflow-auto">
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
                              alt="User shared image"
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

        <div className="flex items-center justify-between text-[10px] px-4 py-2 text-muted-foreground bg-accent/10">
          <div className="flex items-center ml-auto">
            <button className="hover:text-foreground transition-colors">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-2.5 w-2.5" />
                Restore
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

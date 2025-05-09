"use client";

import { RefreshCw } from "lucide-react";
import { cn, iife } from "src/lib/utils";

// todo: types
export function UserMessage({ message }: { message: { content: Array<any> } }) {
  return (
    <div className="group mb-6 max-w-full">
      <div
        className={cn(
          "rounded-lg bg-accent/5 backdrop-blur-xl border border-border/50",
          "shadow-sm overflow-hidden max-w-full",
          "transform hover:translate-y-[-1px] transition-all duration-300",
          "hover:shadow-md hover:border-border/60",
        )}
      >
        <div className="px-4 py-3 text-xs text-foreground/90 whitespace-pre-wrap font-light leading-relaxed break-words overflow-auto">
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
                            <div className="my-2 rounded-lg overflow-hidden border border-border/50 bg-background/50">
                              <img
                                src={(content.image as URL).href}
                                alt="User shared image"
                                className="max-w-[300px]"
                              />
                            </div>
                          );
                        }
                        case "file": {
                          return (
                            <div className="my-2 rounded-lg overflow-hidden border border-border/50 bg-background/50">
                              <video
                                controls
                                src={(content.data as URL).toString()}
                                className="max-w-[300px]"
                              />
                            </div>
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

        <div className="flex items-center justify-between text-[10px] px-4 py-2 text-muted-foreground bg-background/50 border-t border-border/50">
          <div className="flex items-center ml-auto">
            <button className="hover:text-foreground transition-colors flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-accent/10">
              <RefreshCw className="h-2.5 w-2.5" />
              <span className="font-medium">Restore</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

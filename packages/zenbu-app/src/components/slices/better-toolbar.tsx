import { iife } from "~/lib/utils";
import { useChatStore } from "../chat-instance-context";
import { Leaf } from "lucide-react";
import { Button } from "../ui/button";
import { act, useEffect, useState } from "react";
import { ChildToParentMessage } from "zenbu-devtools";

/**
 *
 * will need that framer motion stuff yippy
 *
 * do i want to mount drawing here? I mean probably not lol
 *
 * but i would like to control it from here
 *
 *
 * i will do it myself (smirks)
 *
 *
 * controllable by the command menu
 *
 *
 * so routes solves that
 *
 * id like one button that expands it
 *
 * maybe it just expands it to full? To last so you can close/open easily... yeah thats ideal, plus multi state is always unintuitive
 *
 * l
 *
 * mannnnnnno ur state management is roughso
 */
export const BetterToolbar = () => {
  const { actions, state } = useChatStore((state) => state.toolbar);

  return (
    <div className="absolute bottom-2 left-2">
      {iife(() => {
        switch (state.activeRoute) {
          case "off": {
            return (
              <Button
                variant={"outline"}
                // className=""
                onClick={() => {
                  actions.setRoute("console");
                }}
              >
                <Leaf />
              </Button>
            );
          }
          case "console": {
            return <Console />;
          }
          case "network": {
            return (
              <div className="h-[350px] w-[600px] bg-background rounded-md flex items-end justify-start">
                network
                <Button
                  variant={"outline"}
                  onClick={() => {
                    actions.setRoute("off");
                  }}
                >
                  off
                </Button>
              </div>
            );
          }
          case "performance": {
            return (
              <div className="h-[350px] w-[600px] bg-background rounded-md flex items-end justify-start">
                performance
                <Button
                  variant={"outline"}
                  onClick={() => {
                    actions.setRoute("off");
                  }}
                >
                  off
                </Button>
              </div>
            );
          }
        }
      })}
    </div>
  );
  // return ;
};

const Console = () => {
  const { actions, state } = useChatStore((state) => state.toolbar);
  const [logs, setLogs] = useState<Array<any[]>>([]);

  useEffect(() => {
    window.addEventListener(
      "message",
      (event: MessageEvent<ChildToParentMessage>) => {
        if (event.origin !== "http://localhost:4200") {
          return;
        }

        const eventData = event.data;

        switch (eventData.kind) {
          case "console": {
            setLogs((prev) => [...prev, eventData.data]);
          }
        }
      },
    );
  }, []);

  useEffect(() => {}, []);
  return (
    <div className="h-[350px] w-[600px] bg-background rounded-md flex items-end justify-start">
      console
      <Button
        variant={"outline"}
        onClick={() => {
          actions.setRoute("off");
        }}
      >
        off
      </Button>
      {/* needs circular indicator */}
      <div className="w-full h-full overflow-auto p-2 flex flex-col-reverse">
        {/* temp just to be able to render circular structures */}
        {logs.map((log, i) => (
          <div key={i} className="mb-1 font-mono text-sm">
            {log.map((item, j) => (
              <span key={j} className="mr-2">
                {typeof item === 'object' && item !== null ? (
                  <details>
                    <summary className="cursor-pointer">Object</summary>
                    <div className="pl-4 text-xs">
                      {Object.entries(item).map(([key, value], idx) => (
                        <div key={idx} className="mt-1">
                          <span className="text-blue-500">{key}:</span>{" "}
                          {typeof value === 'object' && value !== null ? (
                            <details>
                              <summary className="cursor-pointer inline-block">Object</summary>
                            </details>
                          ) : (
                            <span>{String(value)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                  String(item)
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

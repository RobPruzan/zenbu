import { iife } from "~/lib/utils";
import { useChatStore } from "../chat-instance-context";
import { Leaf } from "lucide-react";
import { Button } from "../ui/button";
import { act } from "react";

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
              </div>
            );
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

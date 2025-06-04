import React, { useMemo } from "react";
import { TRPCProvider } from "./trpc-provider";
import { ChatProvider } from "~/components/chat-interface";
import { AppSwitcherStateProvider } from "~/components/app-switcher-context";
import { ChatInstanceContext } from "~/components/chat-store";
import { useThumbnailScaleCalc } from "~/app/[workspaceId]/hooks";
import { api } from "@/lib/trpc";
import { SidebarRouterContext, useSidebarRouterInit } from "~/app/v2/context";

interface GlobalProvidersProps {
  children: React.ReactNode;
}

export function GlobalProviders({ children }: GlobalProvidersProps) {
  const routerInit = useSidebarRouterInit({ defaultSidebarOpen: 'chat' });
  console.log("got router init", routerInit);

  return (
    <TRPCProvider>
      <AppSwitcherStateProvider>
        <SidebarRouterContext.Provider value={routerInit}>
          <ChatProvider>
            <ChatInstanceProvider>{children}</ChatInstanceProvider>
          </ChatProvider>
        </SidebarRouterContext.Provider>
      </AppSwitcherStateProvider>
    </TRPCProvider>
  );
}

const ChatInstanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects] = api.daemon.getProjects.useSuspenseQuery();
  const project = projects.at(0);
  if (!project) {
    throw new Error("invariant, enforce earlier");
  }
  const runningProjects = useMemo(
    () => projects.filter((project) => project.status === "running"),
    [projects]
  );
  return (
    // todo remove this doesn't sync with editor which removes the whole point
    <ChatInstanceContext.Provider
      initialValue={{
        // iframe: {
        //   project: project,
        //   // url:
        //   //   project.status === "running"
        //   //     ? `http://localhost:${project.port}`
        //   //     : null!,
        // },
        toolbar: {
          state: {
            mobileSplit: {
              active: false,
            },
            activeRoute: "off",
            drawing: {
              active: false,
              getEditor: () => null,
            },
            screenshotting: {
              active: false,
            },
            recording: {
              active: false,
            },
          },
        },
        context: {
          items: [],
        },
        inspector: {
          state: {
            kind: "off",
          },
        },
        // eventLog: {
        //   events: [],
        // },
        chatControls: {
          input: "",
        },
      }}
    >
      {children}
    </ChatInstanceContext.Provider>
  );
};

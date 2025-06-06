"use client";
import {
  ReactElement,
  useContext,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  startTransition,
  unstable_ViewTransition as ViewTransition,
} from "react";
// import lastUpdate from "./hot-reload.ts";
import { InspectorState } from "zenbu-devtools";
import lastUpdate from "./hot-reload";
import {
  useChatStore,
  useTransitionChatStore,
} from "src/components/chat-store";
import { useMakeRequest } from "src/components/devtools-overlay";
import { motion } from "framer-motion";
import { cn } from "src/lib/utils";
import { useGetProject } from "./[workspaceId]/hooks";
import { trpc } from "src/lib/trpc";

const snapshot = { kind: "off" as const };

export const IFrameWrapper = ({
  children,
  mobile = false,
  Container = ({ children }) => <>{children}</>,
}: {
  children: React.ReactNode;
  mobile?: boolean;
  Container?: ({ children }: { children: React.ReactNode }) => React.ReactNode;
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const refEventCatcher = useRef<HTMLDivElement | null>(null);
  // const { inspectorState, setInspectorState } = useInspectorStateContext();
  const { inspector } = useChatStore();

  // const { iframe } = useTransitionChatStore();

  const makeRequest = useMakeRequest();

  useEffect(() => {
    // @ts-expect-error
    if (window.LAST_UPDATE && window.LAST_UPDATE !== lastUpdate) {
      location.reload();
    }
    // @ts-expect-error
    window.LAST_UPDATE = lastUpdate;
  }, [lastUpdate]);

  useEffect(() => {
    const handleMouseClick = async (e: MouseEvent) => {
      if (
        !e
          .composedPath()
          .map((el) => el && "id" in el && el.id)
          .filter(Boolean)
          .includes("child-iframe")
      ) {
        return;
      }

      const response = await makeRequest({
        kind: "clicked-element-info-request",
        responsePossible: true,
        id: "",
      });

      if (response.kind !== "clicked-element-info-response") {
        throw new Error(
          "Invariant: note to self, should make this safe at type level",
        );
      }

      inspector.actions.setInspectorState({
        kind: "focused",
        focusedInfo: response.focusedInfo,
      });
    };

    document.addEventListener("pointerdown", handleMouseClick, {
      capture: true,
    });

    return () => {
      document.removeEventListener("click", handleMouseClick);
    };
  }, []);
  // const project = useTransitionChatStore(
  //   (project) => project.iframe.state.project,
  // );
  const project = useDeferredValue(useGetProject().project);

  if (project.status !== "running") {
    throw new Error("todo");
  }

  return (
    <div
      className={
        !mobile ? `w-full h-full overflow-hidden relative bg-black/20 ` : ""
      }
    >
      {children}
      <ViewTransition
        key={project.name}
        share="stage-manager-anim"
        name={`preview-${project.name}`}
        update={"none"}
      >
        <Container>
          <iframe
            // animate={{

            // }}
            // transition={{
            //   duration: 1,
            // }}
            // layoutId={`preview-iframe-${project.name}`}
            ref={iframeRef}
            key={lastUpdate}
            className={cn("w-full h-full select-none")}
            style={mobile ? { width: "390px", height: "844px" } : undefined}
            src={`http://localhost:${project.port}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
            title={project.name}
          />
        </Container>
      </ViewTransition>
    </div>
    // <ViewTransition
    //   // key={activeWindow.id}
    //   name={`window-${project.name}`}
    //   // share="stage-manager-anim"
    // >
    //   <div
    //     style={{
    //       display: "flex",
    //       flexDirection: "column",
    //       width: "100%",
    //       height: "100%",
    //       position: "relative",
    //     }}
    //   >
    //     <div className="relative w-full h-full">
    //       {children}
    //       <iframe
    //         id={mobile ? "mobile-iframe" : IFRAME_ID}
    //         key={lastUpdate}
    //         ref={iframeRef}
    //         // src="http://localhost:4200"
    //         src={iframe.state.url}
    //         // src={"http://localhost:3002"}
    //         style={{
    //           height: "100%",
    //           width: "100%",
    //           border: "none",
    //         }}
    //       />
    //       {/* <ScreenshotTool /> */}
    //     </div>
    //   </div>
    // </ViewTransition>
  );
};

export const IFRAME_ID = "child-iframe";

// export const InspectorStateProvider = ({
//   children,
// }: {
//   children: ReactElement;
// }) => {
//   const inspectorState = useSyncExternalStore(
//     DevtoolFrontendStore.subscribe,
//     DevtoolFrontendStore.getState,
//     () => snapshot
//   );
//   const setInspectorState = DevtoolFrontendStore.setState;

//   return (
//     <InspectorStateContext.Provider
//       value={{
//         inspectorState,
//         setInspectorState,
//       }}
//     >
//       {children}
//     </InspectorStateContext.Provider>
//   );
// };

// export const useInspectorStateContext = () => useContext(InspectorStateContext);

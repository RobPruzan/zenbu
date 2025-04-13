"use client";
import {
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
// import lastUpdate from "./hot-reload.ts";
import { InspectorState } from "zenbu-devtools";
import { useIFrameMessenger } from "~/hooks/use-iframe-listener";
import lastUpdate from "./hot-reload";
import {
  DevtoolsOverlay,
  InspectorStateContext,
  useMakeRequest,
} from "~/components/devtools-overlay";
import { useChatStore } from "~/components/chat-store";
import { Recorder } from "~/components/screen-sharing";
import { iife } from "~/lib/utils";
import { Toolbar } from "./toolbar";
import { ScreenshotTool } from "./screenshot-tool";
import { BetterToolbar } from "~/components/slices/better-toolbar";
// import { ChildToParentMessage } from "~/devtools";
// import {
//   DevtoolsOverlay,
//   InspectorState,
//   InspectorStateContext,
//   useMakeRequest,
// } from "./components/DevtoolsOverlay";
// import { useIFrameMessenger } from "./hooks/use-iframe-listener.ts";

const snapshot = { kind: "off" as const };

export const IFrameWrapper = ({ children }: { children: React.ReactNode }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const refEventCatcher = useRef<HTMLDivElement | null>(null);
  // const { inspectorState, setInspectorState } = useInspectorStateContext();
  const { inspector } = useChatStore();

  const { iframe } = useChatStore();

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <div className="relative w-full h-full">
        {children}
        <iframe
          id={IFRAME_ID}
          key={lastUpdate}
          ref={iframeRef}
          // src="http://localhost:4200"
          src={iframe.state.url}
          style={{
            height: "100%",
            width: "100%",
            border: "none",
          }}
        />
        {/* <ScreenshotTool /> */}
      </div>
    </div>
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

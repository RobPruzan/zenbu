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
import { useIFrameMessenger } from "@/hooks/use-iframe-listener";
import lastUpdate from "./hot-reload";
import {
  DevtoolsOverlay,
  InspectorStateContext,
  useMakeRequest,
} from "@/components/devtools-overlay";
// import { ChildToParentMessage } from "~/devtools";
// import {
//   DevtoolsOverlay,
//   InspectorState,
//   InspectorStateContext,
//   useMakeRequest,
// } from "./components/DevtoolsOverlay";
// import { useIFrameMessenger } from "./hooks/use-iframe-listener.ts";

export const DevtoolFrontendStore: {
  publish: (state: InspectorState) => void;
  subscribe: (callback: (state: InspectorState) => void) => () => void;
  subscribers: Set<(state: InspectorState) => void>;
  getState: () => InspectorState;
  state: InspectorState;
  setState: (
    action: InspectorState | ((prev: InspectorState) => InspectorState)
  ) => void;
} = {
  subscribers: new Set(),
  state: { kind: "off" },
  publish(state) {
    DevtoolFrontendStore.state = state;
    DevtoolFrontendStore.subscribers.forEach((callback) => callback(state));
  },
  subscribe(callback) {
    DevtoolFrontendStore.subscribers.add(callback);
    return () => DevtoolFrontendStore.subscribers.delete(callback);
  },
  getState() {
    return DevtoolFrontendStore.state;
  },
  setState(action) {
    const nextState =
      typeof action === "function"
        ? action(DevtoolFrontendStore.state)
        : action;
    DevtoolFrontendStore.publish(nextState);
  },
};
const snapshot = { kind: "off" as const };

export const IFrameWrapper = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const refEventCatcher = useRef<HTMLDivElement | null>(null);
  const { inspectorState, setInspectorState } = useInspectorStateContext();

  const sendMessage = useIFrameMessenger();
  const makeRequest = useMakeRequest({ iframeRef });

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
          .map((el) => "id" in el && el.id)
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
          "Invariant: note to self, should make this safe at type level"
        );
      }

      setInspectorState({
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
        <iframe
          id="child-iframe"
          key={lastUpdate}
          ref={iframeRef}
          src="http://localhost:4200"
          style={{
            height: "100%",
            width: "100%",
            border: "none",
          }}
        />
        <DevtoolsOverlay iframeRef={iframeRef} />
      </div>
    </div>
  );
};

export const InspectorStateProvider = ({
  children,
}: {
  children: ReactElement;
}) => {
  const inspectorState = useSyncExternalStore(
    DevtoolFrontendStore.subscribe,
    DevtoolFrontendStore.getState,
    () => snapshot
  );
  const setInspectorState = DevtoolFrontendStore.setState;

  return (
    <InspectorStateContext.Provider
      value={{
        inspectorState,
        setInspectorState,
      }}
    >
      {children}
    </InspectorStateContext.Provider>
  );
};

export const useInspectorStateContext = () => useContext(InspectorStateContext);

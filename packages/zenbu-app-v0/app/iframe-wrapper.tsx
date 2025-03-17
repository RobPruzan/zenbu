"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

const AppStore: {
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
    AppStore.state = state;
    AppStore.subscribers.forEach((callback) => callback(state));
  },
  subscribe(callback) {
    AppStore.subscribers.add(callback);
    return () => AppStore.subscribers.delete(callback);
  },
  getState() {
    return AppStore.state;
  },
  setState(action) {
    const nextState =
      typeof action === "function" ? action(AppStore.state) : action;
    AppStore.publish(nextState);
  },
};
const snapshot = { kind: "off" as const };

export const IFrameWrapper = () => {
  const iframeRef = useDevtoolsListener();
  const inspectorState = useSyncExternalStore(
    AppStore.subscribe,
    AppStore.getState,
    () => snapshot
  );
  const setInspectorState = AppStore.setState;
  const refEventCatcher = useRef<HTMLDivElement | null>(null);

  const sendMessage = useIFrameMessenger({ iframe: iframeRef.current });

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
      console.log("wat");

      if (
        !e
          .composedPath()
          .map((el) => "id" in el && el.id)
          .filter(Boolean)
          .includes("child-iframe")
      ) {
        return;
      }
      console.log("sent");

      const response = await makeRequest({
        kind: "clicked-element-info-request",
        responsePossible: true,
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
    // @ts-expect-error
    <InspectorStateContext.Provider
      value={{
        inspectorState,
        setInspectorState,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <button
          style={{
            width: "fit-content",
          }}
          onClick={() => {
            setInspectorState((prev) => ({
              kind: prev.kind === "inspecting" ? "off" : "inspecting",
            }));
          }}
        >
          {inspectorState.kind}ing
        </button>

        {/* <div */}
        <div
          onClick={() => {
            console.log("bruh");
          }}
          style={{
            pointerEvents: "auto",
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          <iframe
            id="child-iframe"
            key={lastUpdate}
            ref={iframeRef}
            src="http://localhost:4200"
            style={{
              height: "100%",
              width: "100%",
              pointerEvents:
                inspectorState.kind === "inspecting" ? "none" : "auto",
            }}
          />
          <DevtoolsOverlay iframeRef={iframeRef} />
        </div>
      </div>
    </InspectorStateContext.Provider>
  );
};

const useDevtoolsListener = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: any) => {
      if (event.origin !== "http://localhost:4200") return;
      // console.log("Message received:", event.data);
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [lastUpdate, iframeRef.current]);

  return iframeRef;
};

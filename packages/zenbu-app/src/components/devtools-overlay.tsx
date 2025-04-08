import {
  createContext,
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useIFrameMessenger } from "../hooks/use-iframe-listener";
import { nanoid } from "nanoid";
import {
  ChildToParentMessage,
  FocusedInfo,
  InspectorState,
  ParentToChildMessage,
} from "zenbu-devtools";
import { useChatContext } from "./chat-interface";
import { useEventWS } from "~/app/ws";
import { ChatInstanceContext, useChatStore } from "./chat-instance-context";
import { IFRAME_ID } from "~/app/iframe-wrapper";

interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

// you can also check out @devtools.ts

// we allow bidirectional communication (im basically intenrally thinking of this as a websocket, where i need to implement ping ponging soon but we will do it later)

// right now what i want is when i click on an element (so click recieved captured in the parent iframe, don't allow it to propagate) we request the from the child which element was mouse overed, and we get its bounding rect + tag name

// inside the parent frame we model this as a promise. We send an id from the parent, and the response has to send back the same id, that's how we know its the response for that request

// u can make an abstraction for this in the parent iframe (u pass in the data and id and the it returns a promise with the response data)

// actually what i didn't mention is what the whole feature looks like, in the react code u should mantain a state machine that has 3 current states

// - off
// - inspecting
// - focused

// when off, nothing happens

// then u click a button, now its inspecting

// then it lists for the rects from mouse move and we draw the interpolation

// then when we click an element we transition to focus, set that as the focused element  info, and show a single outline a round it

// then we can click the button we clicked to turn it on to turn it back off

interface RectPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function DevtoolsOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRectRef = useRef<RectPosition | null>(null);
  const targetRectRef = useRef<RectPosition | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastThrottleTimeRef = useRef<number>(0);
  const lastElementRef = useRef<Element | null>(null);

  const { socket } = useEventWS();
  const makeRequest = useMakeRequest();
  const { inspector, eventLog, chatControls } = useChatStore();

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      console.log("no canvas");

      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log("no ctx");

      return;
    }

    let rafId: number;

    const clearAndCheck = () => {
      if (inspector.state.kind === "off") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      rafId = requestAnimationFrame(clearAndCheck);
    };

    rafId = requestAnimationFrame(clearAndCheck);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [inspector.state.kind]);
  const sendMessage = useIFrameMessenger();
  const { setMessages, setInput } = useChatContext();
  const store = ChatInstanceContext.useContext();

  useEffect(() => {
    const getState = store.getState;
    const canvas = canvasRef.current;
    const iframe = document.getElementById(IFRAME_ID)! as HTMLIFrameElement;
    if (!canvas || !iframe) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMessage = (event: MessageEvent<ChildToParentMessage>) => {

      // this acts as validation and why we can assert the event is the above type
      // we need to switch to runtime validation, we can't do this generally
      if (event.origin !== "http://localhost:4200") {
        // console.log("wrong origin");

        return;
      }

      const data = event.data;

      switch (data.kind) {
        case "notification": {
          console.log("got notification");
          return;
        }
        case "mouse-position-update": {
          if (getState().inspector.state.kind !== "inspecting") {
            return;
          }

          const now = Date.now();
          const throttleInterval = 50;

          if (now - lastThrottleTimeRef.current >= throttleInterval) {
            const iframeRect = iframe.getBoundingClientRect();
            const { rect } = data;

            targetRectRef.current = {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            };

            if (!currentRectRef.current) {
              currentRectRef.current = { ...targetRectRef.current };
            }

            if (rafIdRef.current === null) {
              rafIdRef.current = requestAnimationFrame(animateRect);
            }

            lastThrottleTimeRef.current = now;
          }

          return;
        }
        case "get-state-request": {
          sendMessage({
            kind: "get-state-response",
            state: getState().inspector.state,
            // bruh
            id: event.data.id!,
          });
          return;
        }
        case "click-element-info": {
          console.log("we click yay");

          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
          }

          inspector.actions.setInspectorState({
            focusedInfo: data.focusedInfo,
            kind: "focused",
          });

          chatControls.actions.setInput(JSON.stringify(data.focusedInfo)) +
            "\n\n\n\n\n\n\n";

          // setMessages((prev) => [
          //   ...prev,
          //   {
          //     role: "user",
          //     content: JSON.stringify(data.focusedInfo),
          //   },
          // ]);

          setInput(
            (prev) => prev + "\n" + JSON.stringify(data.focusedInfo) + "\n\n",
          );

          drawFocusedRect(data.focusedInfo);
        }
      }
    };

    const lerp = (start: number, end: number, t: number): number => {
      return start * (1 - t) + end * t;
    };

    const drawFocusedRect = (focusedInfo: FocusedInfo) => {
      if (
        !ctx ||
        !canvas ||
        !currentRectRef.current ||
        !targetRectRef.current
      ) {
        rafIdRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      console.log("draw it now.");

      ctx.strokeStyle = "rgba(138, 43, 226, 0.8)";
      ctx.lineWidth = 2;
      const { domRect } = focusedInfo;
      ctx.strokeRect(domRect.x, domRect.y, domRect.width, domRect.height);
    };

    const animateRect = () => {
      if (
        !ctx ||
        !canvas ||
        !currentRectRef.current ||
        !targetRectRef.current
      ) {
        rafIdRef.current = null;

        return;
      }

      const current = currentRectRef.current;
      const target = targetRectRef.current;
      const lerpFactor = 0.2;

      current.x = lerp(current.x, target.x, lerpFactor);
      current.y = lerp(current.y, target.y, lerpFactor);
      current.width = lerp(current.width, target.width, lerpFactor);
      current.height = lerp(current.height, target.height, lerpFactor);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(138, 43, 226, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(current.x, current.y, current.width, current.height);

      const isCloseEnough =
        Math.abs(current.x - target.x) < 0.5 &&
        Math.abs(current.y - target.y) < 0.5 &&
        Math.abs(current.width - target.width) < 0.5 &&
        Math.abs(current.height - target.height) < 0.5;

      if (isCloseEnough) {
        Object.assign(current, target);
        rafIdRef.current = null;
      } else {
        rafIdRef.current = requestAnimationFrame(animateRect);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      if (iframe) {
        const rect = iframe.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    });

    resizeObserver.observe(iframe);
    // console.log("SETTING UP");

    requestAnimationFrame(() => {
      // console.log("focused?", inspector.state.kind);

      if (inspector.state.kind === "focused") {
        drawFocusedRect(inspector.state.focusedInfo);
      }
    });

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
      resizeObserver.disconnect();
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [store]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        pointerEvents: "none",
        // pointerEvents:
        //   useContext(InspectorStateContext).inspectorState.kind === "inspecting"
        //     ? "none"
        //     : "auto",
        top: 0,
        left: 0,
      }}
    />
  );
}

/**
 *
 * todos to make progress:
 * - need to control the state we are currently in, which...
 *
 * determines if we should be able to click elements
 *
 * so inspect off
 * turn inspect on
 *
 * just inspect state machine
 *
 * then once we enter inspecting we need to swallow events (event catcher or prevent pointer clicks?)
 *
 *
 * i think this was some prblem related to that, hmm what was it
 *
 * i think it was u can't scroll if no pointer events got through?
 *
 * but why couldn't we just capture the click, errrrrrrrrr
 *
 * i think it was because thngs looked clickable and it was super scary?
 *
 * idk we can just go even capture approach again to be safe, but i wish i remember why i did that
 *
 *
 *
 */

// const useInspectorState = () => {
//   const [inspectorState, setInspectorState] = useState<InspectorState>({
//     kind: "off",
//   });

// };

// we wont be using default context
export const InspectorStateContext = createContext<{
  inspectorState: InspectorState;
  setInspectorState: Dispatch<SetStateAction<InspectorState>>;
}>(null!);

export const useMakeRequest = () => {
  const sendMessage = useIFrameMessenger();

  return async <T extends ParentToChildMessage & { responsePossible: true }>(
    message: T,
  ) => {
    // acts as explicit validation when defining on the type level
    if (!message.responsePossible) {
      throw new Error(
        "Invariant: response not available for request kind:" + message.kind,
      );
    }
    const messageId = nanoid();

    // todo remember why this is broken

    const hotPromise = new Promise<ChildToParentMessage>((res, rej) => {
      const handleMessage = (event: MessageEvent<ChildToParentMessage>) => {
        if (event.origin !== "http://localhost:4200") {
          console.log("wrong orgiin", event);

          return;
        }

        if (event.data.id === messageId) {
          window.removeEventListener("message", handleMessage);
          res(event.data);
        } 
      };

      window.addEventListener("message", handleMessage);

      setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        rej();
      }, 2000);

      sendMessage({
        ...message,
        id: messageId,
      });
    });
    return hotPromise;
  };
};

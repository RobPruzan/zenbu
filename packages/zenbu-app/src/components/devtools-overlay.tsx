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
import { ChatInstanceContext, useChatStore } from "./chat-store";
import { IFRAME_ID } from "src/app/iframe-wrapper";
import { useWS } from "src/app/ws";

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

  const sendMessage = useIFrameMessenger();
  const project = useChatStore((state) => state.iframe.state.project);
  const { socket } = useWS({ projectName: project?.name ?? "" });
  const makeRequest = useMakeRequest();
  const { inspector, eventLog, chatControls } = useChatStore();

  useEffect(() => {
    if (!project) return;

    const handleMessage = (e: MessageEvent<ChildToParentMessage>) => {
      if (e.data.kind === "sync-action") {
        const iframe = document.getElementById("iframe") as HTMLIFrameElement;
        sendMessage(
          {
            from: e.data.from,
            kind: "sync-action",
            selector: e.data.selector,
          },
          { mobile: true },
        );
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [project, sendMessage]);

  useEffect(() => {
    if (!project) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) {
        return;
      }

      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) {
        return;
      }

      if (inspector.state.kind === "off") {
        return;
      }

      const now = Date.now();
      if (now - lastThrottleTimeRef.current < 16) {
        return;
      }
      lastThrottleTimeRef.current = now;

      const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement;
      if (!iframe) {
        return;
      }

      const rect = iframe.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        return;
      }

      makeRequest({
        kind: "clicked-element-info-request",
        responsePossible: true,
      }).then((response) => {
        if (response.kind !== "clicked-element-info-response") {
          return;
        }

        const { focusedInfo } = response;
        if (!focusedInfo) {
          return;
        }

        const { domRect } = focusedInfo;
        if (!domRect) {
          return;
        }

        const targetRect = {
          x: domRect.x,
          y: domRect.y,
          width: domRect.width,
          height: domRect.height,
        };

        targetRectRef.current = targetRect;

        if (!currentRectRef.current) {
          currentRectRef.current = targetRect;
        }

        const current = currentRectRef.current;

        const lerp = (start: number, end: number, t: number) =>
          start + (end - start) * t;

        const lerpRect = (
          start: RectPosition,
          end: RectPosition,
          t: number,
        ): RectPosition => ({
          x: lerp(start.x, end.x, t),
          y: lerp(start.y, end.y, t),
          width: lerp(start.width, end.width, t),
          height: lerp(start.height, end.height, t),
        });

        const animate = () => {
          if (!canvasRef.current) {
            return;
          }

          const ctx = canvasRef.current.getContext("2d");
          if (!ctx) {
            return;
          }

          if (!currentRectRef.current || !targetRectRef.current) {
            return;
          }

          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height,
          );

          const lerpedRect = lerpRect(
            currentRectRef.current,
            targetRectRef.current,
            0.2,
          );

          currentRectRef.current = lerpedRect;

          ctx.strokeStyle = "rgb(99, 102, 241)";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            lerpedRect.x,
            lerpedRect.y,
            lerpedRect.width,
            lerpedRect.height,
          );

          if (
            Math.abs(currentRectRef.current.x - targetRectRef.current.x) >
              0.1 ||
            Math.abs(currentRectRef.current.y - targetRectRef.current.y) >
              0.1 ||
            Math.abs(
              currentRectRef.current.width - targetRectRef.current.width,
            ) > 0.1 ||
            Math.abs(
              currentRectRef.current.height - targetRectRef.current.height,
            ) > 0.1
          ) {
            rafIdRef.current = requestAnimationFrame(animate);
          }
        };

        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(animate);
      });
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [inspector.state.kind, project]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
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
        // breaks if yo use react devtools
        // if (
        //   event.origin !== "http://localhost:4200" &&
        //   !(
        //     new URL(event.origin).port &&
        //     parseInt(new URL(event.origin).port, 10) > 59000
        //   )
        // ) {
        //   console.log("wrong orgiin", event);

        //   return;
        // }

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

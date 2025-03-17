import { nanoid } from "nanoid";

let z: any = { ref: null };
z.ref = z;
const TARGET_ORIGIN = "http://localhost:3000";

let currentMouseOverElement: Element | null = null;

const eventCatcher = document.createElement("div");
eventCatcher.style.position = "fixed";
eventCatcher.style.top = "0";
eventCatcher.style.left = "0";
eventCatcher.style.width = "100%";
eventCatcher.style.height = "100%";
eventCatcher.style.pointerEvents = "none";
eventCatcher.style.zIndex = "2147483647";
document.documentElement.appendChild(eventCatcher);

document.addEventListener("mousemove", (e) => {
  const target = e.target;

  if (!(target instanceof Element)) {
    currentMouseOverElement = null;
    return;
  }

  currentMouseOverElement = target;
  const rect = target.getBoundingClientRect();

  sendMessage({
    kind: "mouse-position-update",
    rect,
  });
});

export type ChildToParentMessage =
  | {
      kind: "mouse-position-update";
      rect: DOMRect;
      id?: string;
    }
  | {
      kind: "click-element-info";
      id?: string;
    }
  | {
      kind: "clicked-element-info-response";
      id: string;

      focusedInfo: FocusedInfo;
    }
  // im stupid id isn't needed can't figure out type
  | { kind: "get-state-request"; id?: string; responsePossible: true };

export type ParentToChildMessage =
  | {
      kind: "clicked-element-info-request";
      id: string;
      responsePossible?: boolean;
    }
  | {
      kind: "get-state-response";
      id: string;
      state: InspectorState;
    };

export type FocusedInfo = {
  domRect: DOMRect;
  name: string;
};

const sendMessage = (message: ChildToParentMessage) => {
  window.parent.postMessage(message, TARGET_ORIGIN);
};

// todo: need RPC to share store between parent and child

document.addEventListener(
  "pointerdown",
  () => {
    eventCatcher.style.pointerEvents = "auto";
  },
  {
    capture: true,
  }
);

document.addEventListener(
  "pointerup",
  () => {
    eventCatcher.style.pointerEvents = "none";
  },
  {
    capture: true,
  }
);

const handleParentMessage = (message: ParentToChildMessage) => {
  // console.log("the message", message);

  console.log("got message");

  switch (message.kind) {
    case "clicked-element-info-request": {
      if (!currentMouseOverElement) {
        // should return an error but don't support errors yet, let the timeout handle it for now
        return;
      }
      console.log("recv", currentMouseOverElement);

      sendMessage({
        kind: "clicked-element-info-response",
        id: message.id,
        focusedInfo: {
          domRect: currentMouseOverElement.getBoundingClientRect(),
          name: currentMouseOverElement.tagName,
        },
      });

      return;
    }
    case "get-state-response": {
      // not handled here
      return null;
    }
  }
  message satisfies never;
};

window.addEventListener("message", (event) => {
  if (event.origin !== TARGET_ORIGIN) {
    return;
  }
  handleParentMessage(event.data as any);
});


// const inspectorState =
/**
 *
 * basically treat this as a websocket connection
 */

/**
 *
 * todo: we need a ping pong server so parent knows if the child connection got interrupted
 */

/**
 *
 * - get state async is not what we want, we want sync from the parent reactively so we don't have to pull, async get is pull
 * - todo: we need to read from the parent if we are in inspecting state, if we read a click while in inspecting we add an event capture, block it, then feed back to the parent the element that was clicked (pretty nice API)
 *
 */

const getState: () => Promise<InspectorState> = async () => {
  const response = await makeRequest({
    kind: "get-state-request",
    responsePossible: true,
  });
  if (response.kind !== "get-state-response") {
    throw new Error("invariant");
  }

  return response.state;
};

export type InspectorState =
  | {
      kind: "off";
    }
  | {
      kind: "inspecting";
    }
  | {
      kind: "focused";
      focusedInfo: FocusedInfo;
    };

const makeRequest = async <
  T extends ChildToParentMessage & { responsePossible: true }
>(
  message: T
) => {
  if (!message.responsePossible) {
    throw new Error(
      "Invariant: response not available for request kind:" + message.kind
    );
  }
  const messageId = nanoid();

  sendMessage({
    ...message,
    id: messageId,
  });

  return new Promise<ParentToChildMessage>((res, rej) => {
    const handleMessage = (event: MessageEvent<ParentToChildMessage>) => {
      if (event.origin !== "http://localhost:4200") return;

      if (event.data.id === messageId) {
        res(event.data);
      }
    };

    window.addEventListener("message", handleMessage, { once: true });

    setTimeout(() => {
      rej();
    }, 1000);
  });
};

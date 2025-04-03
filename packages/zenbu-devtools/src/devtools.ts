import { record } from "@rrweb/record";
import type { eventWithTime } from "@rrweb/types";

const TARGET_ORIGIN = "http://localhost:3000";

// console.log("pls");

let currentMouseOverElement: Element | null = null;

// it would be nice in high freq calls to read the cached mouse move so we don't have to
// create a promise every time, so implicitly syncing the stores together
document.addEventListener("mousemove", (e) => {
  const target = e.target;

  if (!(target instanceof Element)) {
    currentMouseOverElement = null;
    return;
  }

  currentMouseOverElement = target;
  const rect = target.getBoundingClientRect();
  // console.log("sent update", rect);

  // console.log('sending update');

  sendMessage({
    kind: "mouse-position-update",
    rect,
  });
});

export type ChildToParentMessage =
  | {
      kind: "notification";
      event: any;
    }
  | {
      kind: "mouse-position-update";
      rect: DOMRect;
      id?: string;
    }
  | {
      kind: "click-element-info";
      focusedInfo: FocusedInfo;
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
      // why is this a bool and not a literal lol
      responsePossible?: boolean;
    }
  | {
      kind: "get-state-response";
      id: string;
      state: InspectorState;
    }
  // an api where this automatically had a response included in the def would be nice vs
  // having to manually define it on the
  | {
      kind: "start-recording";
      id: string;
      responsePossible: true;
    }
  | {
      kind: "stop-recording";
      id: string;
    };

export type FocusedInfo = {
  domRect: DOMRect;
  name: string;
  outerHTML: string;
};

const sendMessage = (message: ChildToParentMessage) => {
  window.parent.postMessage(message, TARGET_ORIGIN);
};

const iife = <T>(f: () => T): T => f();

// todo: need RPC to share store between parent and child

const blockClick = (shouldHandle: boolean) => async (e: MouseEvent) => {
  if ((await getState()).kind !== "inspecting") {
    return;
  }
  e.stopPropagation();
  e.preventDefault();

  const target = e.target;

  if (!(target instanceof Element)) {
    // todo: determine correct behavior
    return;
  }
  if (!shouldHandle) {
    return;
  }
  iife(async () => {
    sendMessage({
      kind: "click-element-info",
      focusedInfo: {
        domRect: target.getBoundingClientRect(),
        name: target.tagName,
        outerHTML: target.outerHTML,
      },
    });
  });
};

document.addEventListener("pointerdown", blockClick(false));

document.addEventListener("click", blockClick(true));

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

let stopRecording: null | ReturnType<typeof record> = null;

let events: Array<eventWithTime> = [];

window.addEventListener("message", (event) => {
  if (event.origin !== "http://localhost:3000") return;
  const data = event.data as ParentToChildMessage;

  switch (data.kind) {
    case "start-recording": {
      stopRecording = record({
        recordCanvas: true,
        emit: (event) => {
          events.push(event);
        },
      });
      console.log("is this anything lol?", stopRecording);
      return;
    }
    case "stop-recording": {
      if (!stopRecording) {
        console.error(
          "Invariant: cannot stop recording when a recording is not ongoing"
        );
      }

      stopRecording?.();
    }
  }
});

const makeRequest = async <
  T extends ChildToParentMessage & { responsePossible: true },
>(
  message: T
) => {
  if (!message.responsePossible) {
    throw new Error(
      "Invariant: response not available for request kind:" + message.kind
    );
  }
  const messageId = genId();

  sendMessage({
    ...message,
    id: messageId, // wat
  });

  return new Promise<ParentToChildMessage>((res, rej) => {
    const handleMessage = (event: MessageEvent<ParentToChildMessage>) => {
      if (event.origin !== "http://localhost:3000") return;

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

let last = 0;

const genId = () => {
  return `${last++}`;
};

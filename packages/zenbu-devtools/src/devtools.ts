import { record } from "@rrweb/record";
import type { eventWithTime } from "@rrweb/types";

console.log("bro mode cock");

window.addEventListener("load", () => {
  console.log("loaded, sending message");

  setTimeout(() => {
    sendMessage({
      kind: "load",
    });
  }, 200);
});

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

  // console.log("sending update");

  sendMessage({
    kind: "mouse-position-update",
    rect,
  });
});

export type ChildToParentMessage =
  | { kind: "sync-action"; selector: string; from: string }
  | {
      kind: "load";
    }
  | {
      kind: "console";
      data: any[];
    }
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
  | { kind: "get-state-request"; id?: string; responsePossible: true }
  | { kind: "screenshot-response"; dataUrl: string; id: string }
  // when the child iframe is focused it swallows all events, which breaks our command menu impl
  | { kind: "keydown"; key: string; metaKey: boolean; ctrlKey: boolean };

export type ParentToChildMessage =
  | {
      kind: "sync-action";
      from: string;
      selector: string;
    }
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
    }
  | {
      kind: "take-screenshot";
      responsePossible: true;
      id: string;
    };

export type FocusedInfo = {
  domRect: DOMRect;
  name: string;
  outerHTML: string;
};

const sendMessage = (message: ChildToParentMessage) => {
  // console.log("posting to", TARGET_ORIGIN, message);

  window.parent.postMessage(message, TARGET_ORIGIN);
};
document.addEventListener("keydown", (e) => {
  if (e.metaKey && e.key === "p") {
    e.preventDefault();
    // if we want the parent frame to control this (not unconditionally do this
    // here), we need to await a response from the parent iframe to determine
    // how to do this, could cause a lost frame on every keydown which is quite
    // unfortunate
  }

  sendMessage({
    kind: "keydown",
    key: e.key,
    metaKey: e.metaKey,
    ctrlKey: e.ctrlKey,
  });
});

const iife = <T>(f: () => T): T => f();


// usage in an event handler:
// todo: need RPC to share store between parent and child

const pageId = nanoid();

function getFirstButtonAncestor(
  element: HTMLElement
): HTMLButtonElement | null {
  let current: HTMLElement | null = element;

  while (current) {
    if (current.tagName.toLowerCase() === "button") {
      return current as HTMLButtonElement;
    }
    current = current.parentElement;
  }

  return null;
}
function getFirstElementWithId(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current) {
    if (current.id) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

const blockClick = (shouldHandle: boolean) => async (e: MouseEvent) => {
  console.log("sending click", e.target);

  sendMessage({
    kind: "sync-action",
    from: pageId,
    selector: getFirstElementWithId(e.target as HTMLElement)!.id,
  });
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

window.addEventListener("message", async (event) => {
  if (event.origin !== "http://localhost:3000") return;
  const data = event.data as ParentToChildMessage;

  switch (data.kind) {
    case "sync-action": {
      if (pageId === data.from) {
        return;
      }
      const element = document.getElementById(data.selector) as HTMLElement;
      const clickEl = getFirstButtonAncestor(element);
      if (!clickEl) {
        console.log("no element for", data.selector);

        return;
      }

      console.log("clicking", clickEl);

      clickEl?.click();
      return;
    }
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
      return;
    }

    case "take-screenshot": {
      console.log("taking screenshot");

      const dataUrl = await screenshot();
      // console.log("took screenshot", dataUrl);

      sendMessage({
        id: data.id,
        kind: "screenshot-response",
        dataUrl: dataUrl,
      });
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

// import workerUrl from 'modern-screenshot/worker?url'
import { createContext, destroyContext, domToPng } from "modern-screenshot";
import {} from "modern-screenshot/worker";
import { nanoid } from "nanoid";

var __WORKER_CODE__ = "";

const screenshotNice = () => {
  domToPng(document.documentElement).then((dataUrl) => {
    console.log(dataUrl);
  });
};

// @ts-expect-error
window.ss = () => {
  console.log("screenshotting");
  screenshotNice();
};

const createWorkerContext = () => {
  const blob = new Blob([__WORKER_CODE__], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(blob);

  return {
    workerUrl,
    cleanup: () => {
      URL.revokeObjectURL(workerUrl);
    },
  };
};

// @ts-expect-error
window.createWorkerContext = createWorkerContext;

async function screenshot() {
  console.log("taking screenshot");

  const worker = createWorkerContext();
  const context = await createContext(document.documentElement, {
    workerNumber: 1,
    workerUrl: worker.workerUrl,
  });

  return domToPng(context);
  // for (let i = 0; i < 10; i++) {
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  // }
}

// @ts-expect-error
window.sps = screenshot;

// const originalConsoleLog = window.console.log;
// window.console.log = (...data: any[]) => {
//   // this does not work, since ownership of this data is now lost and sent to the parent
//   /**
//    * we have a few options:
//    * - serialize it, avoid circular structures, this will be very expensive to do all the time, very very expensive
//    * = do what chrome does, maintain a mapping back to the object in some store, make it a weak map with the object id, send the object
//    * id back to the parent process, when requested, if still alive we provide the object, otherwise we tell the user this
//    * object no longer exists (vs the dog shit chrome implementation)
//    *
//    * we can also do some simple parsing (like we do in react scan) to give some info for dead objects that will not be expensive
//    * does not have to be all or nothing, would also be nice to configure this at runtime how much you want to tweak this for hard cases
//    *
//    *
//    * we could actually do a smart strategy for this with time budgets/pressure on the console to determine
//    * how much we should parse ahead of time
//    *
//    * the general case this is actually quite ideal
//    *
//    *
//    */
//   sendMessage({
//     kind: "console",
//     data,
//   });

//   originalConsoleLog(...data);
// };

// setInterval(() => {
//   const x = { y: null };
//   x.y = x as any;
//   console.log("yolos", x);
// }, 500);

const patchNetwork = () => {
  /**
   * we luckily don't need to do lazy things for patching network requests
   * since the input must be serialized/sent to another process already
   *
   * the response is more tricky
   *
   * we can clone the request every time to read the json, this might be expensive
   * and you may not want to always do it
   *
   * we can keep a reference to the response object? And lazily read it if still alive?
   *
   * im not super worried about memory, we can have some gc strategy that can be tweaked
   *
   * can internally manage this based on time/ how much data we have collected
   *
   * we can also just read heap size in some browsers which would be nice but kind of a
   * wack heuristic, but this is pretty hard to build a cache for
   *
   *
   */
};

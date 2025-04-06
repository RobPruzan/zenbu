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

  // console.log('sending update');

  sendMessage({
    kind: "mouse-position-update",
    rect,
  });
});

export type ChildToParentMessage =
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
  window.parent.postMessage(message, TARGET_ORIGIN);
};
document.addEventListener("keydown", (e) => {
  console.log("hola");

  sendMessage({
    kind: "keydown",
    key: e.key,
    metaKey: e.metaKey,
    ctrlKey: e.ctrlKey,
  });
});

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

window.addEventListener("message", async (event) => {
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
      return;
    }

    case "take-screenshot": {
      const dataUrl = await screenshot();
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

// const workerCode = `var B=Object.defineProperty;var b=Object.getOwnPropertySymbols;var y=Object.prototype.hasOwnProperty,F=Object.prototype.propertyIsEnumerable;var g=(r,t,e)=>t in r?B(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e,U=(r,t)=>{for(var e in t||(t={}))y.call(t,e)&&g(r,e,t[e]);if(b)for(var e of b(t))F.call(t,e)&&g(r,e,t[e]);return r};var p=(r,t)=>{var e={};for(var o in r)y.call(r,o)&&t.indexOf(o)<0&&(e[o]=r[o]);if(r!=null&&b)for(var o of b(r))t.indexOf(o)<0&&F.call(r,o)&&(e[o]=r[o]);return e};var x=(r,t,e)=>new Promise((o,w)=>{var h=n=>{try{d(e.next(n))}catch(u){w(u)}},R=n=>{try{d(e.throw(n))}catch(u){w(u)}},d=n=>n.done?o(n.value):Promise.resolve(n.value).then(h,R);d((e=e.apply(r,t)).next())});(function(){"use strict";var u;const r="[modern-screenshot]",e=typeof window!="undefined"?(u=window.navigator)==null?void 0:u.userAgent:"",o=e.includes("Chrome");e.includes("AppleWebKit"),e.includes("Firefox");const w=(...a)=>console.warn(r,...a);function h(a,l){return new Promise((i,s)=>{const c=new FileReader;c.onload=()=>i(c.result),c.onerror=()=>s(c.error),c.onabort=()=>s(new Error(`Failed read blob to ${l}`)),c.readAsDataURL(a)})}const R=a=>h(a,"dataUrl");function d(a){const E=a,{url:l,timeout:i,responseType:s}=E,c=p(E,["url","timeout","responseType"]),m=new AbortController,A=i?setTimeout(()=>m.abort(),i):void 0;return fetch(l,U({signal:m.signal},c)).then(f=>{if(!f.ok)throw new Error("Failed fetch, not 2xx response",{cause:f});switch(s){case"arrayBuffer":return f.arrayBuffer();case"dataUrl":return f.blob().then(R);case"text":default:return f.text()}}).finally(()=>clearTimeout(A))}const n=self;n.onmessage=a=>x(this,null,function*(){const l=a.data,i=l.rawUrl||l.url;try{const s=yield d(l);n.postMessage({url:i,result:s})}catch(s){w(s),n.postMessage({url:i})}})})();`
var __WORKER_CODE__ = "";
console.log("oy", __WORKER_CODE__);

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

// async function screenshotsPerSecond() {

// }

console.log("hai");

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
console.log("confirmation");

// @ts-expect-error
window.sps = screenshot;

const originalConsoleLog = window.console.log;
window.console.log = (...data: any[]) => {
  // this does not work, since ownership of this data is now lost and sent to the parent 
/**
 * we have a few options:
 * - serialize it, avoid circular structures, this will be very expensive to do all the time, very very expensive
 * = do what chrome does, maintain a mapping back to the object in some store, make it a weak map with the object id, send the object
 * id back to the parent process, when requested, if still alive we provide the object, otherwise we tell the user this
 * object no longer exists (vs the dog shit chrome implementation)
 * 
 * we can also do some simple parsing (like we do in react scan) to give some info for dead objects that will not be expensive
 * does not have to be all or nothing, would also be nice to configure this at runtime how much you want to tweak this for hard cases
 * 
 * 
 * we could actually do a smart strategy for this with time budgets/pressure on the console to determine
 * how much we should parse ahead of time
 * 
 * the general case this is actually quite ideal
 * 
 * 
 */
  sendMessage({
    kind: "console",
    data,
  });

  originalConsoleLog(...data);
};

setInterval(() => {
  const x = { y: null };
  x.y = x as any;
  console.log("yolos", x);
}, 500);



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
}
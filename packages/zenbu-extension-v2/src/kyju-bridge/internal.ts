// import { useEffect } from "react";
// i dunno todo
import React, { useEffect, useId, useState } from "react";
import { useEffectImpl, useDistributedContext } from "./public";

export type SocketInstance = Socket;

export const packRemote = (fn: Function) => {
  return fn.toString();
};

// export const unpackRemote = (fnString: string) => {

//   return fn;
// };

export const readRemoteContext = () => {};

// const useState = <T,>(initial: any) => [{} as any, () => null];
const useContext = (args: any) => ({} as any);
export const contextTagMap = new Map<any, any>();

export const fiberMap = new Map<
  string,
  {
    currentHookIndex: number;
    hooks: any[];
  }
>();
export const setupIframeListener = () => {
  window.addEventListener(
    "message",
    (
      e: MessageEvent<
        | {
            kind: "context-return";
            ctx: any;
            returnTo: {
              fiberId: string;
              index: number;
            };
          }
        | {
            kind: "use-remote";
            message: string;
            fiberId: string;
          }
      >
    ) => {
      switch (e.data.kind) {
        case "use-remote": {
          const data = e.data;
          const _ = handleMessage(data);
          return;
        }
        case "context-return": {
          const fiber = fiberMap.get(e.data.returnTo.fiberId);
          if (!fiber) {
            throw new Error("todo");
          }
          const associatedContext = fiber.hooks[e.data.returnTo.index];
          // just a concept haven't decided how setting + resolving will work, probably just a promise/use interface
          associatedContext.current = e.data.ctx;
          associatedContext.resolve();
          return;
        }
      }
    }
  );
};

export type MessageChannelData = {
  fiberId: string;
  message: any;
  kind: "use-remote";
};
export const handleMessage = (data: MessageChannelData) => {
  console.log("fn", data.message);
  const fn = new Function(
    `return (${data.message
      // get rid of vite transforms, very brittle
      .replace(/use([A-Z][a-zA-Z0-9]*)\d+/g, "use$1")
      .replace(/_s\d+\(\);?/g, "")})`
  )();
  /**
   * what am i doing? It should be the same implementation right?
   *
   * this does not env specific stuff, we need the message abstraction,
   * but i guess you can argue you need to see the 2 individual cases to make
   * a good abstraction, but i have that up now?
   *
   * er alright abstract time, what can we abstract
   *
   * i guess the internal fibers, the handlers etc, the handlers actually
   * can be generalized quite easily, just take the content here
   * and expose it and it should work in both directions
   *
   * the message abstraction doesn't really need to be made here to have something
   * cooking, but it would be nice to hook up future protocols er
   */

  function useEffect(fn: () => void, deps: any[]) {
    console.log("running useEffect");

    let existingEffectMaybe = fiberMap.get(data.fiberId);
    if (!existingEffectMaybe) {
      const newFiber = {
        currentHookIndex: 0,
        hooks: [],
      };
      existingEffectMaybe = newFiber;
      fiberMap.set(data.fiberId, newFiber);
    }
    useEffectImpl(() => {}, []);
  }
  fn({ useEffect });
};

/**
 * special implementation just to explore
 */
// export const useRemoteSever = (
//   fn: (deps: { useEffect: (fn: () => void, deps: any[]) => void }) => void
// ) => {
//   const fiberId = useId();
//   const remoteFn = packRemote(fn);
//   const { socket } = useWS({ onMessage: () => {}, roomName: "test-room" });
//   useEffect(() => {
//     /**
//      *
//      * need to use server impl
//      *
//      */
//     if (!socket) {
//       return;
//     }

//     socket.emit("message", {
//       fiberId,
//       kind: "use-remote",
//       message: remoteFn,
//     } satisfies MessageChannelData);
//   }, [socket]);

//   // sendToRemote({
//   //   kind: "use-remote",
//   //   message: remoteFn,
//   //   fiberId,
//   // });
//   /**
//    * yes next up is verifying this server side useEffect works which shouldn't
//    * be too bad, we just need to verify this message boundary
//    */

//   if (socket) {
//     socket.emit("message", {
//       fiberId,
//       kind: "use-remote",
//       message: remoteFn,
//     } satisfies MessageChannelData);
//   }
// };


export const sendToParent = (args: { kind: "ctx-return"; message: any }) => {
  window.parent.postMessage(args, "*");
};

export const sendToRemote = (
  args:
    | {
        kind: "use-remote";
        message: unknown;
        fiberId: string;
      }
    | {
        kind: "effect";
        fiberId: string;
      }
) => {
  console.log("sending to remote");

  switch (args.kind) {
    case "use-remote": {
      const iframe = document.getElementById("iframe") as
        | HTMLIFrameElement
        | undefined;
      if (!iframe) {
        console.log("no iframe found");

        return;
      }
      if (!iframe.contentWindow) {
        return;
      }
      iframe.contentWindow.postMessage(
        {
          kind: "use-remote",
          message: args.message,
          fiberId: args.fiberId,
        },
        "*"
      );
      return;
    }
    case "effect": {
      let fiber = fiberMap.get(args.fiberId);
      if (!fiber) {
        fiber = {
          currentHookIndex: 0,
          hooks: [],
        };
        fiberMap.set(args.fiberId, fiber);
      }
      fiber.hooks.map((hook) => {
        // effect stuff todo
      });

      return;
    }
  }
};

// export const IFrame = () => {
//   return (
//     <iframe
//       id="iframe"
//       srcDoc={`
//         <!DOCTYPE html>
//         <html>
//         <script>
//         console.log("iframe running")
//         </script>
//           <body>
//             <script src="http://localhost:7001"></script>
//           </body>
//         </html>
//       `}
//     />
//   );
// };

export const html = (strings: TemplateStringsArray, ...values: any[]) =>
  String.raw({ raw: strings }, ...values);

type todo = any;

export const useReadInternalContext = (tag: string) => {
  const context = contextTagMap.get(tag);

  if (!context) {
    throw new Error("invariant for now");
  }

  return context;
};

export const HookManager = () => {
  const [contextLookups, setContextLookups] = useState<
    Array<{
      tag: string;
      returnTo: {
        fiberId: string;
        index: number;
      };
    }>
  >([]);

  // todo
  // contextLookups.map((ctxMeta) => {
  //   const ctx = contextTagMap.get(ctxMeta.tag) as any;
  //   const distributedCtx = useContext(ctx);

  //   sendToParent({
  //     kind: "ctx-return",
  //     message: {
  //       ctx: distributedCtx,
  //       returnTo: ctxMeta.returnTo,
  //     },
  //   });
  // });

  // useEffect(() => {
  //   const iframe = document.getElementById("iframe") as
  //     | HTMLIFrameElement
  //     | undefined;

  //   if (!iframe) {
  //     return;
  //   }
  //   if (!iframe.contentWindow) {
  //     return;
  //   }

  //   iframe.contentWindow.addEventListener("message", () => {});
  // }, []);

  return null;
};
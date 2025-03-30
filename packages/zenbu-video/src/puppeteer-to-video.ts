import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import type { RRwebPlayerOptions } from "rrweb-player";
import type { eventWithTime } from "@rrweb/types";

const rrwebScriptPath = path.resolve(
  require.resolve("rrweb-player"),
  "../../dist/index.js"
);
// if i want to use it ReactScanReplayPlugin
const rrwebStylePath = path.resolve(rrwebScriptPath, "../style.css");
const rrwebRaw = fs.readFileSync(rrwebScriptPath, "utf-8");
const rrwebStyle = fs.readFileSync(rrwebStylePath, "utf-8");
// const reactScanRaw = fs.readFileSync(
//   "/Users/robby/dashboard-demo/packages/s3/node_modules/react-scan/dist/index.global.js",
//   "utf-8"
// );

// todo: why are clips sometimes out of order, i lost the logs, but it looked something like
// timestamp: 2800
// timestamp: 1500
// when listening for the events being played in the player
// when this happened, the video recording was cut short, perhaps the end frame was hit too early

// todo, if the replayer does not play its last event for some timeout period, alert puppeteer and retry n times
function getHtml(
  events: Array<eventWithTime>,
  config?: Omit<RRwebPlayerOptions["props"], "events">
): string {
  return `
<html>
  <head>
    <style>${rrwebStyle}</style>
    <style>
      html, body { 
        margin: 0; 
        padding: 0; 
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      @keyframes cursorFlash {
        0% { 
          filter: none;
          background-image: url("data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMCIgd2lkdGg9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkYXRhLW5hbWU9IkxheWVyIDEiIHZpZXdCb3g9IjAgMCA1MCA1MCI+PHBhdGggc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9IiMwMDAwMDAiIGQ9Ik00OC43MSA0Mi45MUwzNC4wOCAyOC4yOSA0NC4zMyAxOGExIDEgMCAwMC0uMzMtMS42MUwyLjM1IDEuMDZhMSAxIDAgMDAtMS4yOSAxLjI5TDE2LjM5IDQ0YTEgMSAwIDAwMS42NS4zNmwxMC4yNS0xMC4yOCAxNC42MiAxNC42M2ExIDEgMCAwMDEuNDEgMGw0LjM4LTQuMzhhMSAxIDAgMDAuMDEtMS40MnptLTUuMDkgMy42N0wyOSAzMmExIDEgMCAwMC0xLjQxIDBsLTkuODUgOS44NUwzLjY5IDMuNjlsMzguMTIgMTRMMzIgMjcuNThBMSAxIDAgMDAzMiAyOWwxNC41OSAxNC42MnoiLz48L3N2Zz4=");
        }
        50% { 
          filter: none;
          background-image: url("data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMCIgd2lkdGg9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkYXRhLW5hbWU9IkxheWVyIDEiIHZpZXdCb3g9IjAgMCA1MCA1MCI+PHBhdGggc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9IiNmZjAwMDAiIGQ9Ik00OC43MSA0Mi45MUwzNC4wOCAyOC4yOSA0NC4zMyAxOGExIDEgMCAwMC0uMzMtMS42MUwyLjM1IDEuMDZhMSAxIDAgMDAtMS4yOSAxLjI5TDE2LjM5IDQ0YTEgMSAwIDAwMS42NS4zNmwxMC4yNS0xMC4yOCAxNC42MiAxNC42M2ExIDEgMCAwMDEuNDEgMGw0LjM4LTQuMzhhMSAxIDAgMDAuMDEtMS40MnptLTUuMDkgMy42N0wyOSAzMmExIDEgMCAwMC0xLjQxIDBsLTkuODUgOS44NUwzLjY5IDMuNjlsMzguMTIgMTRMMzIgMjcuNThBMSAxIDAgMDAzMiAyOWwxNC41OSAxNC42MnoiLz48L3N2Zz4=");
        }
        100% { 
          filter: none;
          background-image: url("data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMCIgd2lkdGg9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkYXRhLW5hbWU9IkxheWVyIDEiIHZpZXdCb3g9IjAgMCA1MCA1MCI+PHBhdGggc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9IiMwMDAwMDAiIGQ9Ik00OC43MSA0Mi45MUwzNC4wOCAyOC4yOSA0NC4zMyAxOGExIDEgMCAwMC0uMzMtMS42MUwyLjM1IDEuMDZhMSAxIDAgMDAtMS4yOSAxLjI5TDE2LjM5IDQ0YTEgMSAwIDAwMS42NS4zNmwxMC4yNS0xMC4yOCAxNC42MiAxNC42M2ExIDEgMCAwMDEuNDEgMGw0LjM4LTQuMzhhMSAxIDAgMDAuMDEtMS40MnptLTUuMDkgMy42N0wyOSAzMmExIDEgMCAwMC0xLjQxIDBsLTkuODUgOS44NUwzLjY5IDMuNjlsMzguMTIgMTRMMzIgMjcuNThBMSAxIDAgMDAzMiAyOWwxNC41OSAxNC42MnoiLz48L3N2Zz4=");
        }
      }
      .replayer-mouse.flash-interaction {
        animation: cursorFlash 500ms ease-in-out;
      }
      .replayer-wrapper {
        transform: none !important;
        width: 100% !important;
        height: 100% !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
      }
      .rr-player {
        width: 100% !important;
        height: 100% !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
      }
      .replayer-mouse {
        background-image: url("data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMCIgd2lkdGg9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBkYXRhLW5hbWU9IkxheWVyIDEiIHZpZXdCb3g9IjAgMCA1MCA1MCI+PHBhdGggc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9IiMwMDAwMDAiIGQ9Ik00OC43MSA0Mi45MUwzNC4wOCAyOC4yOSA0NC4zMyAxOGExIDEgMCAwMC0uMzMtMS42MUwyLjM1IDEuMDZhMSAxIDAgMDAtMS4yOSAxLjI5TDE2LjM5IDQ0YTEgMSAwIDAwMS42NS4zNmwxMC4yNS0xMC4yOCAxNC42MiAxNC42M2ExIDEgMCAwMDEuNDEgMGw0LjM4LTQuMzhhMSAxIDAgMDAuMDEtMS40MnptLTUuMDkgMy42N0wyOSAzMmExIDEgMCAwMC0xLjQxIDBsLTkuODUgOS44NUwzLjY5IDMuNjlsMzguMTIgMTRMMzIgMjcuNThBMSAxIDAgMDAzMiAyOWwxNC41OSAxNC42MnoiLz48L3N2Zz4=") !important;
        width: 20px !important;
        height: 20px !important;
        background-size: contain !important;
        background-position: 50% !important;
        background-repeat: no-repeat !important;
        background-color: transparent !important;
        border-radius: 0 !important;
      }
      .replayer-mouse::after {
        display: none !important;
      }
      .replayer-mouse-tail {
        position: absolute;
        pointer-events: none;
      }
      @keyframes pulseCircle {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          border-width: 2px;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.5);
          border-width: 4px;
        }
        100% {
          transform: translate(-50%, -50%) scale(2);
          opacity: 0;
          border-width: 4px;
        }
      }
      .interaction-pulse {
        pointer-events: none;
        position: fixed;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid #ef4444;
        animation: pulseCircle 500ms ease-out forwards;
      }
    </style>
  </head>
  <body>
    <script>
      ${rrwebRaw};
      /*<!--*/
      const events = ${JSON.stringify(events).replace(
        /<\/script>/g,
        "<\\/script>"
      )};
      /*-->*/
      const userConfig = ${config ? JSON.stringify(config) : {}};
      
      const plugin = new ReactScan.ReactScanReplayPlugin();
      
      window.replayer = new rrwebPlayer({
        target: document.body,
        props: {
          events,
          showController: false,
          plugins: [plugin,
            {
             handler: (event) => {
             console.log("playing event at", event.timestamp - ${events[0].timestamp})
             window.onTimeUpdate?.(event.timestamp - ${events[0].timestamp})
              console.log(event.timestamp - ${events[0].timestamp})
              if (event.type === 6 && event.data.plugin === 'react-scan-meta'){
               if (event.data.payload.kind === "interaction-start") {
                 const mouseEl = document.querySelector('.replayer-mouse');
                 if (mouseEl) {
                   const rect = mouseEl.getBoundingClientRect();
                   const pulseEl = document.createElement('div');
                   pulseEl.className = 'interaction-pulse';
                   pulseEl.style.left = rect.left + (rect.width / 2) + 'px';
                   pulseEl.style.top = rect.top + (rect.height / 2) + 'px';
                   document.body.appendChild(pulseEl);
                   pulseEl.addEventListener('animationend', () => {
                     pulseEl.remove();
                   });
                 }
               }
               window.onInteraction?.(event.data.payload, event.timestamp - ${events[0].timestamp})
              }
              }
            }
          ],
          mouseTail: {
            duration: 800,
            lineCap: "round", 
            lineWidth: 3,
            strokeStyle: "#3b82f6",
            fillStyle: "#ffffff"
          },
          ...userConfig
        },
      });

      // Debug logging
      console.log('Total events:', events.length);
      console.log('First event timestamp:', events[0].timestamp);
      console.log('Last event timestamp:', events[events.length - 1].timestamp);

      window.replayer.play();
      
      window.replayer.addEventListener('finish', () => {
        console.log('Replay finished!');
        window.onReplayFinish?.();
      });

      window.replayer.addEventListener('state-change', state => {
      if ("onStateChange" in window){
        // window.onStateChange(Object.keys(JSON.stringify(state.player,, )));

        console.log('Player state:', state);
      }else {
      console.log("no cb wat")
    }
      });
    </script>
  </body>
</html>
`;
}

/*
todo: 
- we definitely have the event timestamps, but those timestamps are scuffed af (but we should be able to convert them)
- i will just set my own timestamp in date now, just assume we have it 
- actually no this is fine, we can read the react scan event time
- see the time its read, and set that metadata

*/

interface RRvideoConfig {
  fps: number;
  headless: boolean;
  cb: (
    ret: {
      output: string;
      metadata: Array<
        | {
            kind: "interaction-end";
            dateNowTimestamp: number;
            interactionUUID: string;
            atInOriginalVideo: number;
            memoryUsage: null | number;
          }
        | {
            kind: "interaction-start";
            dateNowTimestamp: number;
            atInOriginalVideo: number;
            interactionUUID: string;
          }
        | {
            kind: "fps-update";
            dateNowTimestamp: number;
            atInOriginalVideo: number;
          }
      >;
    },
    error: Error | null
  ) => void;
  output: string;
  rrwebPlayer?: Omit<RRwebPlayerOptions["props"], "events">;
  width?: number;
  height?: number;
  events: Array<eventWithTime>;
  trueEndAtDateTime: number;
}

const defaultConfig = {
  fps: 15,
  headless: false,
  cb: () => {},
  output: "output.mp4",
  rrwebPlayer: {},
};

//  async function transformToVideo(
//   config: Partial<RRvideoConfig> &
//     Pick<RRvideoConfig, "events" | "output" | "trueEndAtDateTime">
// ): Promise<{
//   output: string;
//   metadata: Array<
//     | {
//         kind: "interaction-end";
//         dateNowTimestamp: number;
//         interactionUUID: string;
//         atInOriginalVideo: number;
//       }
//     | {
//         kind: "interaction-start";
//         dateNowTimestamp: number;
//         interactionUUID: string;
//         atInOriginalVideo: number;
//       }
//     | {
//         kind: "fps-update";
//         dateNowTimestamp: number;
//         atInOriginalVideo: number;
//       }
//   >;
// }> {
//   return new Promise((resolve, reject) => {
//     const fullConfig: RRvideoConfig = {
//       ...defaultConfig,
//       ...config,
//       cb(result, error) {
//         if (error) {
//           reject(error);
//         } else {
//           resolve(result);
//         }
//       },
//     };

//     /*
//     why is there such a big delay to capturing clips?

//     after
// player never started
// time update 71
// SET PLAYER SETART
// vut 9571.173541
// time update 336
// time update 399
// time update 458
// time update 959
// time update 742
// time update 747
// time update 759
// time update 764
// [FFmpeg Capture] ffmpeg version 7.1 Copyright (c) 2000-2024 the FFmpeg developers
//   built with Apple clang version 16.0.0 (clang-1600.0.26.4)
//   configuration: --prefix=/opt/homebrew/Cellar/ffmpeg/7.1_1 --enable-shared --enable-pthreads --enable-version3 --cc=clang --host-cflags= --host-ldflags='-Wl,-ld_classic' --enable-ffplay --enable-gnutls --enable-gpl --enable-libaom --enable-libaribb24 --enable-libbluray --enable-libdav1d --enable-libharfbuzz --enable-libjxl --enable-libmp3lame --enable-libopus --enable-librav1e --enable-librist --enable-librubberband --enable-libsnappy --enable-libsrt --enable-libssh --enable-libsvtav1 --enable-libtesseract --enable-libtheora --enable-libvidstab --enable-libvmaf --enable-libvorbis --enable-libvpx --enable-libwebp --enable-libx264 --enable-libx265 --enable-libxml2 --enable-libxvid --enable-lzma --enable-libfontconfig --enable-libfreetype --enable-frei0r --enable-libass --enable-libopencore-amrnb --enable-libopencore-amrwb --enable-libopenjpeg --enable-libspeex --enable-libsoxr --enable-libzmq --enable-libzimg --disable-libjack --disable-indev=jack --enable-videotoolbox --enable-audiotoolbox --enable-neon
//   libavutil      59. 39.100 / 59. 39.100
//   libavcodec     61. 19.100 / 61. 19.100
//     */

//     BrowserCluster.execute(async ({ page }) => {
//       console.log("executing on browser cluset");

//       const { events, output, width, height, fps, trueEndAtDateTime } =
//         fullConfig;

//       const startTime = events[0].timestamp;
//       const endTime = events[events.length - 1].timestamp;
//       const durationMs = endTime - startTime;
//       const durationSec = durationMs / 1000;

//       const metaEvent = events.at(0);
//       // @ts-expect-error
//       const viewportWidth = width || metaEvent?.data.width;
//       const viewportHeight =
//         // @ts-expect-error
//         height || metaEvent?.data.height;

//       if (!viewportWidth || !viewportHeight) {
//         throw new Error("invariant, couldn't derive resolution");
//       }

//       console.log("before");

//       await page.setViewport({
//         width: viewportWidth,
//         height: viewportHeight,
//       });
//       console.log("et viewport");

//       await page.goto("about:blank");
//       console.log("went to blabk");

//       await page.setContent(
//         getHtml(events, {
//           width: viewportWidth,
//           height: viewportHeight,
//           speed: 1,
//         })
//       );
//       console.log("set html");

//       const captureProcess = spawn("ffmpeg", [
//         "-framerate",
//         fps.toString(),
//         "-f",
//         "image2pipe",
//         "-i",
//         "-",
//         "-vf",
//         "pad=ceil(iw/2)*2:ceil(ih/2)*2",
//         "-c:v",
//         "libx264",
//         "-preset",
//         "ultrafast",
//         "-pix_fmt",
//         "yuv420p",
//         "-y",
//         output,
//       ]);

//       captureProcess.stderr?.setEncoding("utf-8");
//       let captureError = "";
//       captureProcess.stderr?.on("data", (data) => {
//         captureError += data;
//         console.log("[FFmpeg Capture]", data);
//       });

//       let lastFrame: Uint8Array | null = null;

//       // im retarded this does not need to be a ref
//       let playerStart: { current: null | number } = { current: null };
//       await page.exposeFunction("onTimeUpdate", (time: number) => {
//         console.log("time update", time);

//         if (!playerStart.current) {
//           console.log("SET PLAYER SETART");

//           playerStart.current = performance.now();
//           console.log("vut", playerStart.current);
//         }
//         // console.log("time", time);
//       });
//       let isFinished = false;
//       // oh i think what's happening is it recorded no more events, causing it to call replay finish even tho
//       // there's still more time? Making the experience jank
//       /**
//        * how to solve it:
//        * - send up the last replayed timestamp
//        * - keep taking screenshots and await that period
//        * - then we will have the correct timing :)
//        */
//       await page.exposeFunction("onReplayFinish", () => {
//         // console.log("on replay finish called, wut..!");

//         // setTimeout(() => {
//         isFinished = true;
//         // }, 3000); // uh am i cooked chat
//       });
//       const metadata: Array<
//         | {
//             kind: "interaction-end";
//             dateNowTimestamp: number;
//             interactionUUID: string;
//             atInOriginalVideo: number;
//           }
//         | {
//             kind: "interaction-start";
//             dateNowTimestamp: number;
//             interactionUUID: string;
//             atInOriginalVideo: number;
//           }
//         | {
//             kind: "fps-update";
//             dateNowTimestamp: number;
//             atInOriginalVideo: number;
//           }
//       > = [];

//       let unscreenshottedInteraction = false;

//       await page.exposeFunction(
//         "onInteraction",
//         (
//           payload:
//             | {
//                 kind: "interaction-end";
//                 dateNowTimestamp: number;
//                 interactionUUID: string;
//               }
//             | {
//                 kind: "interaction-start";
//                 dateNowTimestamp: number;
//                 interactionUUID: string;
//               }
//             | {
//                 kind: "fps-update";
//                 dateNowTimestamp: number;
//               },
//           at: number
//         ) => {
//           switch (payload.kind) {
//             case "fps-update": {
//               metadata.push({
//                 kind: payload.kind,
//                 dateNowTimestamp: payload.dateNowTimestamp,
//                 atInOriginalVideo: at,
//               });
//               return;
//             }
//             case "interaction-start": {
//               console.log("INTERACTION START RECV");

//               unscreenshottedInteraction = true;
//               metadata.push({
//                 ...payload,
//                 atInOriginalVideo: at,
//               });
//               return;
//             }
//             // yes this is really fucking retarded and we don't mutate it
//             case "interaction-end": {
//               metadata.push({
//                 ...payload,
//                 atInOriginalVideo: at,
//               });
//               return;
//             }
//           }
//         }
//       );
//       console.log("after");

//       // const minTime = durationMs

//       const frameInterval = Math.max(1000 / fps / 2, 1);
//       let frameCount = 0;

//       // Create a white debug frame buffer
//       const { createCanvas } = require("canvas");
//       const canvas = createCanvas(viewportWidth, viewportHeight);
//       const ctx = canvas.getContext("2d");
//       ctx.fillStyle = "white";
//       ctx.fillRect(0, 0, viewportWidth, viewportHeight);
//       const whiteFrameBuffer = canvas.toBuffer("image/png");

//       while (!isFinished) {
//         if (playerStart.current) {
//           const videoTimeMs = (frameCount * 1000) / fps;

//           try {
//             const buffer = await page.screenshot({
//               encoding: "binary",
//               fullPage: false,
//               optimizeForSpeed: true,
//             });
//             console.log(
//               `Number of frames in buffer: ${buffer.length / (viewportWidth * viewportHeight * 4)}, current frame count: ${frameCount}`
//             );
//             lastFrame = buffer;
//             captureProcess.stdin?.write(buffer);
//             frameCount++;
//             if (unscreenshottedInteraction) {
//               const exactVideoMs = frameCount * (1000 / fps);
//               console.log(
//                 `Current frame count: ${frameCount}, which means this white frame will appear at ${exactVideoMs}ms`
//               );

//               // i am so fucking stupid
//               // i need to generally change this so the variable is a list and we collect all of them
//               const lastMetadataEntry = metadata
//                 .filter((m) => m.kind === "interaction-start")
//                 .at(-1);
//               if (lastMetadataEntry) {
//                 lastMetadataEntry.atInOriginalVideo = videoTimeMs; // i just changed this, lets see if it breaks anything
//               }

//               // for (let i = 0; i < 1; i++) {
//               //   captureProcess.stdin?.write(whiteFrameBuffer);
//               //   frameCount++;
//               // }

//               unscreenshottedInteraction = false;
//             }
//             console.log(`Frame ${frameCount} at video time ${videoTimeMs}ms`);
//           } catch (e) {
//             console.error("pupateer error");
//             break;
//           }
//         } else {
//           console.log("player never started");
//         }

//         await new Promise((resolve) => setTimeout(resolve, frameInterval));
//       }

//       const mp4Time = frameCount * (1000 / fps);
//       const inactivityAfterLastInteractionTime =
//         trueEndAtDateTime - startTime - mp4Time;
//       const duplicatesOfLastFrameNeeded = Math.ceil(
//         inactivityAfterLastInteractionTime / (1000 / 15)
//       );
//       console.log(
//         "inputs",
//         trueEndAtDateTime,
//         startTime,
//         mp4Time,
//         inactivityAfterLastInteractionTime,
//         duplicatesOfLastFrameNeeded
//       );
//       if (!lastFrame) {
//         throw new Error(
//           "Dev invariant, also change me to be an actual dev invariant"
//         );
//       }
//       console.log("prearing to write", duplicatesOfLastFrameNeeded, "frames");

//       Array.from({ length: duplicatesOfLastFrameNeeded }).forEach(() => {
//         captureProcess.stdin?.write(lastFrame);
//       });
//       console.log("done screenshoting!");

//       // something after this and before when the server responds breaks this for some reason it just hangs, done screenshot is the last thing to show
//       // todo: determine what this is
//       captureProcess.stdin?.end();
//       console.log("after ending stdin");

//       const captureCode = await new Promise<number>((resolve, reject) => {
//         // Listen for both close and exit events
//         captureProcess.on("close", resolve);
//         captureProcess.on("exit", resolve);

//         // Ensure stderr is fully drained
//         if (captureProcess.stderr) {
//           captureProcess.stderr.resume();
//         }

//         // Set a timeout just in case it hangs
//         const timeout = setTimeout(() => {
//           captureProcess.kill();
//           reject(new Error("FFmpeg process timed out after 30 seconds"));
//         }, 30000);

//         // Clean up timeout on success
//         captureProcess.once("close", () => clearTimeout(timeout));
//         captureProcess.once("exit", () => clearTimeout(timeout));
//       });
//       console.log("after capturing process");

//       if (captureCode !== 0) {
//         throw new Error(
//           `FFmpeg capture failed with code ${captureCode}: ${captureError}`
//         );
//       }

//       await new Promise((resolve) => setTimeout(resolve, 1000));
//       console.log("after timeout");

//       try {
//         const stats = await fs.promises.stat(output);
//         if (stats.size === 0) {
//           throw new Error("Generated video file is empty");
//         }
//       } catch (error: any) {
//         throw new Error(
//           `Failed to verify video file: ${error?.message || "Unknown error"}`
//         );
//       }

//       console.log("after stat");

//       return {
//         output,
//         metadata,
//       };
//     }, fullConfig)
//       .then((output) => {
//         fullConfig.cb(output, null);
//       })
//       .catch((error) => {
//         // fixme
//         fullConfig.cb(null!, error);
//       });
//   });
// }

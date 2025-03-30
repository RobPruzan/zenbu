import puppeteer, { Browser, Page } from "puppeteer";
import { EventType, eventWithTime } from "@rrweb/types";
import * as fs from "fs";
import * as path from "path";
import BrowserCluster from "./browser-cluster";

const rrwebScriptPath = path.resolve(
  require.resolve("rrweb-player"),
  "../../dist/index.js",
);
const rrwebStylePath = path.resolve(rrwebScriptPath, "../style.css");
const rrwebRaw = fs.readFileSync(rrwebScriptPath, "utf-8");
const rrwebStyle = fs.readFileSync(rrwebStylePath, "utf-8");
const reactScanRaw = fs.readFileSync(
  "/Users/robby/dashboard-demo/packages/s3/node_modules/react-scan/dist/index.global.js",
  "utf-8",
);
const rrwebCoreRaw = fs.readFileSync(
  "/Users/robby/dashboard-demo/node_modules/.pnpm/rrweb@2.0.0-alpha.4/node_modules/rrweb/dist/rrweb.min.js",
  "utf-8",
);
type ReplayAggregatedRender = {
  name: string;
  frame: number | null;
  computedKey: string | null;
  aggregatedCount: number;
};

export type ReactScanMetaPayload =
  | {
      kind: "interaction-end";
      dateNowTimestamp: number;
      interactionUUID: string;
      atInOriginalVideo: number;
      memoryUsage: null | number
    }
  | {
      kind: "interaction-start";
      dateNowTimestamp: number;
      interactionUUID: string;
      atInOriginalVideo: number;
    }
  | {
      kind: "fps-update";
      dateNowTimestamp: number;
      atInOriginalVideo: number;
    };

export type ReactScanPayload = Array<{
  rrwebDomId: number;
  renderCount: number;
  fiberId: number;
  componentName: string;

  groupedAggregatedRender?: Map<number, ReplayAggregatedRender>;

  /* Rects for interpolation */
  current?: DOMRect;
  target?: DOMRect;
  /* This value is computed before the full rendered text is shown, so its only considered an estimate */
  estimatedTextWidth?: number; // todo: estimated is stupid just make it the actual

  alpha?: number | null;
  totalFrames?: number | null;
}>;

export function getElementScreenshotHtml(
  events: Array<eventWithTime>,
  eventsNearInteraction: Array<ReactScanPayload>,
  startTime?: number,
  domNodeToSnapshotID?: number,
  skipBefore?: number,
): string {
  console.log("Generating screenshot HTML template");
  const templatePath = path.resolve(__dirname, "screenshot-template.html");
  let template = fs.readFileSync(templatePath, "utf-8");

  template = template.replace(/\$RRWEB_STYLE/g, rrwebStyle);
  template = template.replace(/\$REACT_SCAN_RAW/g, reactScanRaw);
  template = template.replace(/\$RRWEB_RAW/g, rrwebRaw);
  template = template.replace(/\$RRWEB_CORE_RAW/g, rrwebCoreRaw);
  template = template.replace(/\$RRWEB_EVENTS_NEAR_INTERACTION/g, JSON.stringify(eventsNearInteraction))
  template = template.replace(
    /\$EVENTS/g,
    JSON.stringify(events).replace(/<\/script>/g, "<\\/script>"),
  );
  template = template.replace(
    /\$START_TIME/g,
    startTime?.toString() || "undefined",
  );
  template = template.replace(
    /\$DOM_NODE_ID/g,
    domNodeToSnapshotID?.toString() || "undefined",
  );
  template = template.replace(
    /\$SKIP_BEFORE/g,
    skipBefore?.toString() || "undefined",
  );

  return template;
}

interface ScreenshotConfig {
  events: Array<eventWithTime>;
  output: string;
  startTime?: number; // Milliseconds from start of replay
  domNodeToSnapshotID?: number;
  width?: number;
  height?: number;
  // scanPayload?: ReactScanPayload;
  skipBefore?: number;
}
// tooptimize: accept an array of skips and take a screenshot at each time

// export async function takeScreenshot({
//   events,
//   output,
//   startTime,
//   domNodeToSnapshotID,
//   width,
//   height,
//   skipBefore,
// }: ScreenshotConfig) {
//   try {
//     console.log("[Screenshot] Starting screenshot process");
//     console.log("[Screenshot] Config:", {
//       startTime,
//       domNodeToSnapshotID,
//       width,
//       height,
//     });

//     const metaEvent = events[0];
//     const viewportWidth = width || (metaEvent as any)?.data?.width;
//     const viewportHeight = height || (metaEvent as any)?.data?.height;

//     if (!viewportWidth || !viewportHeight) {
//       throw new Error("Could not determine viewport dimensions");
//     }
//     console.log("[Screenshot] Using viewport:", {
//       viewportWidth,
//       viewportHeight,
//     });

//     return await BrowserCluster.execute(async ({ page }) => {
//       page.on("console", (msg) => console.log("[Browser Console]", msg.text()));
//       page.on("error", (err) => console.error("[Browser Error]", err));
//       page.on("pageerror", (err) => console.error("[Browser Page Error]", err));

//       await page.setViewport({
//         width: viewportWidth,
//         height: viewportHeight,
//       });

//       console.log("[Screenshot] Setting up ready callback");
//       const replayReady = new Promise<void>((resolve) => {
//         page.exposeFunction("onReplayReady", () => {
//           console.log("[Screenshot] Replay ready callback triggered");
//           resolve();
//         });
//       });

//       console.log("[Screenshot] Setting up DOM stats callback");
//       const nonVisibleDomElements = new Promise<{
//         nonVisibleCount: number;
//         totalCount: number;
//       }>((resolve) => {
//         page.exposeFunction(
//           "onNonVisibleDomElements",
//           (stats: { nonVisibleCount: number; totalCount: number }) => {
//             console.log("[Screenshot] DOM stats received:", stats);
//             resolve(stats);
//           },
//         );
//       });

//       console.log("[Screenshot] Navigating to blank page");
//       await page.goto("about:blank");
//       console.log("[Screenshot] Setting page content");
//       await page.setContent(
//         getElementScreenshotHtml(
//           events,
//           startTime,
//           domNodeToSnapshotID,
//           skipBefore,
//         ),
//       );

//       console.log("[Screenshot] Waiting for replay ready signal");
//       const [_, domStats] = await Promise.all([
//         replayReady,
//         nonVisibleDomElements,
//       ]);
//       console.log("[Screenshot] All callbacks completed");

//       let clipRect = null;
//       if (domNodeToSnapshotID) {
//         console.log(
//           "[Screenshot] Getting bounds for node:",
//           domNodeToSnapshotID,
//         );
//         clipRect = await page.evaluate(() => (window as any).nodeBounds);
//         if (!clipRect) {
//           return null;
//         }
//         console.log("[Screenshot] Got node bounds:", clipRect);
//       }

//       console.log("[Screenshot] Taking screenshot");
//       await page.screenshot({
//         path: output,
//         clip: clipRect || undefined,
//         fullPage: !clipRect,
//         encoding: "binary",
//       });
//       console.log("[Screenshot] Screenshot saved to:", output);

//       return { output, domStats };
//     }, {});
//   } catch (error) {
//     console.error("[Screenshot] Error:", error);
//     throw error;
//   }
// }

// export async function takeScreenshot({
//   events,
//   output,
//   startTime,
//   domNodeToSnapshotID,
//   width,
//   height,
//   skipBefore,
// }: ScreenshotConfig) {
//   try {
//   } catch (error) {
//     console.error("[Screenshot] Error:", error);
//     throw error;
//   }
// }

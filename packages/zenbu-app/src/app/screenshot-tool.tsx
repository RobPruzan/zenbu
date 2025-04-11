import { nanoid } from "nanoid";
import { act, useEffect, useRef, useState } from "react";
import { set } from "zod";
import { useChatStore } from "~/components/chat-instance-context";
import { useMakeRequest } from "~/components/devtools-overlay";
import { iife, cn } from "~/lib/utils";
import { captureViewport } from "./better-drawing";
import { IFRAME_ID } from "./iframe-wrapper";
import { Button } from "~/components/ui/button";
import { Camera, X, ImagePlus, Eye, MessageSquare, Check } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Separator } from "~/components/ui/separator";
// import { inputTest } from "./input";

const pivotMap = {
  "left-above": "bottom-right",
  "left-below": "top-right",
  "right-above": "bottom-left",
  "right-below": "top-left",
} as const;

type Pivot = { x: number; y: number };

const getPosRelativeToPivot = ({
  current,
  pivot,
}: {
  pivot: Pivot;
  current: {
    x: number;
    y: number;
  };
}) => {
  // left case
  if (current.x < pivot.x) {
    // below case
    if (current.y > pivot.y) {
      return "left-below" as const;
    }
    // above case
    else {
      return "left-above" as const;
    }
  }
  // right case
  else {
    // below case
    if (current.y > pivot.y) {
      return "right-below" as const;
    }
    // above case
    else {
      return "right-above" as const;
    }
  }
};

/**
 *
 * todos that we still want:
 * - multi screenshot
 * - crop after selecting
 * - drawing/markup screenshot
 */

/**
 *
 * assumes it will be placed under a relative container
 */

type MinimalDOMRect = {
  bottom: number;
  top: number;
  left: number;
  right: number;
};
export const ScreenshotTool = () => {
  const [isDragging, setIsDragging] = useState(false);
  const { active } = useChatStore(
    (state) => state.toolbar.state.screenshotting,
  );
  const actions = useChatStore((state) => state.toolbar.actions);
  const getEditor = useChatStore(
    (state) => state.toolbar.state.drawing.getEditor,
  );
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [screenshotElBoundingRect, setScreenshotElBoundingRect] =
    useState<MinimalDOMRect>();

  const screenshotElRef = useRef<HTMLDivElement | null>(null);

  const [pivot, setPivot] = useState<null | Pivot>(null);

  const [isGloballyMouseDown, setIsGloballyMouseDown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const containerRefLazy = () => containerRef.current!;

  useEffect(() => {
    if (!active) {
      return;
    }

    const handleMouseDown = () => {
      setIsGloballyMouseDown(true);
    };
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [active]);

  const makeRequest = useMakeRequest();
  useEffect(() => {
    if (!active) {
      return;
    }
    const handleMouseUp = () => {
      setIsDragging(false);

      setIsGloballyMouseDown(false);
    };
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [active]);

  const cancelScreenshot = () => {
    setIsDragging(false);
    setIsGloballyMouseDown(false);
    setPivot(null);
    setScreenshotElBoundingRect(undefined);
  };
  useEffect(() => {
    if (!active) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelScreenshot();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, actions]);

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  if (!active) {
    return;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => {
        if (!isDragging) {
          return;
        }
        if (!pivot) {
          return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const current = {
          y: e.clientY - rect.top,
          x: e.clientX - rect.left,
        };

        if (current.x < 0 || current.y < 0) {
          return;
        }

        const pos = getPosRelativeToPivot({
          current,
          pivot,
        });

        const currentPivot = pivotMap[pos];
        // console.log("curr pivot", currentPivot);

        // perhaps i can just set the top/left/right/bottom properties to update the square?

        // omg right is relative to the right of the fucking screen and im doing relative to the fucking left ldfskjl;adksjfds;alkjf;jlksad
        switch (currentPivot) {
          case "bottom-left": {
            // at this point we always want to set the corresponding to the pivot coordinate
            // and the converse the current, that sounds right
            // just manipulating the top/bottom/left/right

            setScreenshotElBoundingRect({
              bottom: rect.height - pivot.y,
              left: pivot.x,
              top: current.y,
              right: rect.width - current.x,
            });

            return;
          }

          case "top-left": {
            setScreenshotElBoundingRect({
              bottom: rect.height - current.y,
              left: pivot.x,
              right: rect.width - current.x,
              top: pivot.y,
            });
            return;
          }
          case "top-right": {
            setScreenshotElBoundingRect({
              bottom: rect.height - current.y,
              left: current.x,
              top: pivot.y,
              right: rect.width - pivot.x,
            });
            return;
          }
          // dis kinda works
          case "bottom-right": {
            setScreenshotElBoundingRect({
              bottom: rect.height - pivot.y,
              left: current.x,
              top: current.y,
              right: rect.width - pivot.x,
            });
            return;
          }
        }

        /**
         * determining pivot:
         *
         * there is a distinct mapping, making map will make this quite easier
         *
         */

        // now we need to set pivot and get the correct relative cords
      }}
      // onMouseOut={() => {
      // }}
      onMouseEnter={() => {
        if (!isGloballyMouseDown) {
          setIsDragging(false);
        }
      }}
      onMouseDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pivot = {
          y: e.clientY - rect.top,
          x: e.clientX - rect.left,
        };

        setPivot(pivot);
        setIsDragging(true);
      }}
      onMouseUp={async (e) => {
        try {
          if (!screenshotElBoundingRect) {
            return;
          }

          const rect = e.currentTarget.getBoundingClientRect();
          const current = {
            y: e.clientY - rect.top,
            x: e.clientX - rect.left,
          };
          setScreenshotElBoundingRect(undefined);
          setIsDragging(false);
          setPivot(null);

          const boundingRect = containerRefLazy().getBoundingClientRect();
          const coordinates = {
            tl: {
              x: screenshotElBoundingRect.left,
              y: screenshotElBoundingRect.top,
            },
            br: {
              x: boundingRect.width - screenshotElBoundingRect.right,
              y: boundingRect.height - screenshotElBoundingRect.bottom,
            },
          };

          const id = nanoid();
          // console.log("looking for", id);

          const response = await makeRequest({
            kind: "take-screenshot",
            id,
            responsePossible: true,
          });
          if (response.kind !== "screenshot-response") {
            throw new Error("invariant");
          }
          const editor = getEditor();
          const shapesURI = editor
            ? await captureViewport(editor)
            : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

          const iframe = document.getElementById(
            IFRAME_ID,
          ) as HTMLIFrameElement;

          const { height, width } = iframe.getBoundingClientRect();

          // scaleAndCopyImage(response.dataUrl as string,)
          const input: Parameters<typeof overlayImages>[0] = {
            baseImageDataUrl: response.dataUrl,
            cropCoordinates: coordinates,
            overlayImageDataUrl: shapesURI as string,
            height,
            width,
          };

          console.log("da input", input);

          const newImg = await overlayImages(input).catch(() => null);

          if (!newImg) {
            console.log("theres nuttin to copy");

            return;
          }
          try {
            const response = await fetch(newImg.cropped);
            const blob = await response.blob();
            // this errors on safari without permissions it appears?
            console.log("blobby boy", blob);

            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob,
              }),
            ]);
          } catch (error) {
            console.error("Failed to copy image to clipboard:", error);
            await navigator.clipboard.writeText(newImg.cropped);
          }

          setShowSuccessMessage(true);

          console.log("we got dat screenshot", newImg);
          console.log("and the input", input);
        } catch (e) {
          console.log("what the shit", e);
        }
      }}
      style={{
        zIndex: 1000000,
      }}
      className="absolute h-full w-full top-0 left-0"
    >
      {isDragging && (
        <div
          className="absolute border-2 border-primary/80"
          style={screenshotElBoundingRect}
          ref={screenshotElRef}
        ></div>
      )}

      <div
        style={{
          zIndex: 1000001,
        }}
        className="absolute top-2 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/95 p-2 shadow-lg backdrop-blur">
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8"
                onClick={() => {
                  // Fullscreen screenshot logic
                }}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent side="bottom" align="center" className="w-auto">
              <p className="text-xs">Capture Fullscreen</p>
            </HoverCardContent>
          </HoverCard>

          <Separator orientation="vertical" className="h-4" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              actions.setIsScreenshotting(false);
            }}
          >
            Cancel
          </Button>

          {showSuccessMessage && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span>Copied to clipboard</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-xs">Add to Chat</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          zIndex: 100000,
          clipPath: screenshotElBoundingRect
            ? `polygon(
              0% 0%, 
              100% 0%, 
              100% 100%, 
              0% 100%, 
              0% 0%, 
              ${screenshotElBoundingRect.left}px ${screenshotElBoundingRect.top}px, 
              ${screenshotElBoundingRect.left}px calc(100% - ${screenshotElBoundingRect.bottom}px), 
              calc(100% - ${screenshotElBoundingRect.right}px) calc(100% - ${screenshotElBoundingRect.bottom}px), 
              calc(100% - ${screenshotElBoundingRect.right}px) ${screenshotElBoundingRect.top}px, 
              ${screenshotElBoundingRect.left}px ${screenshotElBoundingRect.top}px
            )`
            : "none",
        }}
        className="absolute h-full w-full bg-black/40"
      />
    </div>
  );
};

const SuccessfulScreenshot = ({ onDismiss }: { onDismiss: () => void }) => {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/40 bg-background/95 p-2 shadow-lg backdrop-blur">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Screenshot captured!</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="text-xs">Add to Chat</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="text-xs">View</span>
        </Button>
      </div>
    </div>
  );
};

interface Point {
  x: number;
  y: number;
}

interface CropCoordinates {
  tl: Point;
  br: Point;
}

interface OverlayImagesParams {
  baseImageDataUrl: string;
  overlayImageDataUrl: string;
  cropCoordinates: CropCoordinates;
}

interface OverlayResult {
  cropped: string;
  uncropped: string;
}

const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (
      event: Event | string,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error,
    ) => {
      const errorMessage =
        error?.message ||
        (typeof event === "string" ? event : "Unknown image load error");
      reject(new Error(`Failed to load image: ${errorMessage}`));
    };
    img.src = dataUrl;
  });
};

/**
 *
 * takes in the width/height of the iframe to determine the target resolution of the
 * viewport (the bounds we pass when taking a screenshot to tldraw are in canvas coordinates)
 * it may be the case it always correctly returns the correct resolution (since its directly overlaid with iframe)
 * but this is a precaution
 *
 * we pass the base image data url, and then crop over the iframe dimensions since the screenshot we capture
 * includes the entire page, not just the viewport, so we need to crop over the iframes viewport (height/width)
 *
 * we then overlay the tldraw shapes over the html snapshot image to get the  composited image
 *
 * last we crop over the region the user was screenshotting when using the screenshot tool
 */

/**
 * FIXME
 * 
 * THE CROP SHOULD TAKE IN THE SCROLL POSITION OTHERWISE IT WILL BE WRONG
 * 
 * WE ASSUME WINDOW.SCROLLTOP IS ALWAYS == 0 BY CROPPING HOW WE DO 
 * 
 */
export const overlayImages = async ({
  baseImageDataUrl,
  overlayImageDataUrl,
  cropCoordinates,
  width,
  height,
}: OverlayImagesParams & {
  width?: number;
  height?: number;
}): Promise<OverlayResult> => {
  try {
    const [baseImage, overlayImage] = await Promise.all([
      loadImage(baseImageDataUrl),
      loadImage(overlayImageDataUrl),
    ]);

    const compositeCanvas: HTMLCanvasElement = document.createElement("canvas");
    const compositeCtx: CanvasRenderingContext2D | null =
      compositeCanvas.getContext("2d");

    if (!compositeCtx) {
      throw new Error("Could not get 2D context for the composite canvas.");
    }

    const canvasWidth: number = width || baseImage.naturalWidth;
    const canvasHeight: number = height || baseImage.naturalHeight;
    compositeCanvas.width = canvasWidth;
    compositeCanvas.height = canvasHeight;

    compositeCtx.drawImage(
      baseImage,
      0,
      0,
      canvasWidth,
      canvasHeight,
      0,
      0,
      canvasWidth,
      canvasHeight,
    );

    compositeCtx.drawImage(overlayImage, 0, 0, canvasWidth, canvasHeight);

    const uncroppedDataUrl: string = compositeCanvas.toDataURL("image/png");

    const cropX: number = cropCoordinates.tl.x;
    const cropY: number = cropCoordinates.tl.y;
    const cropWidth: number = cropCoordinates.br.x - cropX;
    const cropHeight: number = cropCoordinates.br.y - cropY;

    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new Error(
        "Invalid crop dimensions: width and height must be positive.",
      );
    }
    if (
      cropX < 0 ||
      cropY < 0 ||
      cropCoordinates.br.x > canvasWidth ||
      cropCoordinates.br.y > canvasHeight
    ) {
      console.warn(
        "Crop coordinates are partially or fully outside the composite image bounds.",
      );
    }

    const croppedCanvas: HTMLCanvasElement = document.createElement("canvas");
    const croppedCtx: CanvasRenderingContext2D | null =
      croppedCanvas.getContext("2d");

    if (!croppedCtx) {
      throw new Error("Could not get 2D context for the cropped canvas.");
    }

    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    croppedCtx.drawImage(
      compositeCanvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    const croppedDataUrl: string = croppedCanvas.toDataURL("image/png");

    return {
      cropped: croppedDataUrl,
      uncropped: uncroppedDataUrl,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error during image overlay and crop:", error.message);
      throw error;
    } else {
      console.error(
        "An unexpected error occurred during image overlay and crop:",
        error,
      );
      throw new Error(
        "An unexpected error occurred during image overlay and crop.",
      );
    }
  }
};

// for debugging
export const scaleAndCopyImage = async (
  imageDataUrl: string,
  targetWidth?: number,
  targetHeight?: number,
): Promise<void> => {
  if (!imageDataUrl.startsWith("data:image/png;base64,")) {
    console.error("Invalid input: imageDataUrl must be a base64 PNG data URI.");
    return;
  }

  if (targetWidth !== undefined && targetHeight !== undefined) {
    if (targetWidth <= 0 || targetHeight <= 0) {
      console.error(
        "Invalid dimensions: targetWidth and targetHeight must be positive.",
      );
      return;
    }
  }

  try {
    const originalImage = await loadImage(imageDataUrl);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get 2D context for the canvas.");
    }

    canvas.width = targetWidth ?? originalImage.naturalWidth;
    canvas.height = targetHeight ?? originalImage.naturalHeight;

    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    const scaledImageDataUrl = canvas.toDataURL("image/png");

    const response = await fetch(scaledImageDataUrl);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);

    console.log("Scaled image copied to clipboard successfully!");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to scale and copy image:", message);
  }
};

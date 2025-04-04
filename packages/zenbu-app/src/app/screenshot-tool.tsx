import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { set } from "zod";
import { useMakeRequest } from "~/components/devtools-overlay";
import { iife } from "~/lib/utils";
import { inputTest } from "./input";

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
export const ScreenshotTool = () => {
  const [isDragging, setIsDragging] = useState(false);

  const screenshotElRef = useRef<HTMLDivElement | null>(null);

  const screenshotElRefLazy = () => screenshotElRef.current!;

  const [pivot, setPivot] = useState<null | Pivot>(null);

  const [isGloballyMouseDown, setIsGloballyMouseDown] = useState(false);

  const [screenshotElBoundingRect, setScreenshotElBoundingRect] = useState<{
    bottom: number;
    top: number;
    left: number;
    right: number;
  }>();

  useEffect(() => {
    const handleMouseDown = () => {
      setIsGloballyMouseDown(true);
    };
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  const makeRequest = useMakeRequest();
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsGloballyMouseDown(false);
    };
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRefLazy = () => containerRef.current!;

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
        console.log("curr pivot", currentPivot);

        // perhaps i can just set the top/left/right/bottom properties to update the square?

        // omg right is relative to the right of the fucking screen and im doing relative to the fucking left ldfskjl;adksjfds;alkjf;jlksad
        switch (currentPivot) {
          case "bottom-left": {
            // at this point we always want to set the corresponding to the pivot coordinate
            // and the converse the current, that sounds right
            // just manipulating the top/bottom/left/right

            setScreenshotElBoundingRect({
              bottom: e.currentTarget.getBoundingClientRect().height - pivot.y,
              left: pivot.x,
              top: current.y,
              right: e.currentTarget.getBoundingClientRect().width - current.x,
            });

            return;
          }

          case "top-left": {
            setScreenshotElBoundingRect({
              bottom:
                e.currentTarget.getBoundingClientRect().height - current.y,
              left: pivot.x,
              right: e.currentTarget.getBoundingClientRect().width - current.x,
              top: pivot.y,
            });
            return;
          }
          case "top-right": {
            setScreenshotElBoundingRect({
              bottom:
                e.currentTarget.getBoundingClientRect().height - current.y,
              left: current.x,
              top: pivot.y,
              right: e.currentTarget.getBoundingClientRect().width - pivot.x,
            });
            return;
          }
          // dis kinda works
          case "bottom-right": {
            setScreenshotElBoundingRect({
              bottom: e.currentTarget.getBoundingClientRect().height - pivot.y,
              left: current.x,
              top: current.y,
              right: e.currentTarget.getBoundingClientRect().width - pivot.x,
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
      onMouseUp={async () => {
        if (!screenshotElBoundingRect) {
          return;
        }
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

        // oh schmeat we need to overlay the drawing when do this :O
        const response = await makeRequest({
          kind: "take-screenshot",
          id: nanoid(),
          responsePossible: true,
        });
        if (response.kind !== "screenshot-response") {
          throw new Error("invariant");
        }
        const shapesURI: string = await (window as any)?.cv();

        console.log("oy oy");
        const input = {
          baseImageDataUrl: response.dataUrl,
          cropCoordinates: coordinates,
          overlayImageDataUrl: shapesURI,
        };

        const newImg = await overlayImages(input).catch(() => null);

        // console.log("params", {
        //   baseImageDataUrl: response.dataUrl,
        //   cropCoordinates: coordinates,
        //   overlayImageDataUrl: shapesURI,
        // });

        console.log("we got dat screenshot", newImg);
        console.log("and the input", input);
      }}
      style={{
        zIndex: 1000000,
      }}
      className="absolute h-full w-full top-0 left-0"
    >
      {isDragging && (
        <div
          className="border absolute "
          style={screenshotElBoundingRect}
          ref={screenshotElRef}
        ></div>
      )}
    </div>
  );
};
// okay not doing this just gonna have a test imgs

// todo verify (maybe tests?)

// Define interfaces for better type safety and clarity
interface Point {
  x: number;
  y: number;
}

interface CropCoordinates {
  tl: Point; // Top-left corner
  br: Point; // Bottom-right corner
}

interface OverlayImagesParams {
  baseImageDataUrl: string;
  overlayImageDataUrl: string;
  cropCoordinates: CropCoordinates;
}

// Interface for the return value, containing both image versions
interface OverlayResult {
  cropped: string; // Data URL of the final cropped image
  uncropped: string; // Data URL of the composite (overlay) image before cropping
}

// Define interfaces for better type safety and clarity
interface Point {
  x: number;
  y: number;
}

interface CropCoordinates {
  tl: Point; // Top-left corner
  br: Point; // Bottom-right corner
}
// Interfaces (Point, CropCoordinates, OverlayImagesParams, OverlayResult) remain the same as before
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


// loadImage function remains the same as before
const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (
      event: Event | string,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
        const errorMessage = error?.message || (typeof event === 'string' ? event : 'Unknown image load error');
        reject(new Error(`Failed to load image: ${errorMessage}`));
    };
    // img.crossOrigin = 'anonymous';
    img.src = dataUrl;
  });
};


export const overlayImages = async ({
  baseImageDataUrl,
  overlayImageDataUrl,
  cropCoordinates,
}: OverlayImagesParams): Promise<OverlayResult> => {
  try {
    // 1. Load both images
    const [baseImage, overlayImage] = await Promise.all([
      loadImage(baseImageDataUrl),
      loadImage(overlayImageDataUrl),
    ]);

    // 2. Create a canvas for compositing
    const compositeCanvas: HTMLCanvasElement = document.createElement('canvas');
    const compositeCtx: CanvasRenderingContext2D | null = compositeCanvas.getContext('2d');

    if (!compositeCtx) {
        throw new Error('Could not get 2D context for the composite canvas.');
    }

    // Set canvas dimensions based on the BASE image
    const canvasWidth: number = baseImage.naturalWidth;
    const canvasHeight: number = baseImage.naturalHeight;
    compositeCanvas.width = canvasWidth;
    compositeCanvas.height = canvasHeight;

    // 3. Draw the base image (filling the canvas)
    compositeCtx.drawImage(baseImage, 0, 0, canvasWidth, canvasHeight);

    // 4. Draw the overlay image on top, SCALED to fit the canvas dimensions
    //    This handles the different resolutions, assuming the same aspect ratio.
    compositeCtx.drawImage(
        overlayImage,
        0,             // Destination X position on canvas
        0,             // Destination Y position on canvas
        canvasWidth,   // Destination width (scale to fit canvas width)
        canvasHeight   // Destination height (scale to fit canvas height)
    );
    // --- End Fix ---

    // --- Get the uncropped (composite) image data URL ---
    const uncroppedDataUrl: string = compositeCanvas.toDataURL('image/png');
    // ---

    // 5. Prepare for cropping
    const cropX: number = cropCoordinates.tl.x;
    const cropY: number = cropCoordinates.tl.y;
    const cropWidth: number = cropCoordinates.br.x - cropX;
    const cropHeight: number = cropCoordinates.br.y - cropY;

     if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error('Invalid crop dimensions: width and height must be positive.');
    }
     if (cropX < 0 || cropY < 0 || cropCoordinates.br.x > canvasWidth || cropCoordinates.br.y > canvasHeight) {
        console.warn('Crop coordinates are partially or fully outside the composite image bounds.');
    }


    // 6. Create a new canvas for the final cropped result
    const croppedCanvas: HTMLCanvasElement = document.createElement('canvas');
    const croppedCtx: CanvasRenderingContext2D | null = croppedCanvas.getContext('2d');

     if (!croppedCtx) {
        throw new Error('Could not get 2D context for the cropped canvas.');
    }

    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    // 7. Draw the cropped portion from the composite canvas onto the cropped canvas
    croppedCtx.drawImage(
      compositeCanvas, // Source
      cropX, cropY, cropWidth, cropHeight, // Source Rect
      0, 0, cropWidth, cropHeight           // Destination Rect
    );

    // 8. Convert the cropped canvas to a data URL
    const croppedDataUrl: string = croppedCanvas.toDataURL('image/png');

    // 9. Return both data URLs
    return {
        cropped: croppedDataUrl,
        uncropped: uncroppedDataUrl,
    };

  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error("Error during image overlay and crop:", error.message);
        throw error;
    } else {
        console.error("An unexpected error occurred during image overlay and crop:", error);
        throw new Error('An unexpected error occurred during image overlay and crop.');
    }
  }
};

// --- Example Usage (TypeScript) ---
/*
const exampleBase: string = 'data:image/jpeg;base64,...'; // Your base64 JPEG data
const exampleOverlay: string = 'data:image/png;base64,...'; // Your base64 PNG data

const cropArea: CropCoordinates = {
  tl: { x: 50, y: 50 },   // Top-left corner
  br: { x: 250, y: 200 } // Bottom-right corner
};

overlayImages({
  baseImageDataUrl: exampleBase,
  overlayImageDataUrl: exampleOverlay,
  cropCoordinates: cropArea,
})
.then((result: OverlayResult) => { // Expect the OverlayResult object
  console.log('Overlay and crop successful!');

  // Access the cropped version
  console.log('Cropped Image Data URL:', result.cropped.substring(0, 50) + '...'); // Log start
  const outputImageCropped = document.createElement('img');
  outputImageCropped.src = result.cropped;
  outputImageCropped.title = 'Cropped Result';
  document.body.appendChild(outputImageCropped);

  // Access the uncropped (composite) version
  console.log('Uncropped Image Data URL:', result.uncropped.substring(0, 50) + '...'); // Log start
  const outputImageUncropped = document.createElement('img');
  outputImageUncropped.src = result.uncropped;
  outputImageUncropped.title = 'Uncropped Composite Result';
  document.body.appendChild(outputImageUncropped);

})
.catch((error: Error) => {
  console.error('Failed to overlay and crop image:', error.message);
});
*/

window.testme = async () => {
  const result = await overlayImages(inputTest);
  console.log("result", result);
  console.log("the input", inputTest);
};

// --- Example Usage (TypeScript) ---
/*
const exampleBase: string = 'data:image/jpeg;base64,...'; // Your base64 JPEG data
const exampleOverlay: string = 'data:image/png;base64,...'; // Your base64 PNG data

const cropArea: CropCoordinates = {
  tl: { x: 50, y: 50 },   // Top-left corner
  br: { x: 250, y: 200 } // Bottom-right corner
};

overlayImages({
  baseImageDataUrl: exampleBase,
  overlayImageDataUrl: exampleOverlay,
  cropCoordinates: cropArea,
})
.then((resultDataUrl: string) => {
  console.log('Overlay and crop successful!');
  const outputImage = document.createElement('img');
  outputImage.src = resultDataUrl;
  document.body.appendChild(outputImage); // Ensure body exists
})
.catch((error: Error) => { // Catching Error type specifically
  console.error('Failed to overlay and crop image:', error.message);
});
*/

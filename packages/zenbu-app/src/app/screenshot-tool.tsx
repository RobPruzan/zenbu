import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { set } from "zod";
import { useMakeRequest } from "~/components/devtools-overlay";
import { iife } from "~/lib/utils";

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

  return (
    <div
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
        setScreenshotElBoundingRect(undefined);
        setIsDragging(false);
        setPivot(null);

        // oh schmeat we need to overlay the drawing when do this :O
        const dataUrl = await makeRequest({
          kind: "take-screenshot",
          id: nanoid(),
          responsePossible: true,
        });
        console.log("we got dat screenshot", dataUrl);
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

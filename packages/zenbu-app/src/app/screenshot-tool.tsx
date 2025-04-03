import { useEffect, useRef, useState } from "react";
import { set } from "zod";
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

  useEffect(() => {
    const handleMouseUp = () => {
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


        if (current.x < 0 || current.y < 0){return}

        const pos = getPosRelativeToPivot({
          current,
          pivot,
        });

        const currentPivot = pivotMap[pos];

        // perhaps i can just set the top/left/right/bottom properties to update the square?

        // omg right is relative to the right of the fucking screen and im doing relative to the fucking left ldfskjl;adksjfds;alkjf;jlksad
        switch (currentPivot) {
          case "bottom-left": {
            // at this point we always want to set the corresponding to the pivot coordinate
            // and the converse the current, that sounds right
            // just manipulating the top/bottom/left/right

            setScreenshotElBoundingRect({
              bottom:  e.currentTarget.getBoundingClientRect().height - pivot.y,
              left: pivot.x,
              top: current.y,
              right: e.currentTarget.getBoundingClientRect().width - current.x,
            });

            return;
          }
          
          case "top-left": {
            setScreenshotElBoundingRect({
              bottom:  e.currentTarget.getBoundingClientRect().height - current.y,
              left: pivot.x,
              right: e.currentTarget.getBoundingClientRect().width - current.x,
              top: pivot.y,
            });
            return;
          }
          case "top-right": {
            setScreenshotElBoundingRect({
              bottom:  e.currentTarget.getBoundingClientRect().height - current.y,
              left: current.x,
              top: pivot.y,
              right: e.currentTarget.getBoundingClientRect().width - pivot.x,
            });
            return;
          }
              // dis kinda works
          case "bottom-right": {
            setScreenshotElBoundingRect({
              bottom:  e.currentTarget.getBoundingClientRect().height - pivot.y,
              left: current.x,
              top: current.y,
              right:e.currentTarget.getBoundingClientRect().width- pivot.x,
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
      onMouseUp={() => {
        setScreenshotElBoundingRect(undefined)
        setIsDragging(false);
        setPivot(null)
      }}
      style={{
        zIndex: 1000000,
      }}
      className="absolute h-full w-full top-0 left-0"
    >
      {isDragging && (
        <div className="h-20 w-20 select-none bg-red-500">
          dragging {JSON.stringify(screenshotElBoundingRect)}
          pivot: {JSON.stringify(pivot)}
          {iife(() => {
            const current = {
              x: screenshotElBoundingRect?.left || 0,
              y: screenshotElBoundingRect?.top || 0
            };
            
            if (!pivot) {
              return null;
            }


        const pos = getPosRelativeToPivot({
          current,
          pivot,
        });

        const currentPivot = pivotMap[pos];
        return "----------------" + currentPivot
          })}
        </div>
      )}
      {isDragging && (
        <div
          className="border absolute "
          style={screenshotElBoundingRect}
          ref={screenshotElRef}
        ></div>
      )}

      {pivot && <div
        style={{
          top: pivot.y,
          left: pivot.x
      }}  
       className="rounded-full h-10 w-10 absolute bg-blue-500"></div>}
    </div>
  );
};

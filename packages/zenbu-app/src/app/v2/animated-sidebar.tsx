import React from "react";
import { unstable_ViewTransition as ViewTransition } from "react";
import { cn, css } from "src/lib/utils";

export const AnimatedSidebar = ({
  isOpen,
  className,
  children,
}: {
  isOpen: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <style>{css`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0%);
          }
        }

        @keyframes slide-out {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-100%);
          }
        }

        ::view-transition-group(.slide-in),
        ::view-transition-group(.slide-out) {
          animation: none;
          mix-blend-mode: normal;
          overflow: hidden;
        }

        ::view-transition-old(.slide-out) {
          animation: 150ms cubic-bezier(0.25, 0.1, 0.25, 1) both slide-out;
        }

        ::view-transition-new(.slide-in) {
          animation: 150ms cubic-bezier(0.25, 0.1, 0.25, 1) both slide-in;
        }
      `}</style>

      {isOpen && (
        <ViewTransition
          enter="slide-in" 
          exit="slide-out" 
        >
          <div
            className={cn([
              " h-full",
              className,
            ])}
          >
            {children}
          </div>
        </ViewTransition>
      )}
    </>
  );
};

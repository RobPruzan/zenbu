"use client";
import { useEffect, useRef } from "react";

import { Button } from "src/components/ui/button";
import { ExpandIcon, MessageSquareIcon, Minimize2Icon, SendIcon, SquarePen } from "lucide-react";
import { cn } from "src/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

export const WorkspaceChat = () => {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
    
      layout
      transition={{ duration: 0.45, bounce: 0.19, type: "spring" }}
      className={cn([open ? "w-[400px]" : "w-[90px] h-[100px]", "p-4 full"])}
    >
      {open ? (
        // <div className="border border-[#131313] rounded-lg h-full bg-background/50 flex flex-col justify-end bg-gradient-to-t from-[#070808] to-[#090909]">
         <div className="border border-[#131313] rounded-lg h-full bg-background/50 flex flex-col justify-end bg-gradient-to-t from-[#070808] to-[#090909]">
          <div className="mb-auto w-full flex items-center px-2 py-2 justify-between ">
            <Button variant={"ghost"} size={"icon"}>
              <SquarePen size={18} color="#686767" />
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant={"ghost"}
              size={"icon"}
            >
              <Minimize2Icon size={18} color="#686767" />
            </Button>
          </div>

          <MockChatTextArea />
        </div>
      ) : (
          <motion.div
            initial={{
          opacity: 0
            }}
            animate={{
              opacity: 1,
              
            }}
            transition={{
              duration: 1,
              ease: 'easeOut'
            }}
            className="w-full h-full flex items-center justify-center">
          <Button variant={"ghost"} onClick={() => setOpen(true)}>
            <MessageSquareIcon />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

const MockChatTextArea = () => (
  <div className="px-4 pb-4 relative w-full">
    <div className="rounded-lg bg-accent/5 border border-border/60 shadow-lg overflow-hidden w-full transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col text-xs">
        <div className="relative min-h-[50px] w-full bg-[rgba">
          <div className="w-full text-[13px] chat-input text-foreground caret-foreground font-light leading-relaxed min-h-[50px] pt-2.5 pl-3 pr-4 pb-2 focus:outline-none"></div>
        </div>

        <div className="flex items-center justify-end px-4 py-2 border-t border-border/60 bg-accent/5">
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "inline-flex items-center justify-center px-3.5 py-1.5 rounded-sm text-[11px] font-light",
                "bg-accent/10 border border-border/60 hover:bg-accent/20 text-foreground",
                "transition-all duration-300",
              )}
            >
              <span>Send</span>
              <SendIcon className="ml-1.5 h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const useElementMeasure = <T extends HTMLElement>(
  options: IntersectionObserverInit = {},
) => {
  const [measurements, setMeasurements] = useState({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    isIntersecting: false,
  });

  const elementRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const updateMeasurements = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry) {
        const { width, height, top, left, bottom, right, x, y } =
          entry.boundingClientRect;
        setMeasurements({
          width,
          height,
          top,
          left,
          bottom,
          right,
          x,
          y,
          isIntersecting: entry.isIntersecting,
        });
      }
    };

    observerRef.current = new IntersectionObserver(updateMeasurements, options);
    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [options]);

  return [elementRef, measurements] as const;
};

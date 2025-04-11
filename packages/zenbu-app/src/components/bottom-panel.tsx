"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function BottomPanel({ isOpen, onClose, children }: BottomPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bottom-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: "35%",
            opacity: 1,
            transition: {
              height: { type: "spring", stiffness: 500, damping: 25, mass: 0.5 },
              opacity: { duration: 0.1 },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: { duration: 0.2, ease: "easeInOut" },
              opacity: { duration: 0.1 },
            },
          }}
          className="absolute bottom-0 left-0 right-0 z-50 flex flex-col overflow-hidden border-t border-border/40 bg-background/80 backdrop-blur-sm"
        >
          <div className="flex h-9 items-center justify-between border-b border-border/40 px-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Terminal</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-background/80"
              onClick={onClose}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
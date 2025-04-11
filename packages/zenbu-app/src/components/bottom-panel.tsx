"use client";

import { X } from "lucide-react";
import { Button } from "./ui/button";

interface BottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function BottomPanel({ isOpen, onClose, children }: BottomPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-border/40 bg-background backdrop-blur-sm">
      {/* <div className="flex h-9 items-center justify-between border-b border-border/40 px-3"> */}
        {/* <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Terminal</span>
        </div> */}
        {/* <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-background/80"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button> */}
      {/* </div> */}
      <div className="flex-1 overflow-auto">
        {/* {children} */}
        <img className="w-full h-full object-cover" src="/lol.png"/>
      </div>
    </div>
  );
} 
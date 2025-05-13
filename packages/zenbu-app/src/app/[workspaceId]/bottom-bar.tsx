"use client";

import React from "react";
import { cn } from "src/lib/utils";
import {
  GitBranchIcon,
  CircleIcon,
  AlertCircleIcon,
  BugIcon,
  InfoIcon,
  CheckCircleIcon,
  BellIcon,
  XCircleIcon,
  FileWarningIcon,
} from "lucide-react";

interface BottomBarProps {
  className?: string;
  gitBranch?: string;
  lineCol?: { line: number; col: number };
  encoding?: string;
  fileType?: string;
  indentation?: { type: "Spaces" | "Tabs"; size: number };
  issues?: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export const BottomBar = ({
  className,
  gitBranch = "main",
  lineCol = { line: 1, col: 1 },
  encoding = "UTF-8", 
  fileType = "TypeScript JSX",
  indentation = { type: "Spaces", size: 2 },
  issues = { errors: 0, warnings: 0, infos: 0 },
}: BottomBarProps) => {
  return (
    <div
      className={cn(
        "h-[35px] flex items-center fixed bottom-0 left-0 text-muted-foreground text-xs",
        className,
      )}
    >
      <div className="flex items-center h-full">
        <div 
          className="flex items-center h-full rounded-r-md rounded-b-none bg-[#090909] border-y border-r border-border/40 px-2"
        >
          <div className="flex items-center px-2 gap-1 hover:bg-accent/30 hover:text-accent-foreground transition-colors cursor-default h-full">
            <GitBranchIcon className="h-3 w-3 opacity-70" />
            <span>{gitBranch}</span>
          </div>

          <div className="flex items-center px-2 gap-1.5 hover:bg-accent/30 hover:text-accent-foreground transition-colors cursor-default h-full">
            {issues.errors > 0 && (
              <div className="flex items-center gap-1">
                <XCircleIcon className="h-3 w-3 text-red-500/90" />
                <span>{issues.errors}</span>
              </div>
            )}
            {issues.warnings > 0 && (
              <div className="flex items-center gap-1">
                <FileWarningIcon className="h-3 w-3 text-amber-500/90" />
                <span>{issues.warnings}</span>
              </div>
            )}
            {issues.infos > 0 && (
              <div className="flex items-center gap-1">
                <InfoIcon className="h-3 w-3 text-blue-400/90" />
                <span>{issues.infos}</span>
              </div>
            )}
            {issues.errors === 0 &&
              issues.warnings === 0 &&
              issues.infos === 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircleIcon className="h-3 w-3 text-emerald-500/90" />
                  <span>0</span>
                </div>
              )}
          </div>

          <div className="flex items-center px-2 gap-1 hover:bg-accent/30 hover:text-accent-foreground transition-colors cursor-default h-full">
            <span className="tracking-tight">
              {lineCol.line}:{lineCol.col}
            </span>
          </div>
          <div className="flex items-center px-2 gap-1 hover:bg-accent/30 hover:text-accent-foreground transition-colors cursor-default h-full">
            <span className="tracking-tight">
              {lineCol.line}:{lineCol.col}
            </span>
          </div>


          <div className="flex items-center px-2 gap-1 hover:bg-accent/30 hover:text-accent-foreground transition-colors cursor-default h-full">
            <span className="tracking-tight">
              {fileType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomBar;

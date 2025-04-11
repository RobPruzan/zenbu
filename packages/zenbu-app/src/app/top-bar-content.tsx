"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Plus, X } from "lucide-react"; // Import icons for tab actions
import { motion } from "framer-motion";

interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
}

interface TopBarContentProps {
  dense?: boolean;
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (id: string) => void;
  onTabClose?: (id: string) => void;
  onNewTab?: () => void; // Optional handler for creating new tabs
}

export const TopBarContent: React.FC<TopBarContentProps> = ({
  dense = false,
  tabs = [],
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
}) => {
  const displayTabs = tabs;
  const currentActiveId = activeTabId ?? displayTabs[0]?.id;

  return (
    <div className={cn(
      "flex items-center bg-background/90 backdrop-blur-sm",
      dense ? "h-7" : "h-8"
    )}>
      <div className="flex-1 flex items-center overflow-x-auto no-scrollbar">
        {displayTabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabSelect(tab.id)}
            className={cn(
              "group relative flex items-center justify-between min-w-[140px] max-w-[200px] px-3 text-sm transition-all duration-150",
              dense ? "px-2 text-xs" : "",
              "border-r border-border/20",
              tab.id === currentActiveId
                ? "bg-muted/30 text-foreground"
                : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
            )}
            style={{
              height: dense ? "28px" : "32px"
            }}
            title={tab.title}
            initial={false}
            animate={{
              opacity: 1,
              backgroundColor: tab.id === currentActiveId ? "rgba(var(--muted) / 0.3)" : "transparent",
            }}
            transition={{
              duration: 0.1,
              ease: "easeInOut",
            }}
          >
            <div className="flex items-center truncate w-full">
              {tab.icon && (
                <span className={cn(
                  "mr-1.5 opacity-70 group-hover:opacity-100 transition-opacity",
                  dense ? "mr-1" : ""
                )}>
                  {tab.icon}
                </span>
              )}
              <span className="truncate">{tab.title}</span>
            </div>
            
            {onTabClose && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: tab.id === currentActiveId ? 0.8 : 0
                }}
                whileHover={{ opacity: 1 }}
                className="ml-2 absolute right-1"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-5 w-5 rounded-sm p-0 opacity-0 group-hover:opacity-100 hover:bg-background/40",
                    dense ? "h-4 w-4" : "",
                    tab.id === currentActiveId ? "text-foreground" : "text-muted-foreground"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  title="Close tab"
                >
                  <X className={dense ? "h-3 w-3" : "h-3.5 w-3.5"} />
                </Button>
              </motion.div>
            )}
          </motion.button>
        ))}
        
        {onNewTab && (
          <motion.div
            initial={false}
            whileHover={{ backgroundColor: "rgba(var(--muted) / 0.2)" }}
            className="border-r border-border/20"
            style={{
              height: dense ? "28px" : "32px"
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewTab}
              className={cn(
                "rounded-none h-full w-8 hover:bg-transparent text-muted-foreground hover:text-foreground transition-colors",
                dense ? "w-6" : "w-8"
              )}
              title="New tab"
            >
              <Plus className={dense ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </Button>
          </motion.div>
        )}
      </div>
      
      <div className="flex items-center h-full border-l border-border/20">
        <div className="px-2 h-full flex items-center">
          {/* Space for additional controls */}
        </div>
      </div>
    </div>
  );
}; 
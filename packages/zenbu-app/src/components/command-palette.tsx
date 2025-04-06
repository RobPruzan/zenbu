"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useChatStore } from "./chat-instance-context";
import { CommandItem } from "./slices/command-palette-slice";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem as CommandItemUI,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";

export function CommandPalette() {
  const { isOpen, items, actions } = useChatStore((state) => state.commandPalette);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        actions.setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, actions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && !e.ctrlKey && e.key === "k") {
        e.preventDefault();
        actions.setOpen(!isOpen);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [actions, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleVimNavigation = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.metaKey) {
        if (e.key === "n") {
          e.preventDefault();
          e.stopPropagation();
          
          const downEvent = new KeyboardEvent('keydown', {
            key: 'ArrowDown',
            code: 'ArrowDown',
            bubbles: true
          });
          
          if (commandRef.current) {
            commandRef.current.dispatchEvent(downEvent);
          }
        } else if (e.key === "p") {
          e.preventDefault();
          e.stopPropagation();
          
          const upEvent = new KeyboardEvent('keydown', {
            key: 'ArrowUp',
            code: 'ArrowUp',
            bubbles: true
          });
          
          if (commandRef.current) {
            commandRef.current.dispatchEvent(upEvent);
          }
        }
      }
    };

    document.addEventListener("keydown", handleVimNavigation, { capture: true });
    return () => document.removeEventListener("keydown", handleVimNavigation, { capture: true });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setInputValue("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  const groupedItems = items.reduce<Record<string, CommandItem[]>>((acc, item) => {
    const category = item.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ 
            duration: 0.15,
            ease: [0.16, 1, 0.3, 1]
          }}

          className="fixed inset-0 flex items-start justify-center pt-[20vh]"
          style={{ backdropFilter: "blur(2px)" , zIndex: 300}}
        >
          <div className="relative w-full max-w-[640px] overflow-hidden rounded-lg border border-border/40 bg-background/80 shadow-md backdrop-blur" onClick={(e) => e.stopPropagation()}>
            <Command ref={commandRef} shouldFilter={true} className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border/30">
              <CommandInput
                ref={inputRef}
                value={inputValue}
                onValueChange={setInputValue}
                placeholder="Search commands..." 
                className="h-12"
              />
              <CommandList className="max-h-[60vh] overflow-y-auto px-1 py-2">
                <CommandEmpty>No results found.</CommandEmpty>
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                  <React.Fragment key={category}>
                    <CommandGroup heading={category}>
                      {categoryItems.map((item) => (
                        <CommandItemUI
                          key={item.id}
                          value={item.id}
                          onSelect={() => actions.selectItem(item.id)}
                          className="flex items-center justify-between py-2.5 px-3 cursor-pointer"
                        >
                          <div className="flex items-center">
                            {item.icon && <span className="mr-2">{item.icon}</span>}
                            <div className="flex flex-col">
                              <span>{item.title}</span>
                              {item.subtitle && (
                                <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                              )}
                            </div>
                          </div>
                          {item.shortcut && (
                            <CommandShortcut>{item.shortcut}</CommandShortcut>
                          )}
                        </CommandItemUI>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </React.Fragment>
                ))}
              </CommandList>
            </Command>
          </div>
          <div className="fixed inset-0 z-[-1]" onClick={() => actions.setOpen(false)}></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
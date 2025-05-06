"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Search } from "lucide-react";
import { useChatStore } from "./chat-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";
import { DialogContent } from "./ui/dialog";
import { ChildToParentMessage } from "zenbu-devtools";

type Command = {
  shortcut: string;
  icon: React.ReactNode;
  onSelect: () => void;
};

// we want an internal representation to order by most recently used, just like vscode
export function CommandPalette({ items }: { items: Array<Command> }) {
  const [open, setOpen] = React.useState(false);


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      } else if (e.key === "Enter" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    const handleMessage = (event: MessageEvent<ChildToParentMessage>) => {
      // breaks if yo use react devtools
      // if (event.origin !== "http://localhost:4200") {
      //   return;
      // }
      const data = event.data;

      switch (data.kind) {
        case "keydown": {
          if (data.key === "k" && (data.metaKey || data.ctrlKey)) {
            setOpen((open) => !open);
          } else if (data.key === "Enter" && open) {
            setOpen(false);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    document.addEventListener("keydown", down);
    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("keydown", down);
    };
  }, [open]);

  // const handleSelect = (shortcut: string, onSelect: () => void) => {
  //   setShortcutLastOpened((prev) => {
  //     const newState = prev.map((item) =>
  //       item.id === shortcut ? { ...item, lastOpened: Date.now() } : item,
  //     );
  //     return newState;
  //   });
  //   onSelect();
  // };

  // // Sort items by last opened time
  // const sortedItems = [...items].sort((a, b) => {
  //   const aTime =
  //     shortcutLastOpened.find((item) => item.id === a.shortcut)?.lastOpened ||
  //     0;
  //   const bTime =
  //     shortcutLastOpened.find((item) => item.id === b.shortcut)?.lastOpened ||
  //     0;
  //   return bTime - aTime;
  // });

  return (
    <CommandDialog
      open={open}
      onOpenChange={(open) => {
        console.log("bruh");

        setOpen(open);
      }}
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Commands">
          {items.map((item) => (
            <CommandItem
              key={item.shortcut}
              // onSelect={() => handleSelect(item.shortcut, item.onSelect)}
            >
              {item.icon}
              <span>{item.shortcut}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

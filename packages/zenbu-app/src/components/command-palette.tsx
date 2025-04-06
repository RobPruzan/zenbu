"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Search } from "lucide-react";
import { useChatStore } from "./chat-instance-context";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "./ui/command";
import { DialogContent } from "./ui/dialog";



// export function CommandPalette() {
//   const { isOpen, items, actions } = useChatStore((state) => state.commandPalette);
//   const [inputValue, setInputValue] = useState("");
//   const inputRef = useRef<HTMLInputElement>(null);
//   const commandRef = useRef<HTMLDivElement>(null);

//   // useEffect(() => {
//   //   const down = (e: KeyboardEvent) => {
//   //     if (e.key === "Escape" && isOpen) {
//   //       e.preventDefault();
//   //       e.stopPropagation();
//   //       actions.setOpen(false);
//   //     }
//   //   };

//   //   document.addEventListener("keydown", down);
//   //   return () => document.removeEventListener("keydown", down);
//   // }, [isOpen, actions]);

//   // useEffect(() => {
//   //   const handleKeyDown = (e: KeyboardEvent) => {
//   //     if (e.metaKey && !e.ctrlKey && e.key === "k") {
//   //       e.preventDefault();
//   //       actions.setOpen(!isOpen);
//   //     }
//   //   };

//   //   document.addEventListener("keydown", handleKeyDown);
//   //   return () => document.removeEventListener("keydown", handleKeyDown);
//   // }, [actions, isOpen]);

//   // useEffect(() => {
//   //   if (!isOpen) return;
    
//   //   const handleVimNavigation = (e: KeyboardEvent) => {
//   //     if (e.ctrlKey && !e.metaKey) {
//   //       if (e.key === "n") {
//   //         e.preventDefault();
//   //         e.stopPropagation();
          
//   //         const downEvent = new KeyboardEvent('keydown', {
//   //           key: 'ArrowDown',
//   //           code: 'ArrowDown',
//   //           bubbles: true
//   //         });
          
//   //         if (commandRef.current) {
//   //           commandRef.current.dispatchEvent(downEvent);
//   //         }
//   //       } else if (e.key === "p") {
//   //         e.preventDefault();
//   //         e.stopPropagation();
          
//   //         const upEvent = new KeyboardEvent('keydown', {
//   //           key: 'ArrowUp',
//   //           code: 'ArrowUp',
//   //           bubbles: true
//   //         });
          
//   //         if (commandRef.current) {
//   //           commandRef.current.dispatchEvent(upEvent);
//   //         }
//   //       }
//   //     }
//   //   };

//   //   document.addEventListener("keydown", handleVimNavigation, { capture: true });
//   //   return () => document.removeEventListener("keydown", handleVimNavigation, { capture: true });
//   // }, [isOpen]);

//   // useEffect(() => {
//   //   if (isOpen) {
//   //     setInputValue("");
//   //     setTimeout(() => {
//   //       inputRef.current?.focus();
//   //     }, 10);
//   //   }
//   // }, [isOpen]);

//   const groupedItems = items.reduce<Record<string, any[]>>((acc, item) => {
//     const category = item.category || "General";
//     if (!acc[category]) {
//       acc[category] = [];
//     }
//     acc[category].push(item);
//     return acc;
//   }, {});

//   return (
//    <CommandMenu/> 
//   );
// } 

type Command = {

  shortcut: string
  icon:React.ReactNode 
  onSelect: () => void
}

// we want an internal representation to order by most recently used, just like vscode
export function CommandPalette({ items}: {
  items: Array<Command>
}) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      } else if (e.key === "Enter" && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open])


  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Commands">
          {items.map((item) => (
            <CommandItem key={item.shortcut} onSelect={item.onSelect}>
              {item.icon}
              <span>{item.shortcut}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

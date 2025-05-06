"use client";
import { Dispatch, SetStateAction, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "src/components/ui/command";
import { ChildToParentMessage } from "zenbu-devtools";

export const CommandMenu = ({
  open,
  setOpen,
  items,
  onSelect,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  items: Array<{ name: string; icon: React.ReactNode }>;
  onSelect?: ((value: string) => void) | undefined;
}) => {
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
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Commands">
          {items.map((item) => (
            <CommandItem key={item.name} onSelect={onSelect}>
              {item.icon}
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

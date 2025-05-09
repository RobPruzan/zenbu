"use client";
import { DatabaseIcon, EditIcon, FolderPlusIcon, PackageIcon, PlusIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "src/components/ui/command";
import { ChildToParentMessage } from "zenbu-devtools";
export const WorkspaceCommandMenu = () => {
  const [open, setOpen] = useState(false);

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

    window.addEventListener("keydown", down);
    return () => {
      window.removeEventListener("keydown", down);
    };
  }, [open]);
  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Commands">
            {[
              {
                name: "Create Project",
                icon: <FolderPlusIcon />,
              },

              {
                name: "Create Package",
                icon: <PackageIcon />,
              },

              {
                name: "Create Model Tool",
                icon: <DatabaseIcon />,
              },

              {
                name: "Create Editor Tool",
                icon: <EditIcon />,
              },
            ].map((item) => (
              <CommandItem key={item.name}>
                {item.icon}
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

"use client";
// "use client";
// import { DatabaseIcon, EditIcon, FolderPlusIcon, PackageIcon, PlusIcon } from "lucide-react";
// import { Dispatch, SetStateAction, useEffect, useState } from "react";
// import {
//   CommandDialog,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "src/components/ui/command";
// import { ChildToParentMessage } from "zenbu-devtools";
// export const WorkspaceCommandMenu = () => {
//   const [open, setOpen] = useState(false);

//   useEffect(() => {
//     const down = (e: KeyboardEvent) => {
//       if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
//         e.preventDefault();
//         setOpen((open) => !open);
//       } else if (e.key === "Enter" && open) {
//         e.preventDefault();
//         setOpen(false);
//       }
//     };

//     window.addEventListener("keydown", down);
//     return () => {
//       window.removeEventListener("keydown", down);
//     };
//   }, [open]);
//   return (
//     <>
//       <CommandDialog open={open} onOpenChange={setOpen}>
//         <CommandInput placeholder="Type a command or search..." />
//         <CommandList>
//           <CommandEmpty>No results found.</CommandEmpty>
//           <CommandGroup heading="Commands">
//             {[
//               {
//                 name: "Create Project",
//                 icon: <FolderPlusIcon />,
//               },

//               {
//                 name: "Create Package",
//                 icon: <PackageIcon />,
//               },

//               {
//                 name: "Create Model Tool",
//                 icon: <DatabaseIcon />,
//               },

//               {
//                 name: "Create Editor Tool",
//                 icon: <EditIcon />,
//               },
//             ].map((item) => (
//               <CommandItem key={item.name}>
//                 {item.icon}
//                 <span>{item.name}</span>
//               </CommandItem>
//             ))}
//           </CommandGroup>
//         </CommandList>
//       </CommandDialog>
//     </>
//   );
// };

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Code,
  Command,
  FileText,
  Folder,
  Globe,
  Home,
  ImageIcon,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Music,
  Search,
  Settings,
  Terminal,
  User,
  X,
} from "lucide-react";
import Link from "next/link";

export const WorkspaceCommandMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  const categories = [
    {
      name: "Applications",
      commands: [
        {
          id: "dashboard",
          name: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          shortcut: "⌘ D",
        },
        {
          id: "explorer",
          name: "Project Explorer",
          icon: <Folder className="h-4 w-4" />,
          shortcut: "⌘ E",
        },
        {
          id: "terminal",
          name: "Terminal",
          icon: <Terminal className="h-4 w-4" />,
          shortcut: "⌘ T",
        },
        {
          id: "browser",
          name: "Web Browser",
          icon: <Globe className="h-4 w-4" />,
          shortcut: "⌘ B",
        },
      ],
    },
    {
      name: "Tools",
      commands: [
        {
          id: "code-editor",
          name: "Code Editor",
          icon: <Code className="h-4 w-4" />,
          shortcut: "⌘ C",
        },
        {
          id: "image-editor",
          name: "Image Editor",
          icon: <ImageIcon className="h-4 w-4" />,
          shortcut: "⌘ I",
        },
        {
          id: "music-player",
          name: "Music Player",
          icon: <Music className="h-4 w-4" />,
          shortcut: "⌘ M",
        },
        {
          id: "chat",
          name: "Chat",
          icon: <MessageSquare className="h-4 w-4" />,
          shortcut: "⌘ /",
        },
      ],
    },
    {
      name: "Documents",
      commands: [
        {
          id: "recent-files",
          name: "Recent Files",
          icon: <FileText className="h-4 w-4" />,
          shortcut: "⌘ R",
        },
        {
          id: "projects",
          name: "Projects",
          icon: <Layers className="h-4 w-4" />,
          shortcut: "⌘ P",
        },
        {
          id: "calendar",
          name: "Calendar",
          icon: <Calendar className="h-4 w-4" />,
          shortcut: "⌘ K",
        },
      ],
    },
    {
      name: "Settings",
      commands: [
        {
          id: "preferences",
          name: "Preferences",
          icon: <Settings className="h-4 w-4" />,
          shortcut: "⌘ ,",
        },
        {
          id: "profile",
          name: "User Profile",
          icon: <User className="h-4 w-4" />,
          shortcut: "⌘ U",
        },
      ],
    },
  ];

  const allCommands = categories.flatMap((category) => category.commands);

  const filteredCategories = searchQuery
    ? categories
        .map((category) => ({
          ...category,
          commands: category.commands.filter((command) =>
            command.name.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
        }))
        .filter((category) => category.commands.length > 0)
    : categories;

  const visibleCommands = filteredCategories.flatMap(
    (category) => category.commands,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);

        if (!isOpen) {
          setSearchQuery("");
          setSelectedIndex(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleMenuKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < visibleCommands.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Enter" && visibleCommands[selectedIndex]) {
        e.preventDefault();
        executeCommand(visibleCommands[selectedIndex].id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleMenuKeyDown);
    return () => window.removeEventListener("keydown", handleMenuKeyDown);
  }, [isOpen, visibleCommands, selectedIndex]);

  useEffect(() => {
    if (commandListRef.current && isOpen) {
      const selectedElement = commandListRef.current.querySelector(
        `[data-selected="true"]`,
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  const executeCommand = (commandId: string) => {
    console.log(`Executing command: ${commandId}`);
    setIsOpen(false);
  };

  const handleCommandClick = (commandId: string) => {
    executeCommand(commandId);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto">
          <div className="border border-[#181818] rounded-lg bg-gradient-to-t from-[#070808] to-[#090909] shadow-xl overflow-hidden">
            <div className="flex items-center border-b border-[#181818] p-3">
              <Search className="h-5 w-5 text-zinc-400 mr-2" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands..."
                className="flex-1 bg-transparent border-none text-sm focus:outline-none placeholder:text-zinc-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-[#131315] rounded border border-[#181818] text-zinc-400">
                  ESC
                </kbd>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-[#131315] text-zinc-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={commandListRef}
              className="max-h-[60vh] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-[#181818] scrollbar-track-transparent"
            >
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-8 text-center text-zinc-500 text-sm">
                  No commands found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredCategories.map((category, categoryIndex) => (
                  <div key={category.name} className="mb-2 last:mb-0">
                    <div className="px-3 py-1.5 text-xs text-zinc-500 font-medium">
                      {category.name}
                    </div>
                    <div>
                      {category.commands.map((command, commandIndex) => {
                        const absoluteIndex =
                          filteredCategories
                            .slice(0, categoryIndex)
                            .reduce(
                              (acc, cat) => acc + cat.commands.length,
                              0,
                            ) + commandIndex;

                        const isSelected = selectedIndex === absoluteIndex;

                        return (
                          <div
                            key={command.id}
                            data-selected={isSelected}
                            className={`px-3 py-2 flex items-center justify-between cursor-pointer ${
                              isSelected ? "bg-[#131315]" : ""
                            }`}
                            onClick={() => handleCommandClick(command.id)}
                            onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-8 h-8 rounded-md flex items-center justify-center mr-3 ${
                                  isSelected ? "bg-[#1a1a1c]" : "bg-[#131315]"
                                }`}
                              >
                                {command.icon}
                              </div>
                              <span className="text-sm">{command.name}</span>
                            </div>
                            <kbd className="px-1.5 py-0.5 text-xs bg-[#131315] rounded border border-[#181818] text-zinc-400">
                              {command.shortcut}
                            </kbd>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[#181818] px-3 py-2 text-xs text-zinc-500 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[#131315] rounded border border-[#181818]">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-[#131315] rounded border border-[#181818]">
                    ↓
                  </kbd>
                  <span className="ml-1">to navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-[#131315] rounded border border-[#181818]">
                    Enter
                  </kbd>
                  <span className="ml-1">to select</span>
                </div>
              </div>
              <Link href="/" className="hover:text-zinc-300 transition-colors">
                <Home className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

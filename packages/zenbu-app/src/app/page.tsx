"use client";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  MessageSquare,
  Terminal,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  Search,
  FileText,
  Command,
  Pencil,
  Airplay,
} from "lucide-react";
import ChatInterface from "~/components/chat-interface";
import { useState, useEffect } from "react";
import { scan, useScan } from "react-scan";
import DevTools from "../components/devtools";
import {
  ChatInstanceContext,
  useChatStore,
} from "~/components/chat-instance-context";
import { IFrameWrapper } from "./iframe-wrapper";
import { Chat } from "~/components/chat/chat";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "~/components/command-palette";
import {
  useCommandPalette,
  createCommandItem,
} from "~/hooks/use-command-palette";
import { BetterToolbar } from "~/components/slices/better-toolbar";
import { DevtoolsOverlay } from "~/components/devtools-overlay";
import { ScreenshotTool } from "./screenshot-tool";
import { BetterDrawing } from "./better-drawing";
// import { CommandPalette } from "~/components/command-palette";
// import { useCommandPalette, createCommandItem } from "~/hooks/use-command-palette";

// scan();

export default function Home() {
  // useScan();
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [devtoolsVisible, setDevtoolsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const handleToggleChat = (event: Event) => {
      if (!isAnimating) {
        setIsAnimating(true);
        setChatVisible((prev) => !prev);

        const visibilityEvent = new CustomEvent("chat-visibility-change", {
          detail: !chatVisible,
        });
        window.dispatchEvent(visibilityEvent);

        setTimeout(() => setIsAnimating(false), 300);
      }
    };

    window.addEventListener("toggle-chat", handleToggleChat);
    return () => window.removeEventListener("toggle-chat", handleToggleChat);
  }, [isAnimating, chatVisible]);

  const toggleChat = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setChatVisible(!chatVisible);

    const visibilityEvent = new CustomEvent("chat-visibility-change", {
      detail: !chatVisible,
    });
    window.dispatchEvent(visibilityEvent);

    setTimeout(() => setIsAnimating(false), 300);
  };

  const toggleDevtools = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDevtoolsVisible(!devtoolsVisible);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <main className="relative flex h-screen overflow-hidden bg-background text-foreground">
      <ChatInstanceContext.Provider
        initialValue={{
          toolbar: {
            state: {
              activeRoute: "off",
              drawing: {
                active: false,
                listeners: [],
              },
              screenshotting: {
                active: false,
              },
            },
          },
          context: {
            items: [],
          },
          inspector: {
            state: {
              kind: "off",
            },
          },
          eventLog: {
            events: [],
          },
          chatControls: {
            input: "",
          },
          commandPalette: {
            isOpen: false,
            items: [],
          },
        }}
      >
        <div className="flex h-full w-full overflow-hidden">
          <AnimatePresence mode="wait">
            {chatVisible && (
              <motion.div
                key="chat-panel"
                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                animate={{
                  width: "25%",
                  opacity: 1,
                  marginRight: 0,
                  transition: {
                    width: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8,
                    },
                    opacity: { duration: 0.1, delay: 0.05 },
                  },
                }}
                exit={{
                  width: 0,
                  opacity: 0,
                  marginRight: "-1px",
                  transition: {
                    width: {
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 0.8,
                    },
                    opacity: { duration: 0.1 },
                  },
                }}
                className="h-full flex-shrink-0 border-r border-border/40 overflow-hidden"
                style={{ minWidth: 0 }}
              >
                <div className="relative flex h-full flex-col">
                  <Chat onCloseChat={toggleChat} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-full flex-1 overflow-hidden">
            <ResizablePanelGroup direction="vertical" className="h-full">
              <ResizablePanel
                defaultSize={devtoolsVisible ? 70 : 100}
                className="h-full"
              >
                <div className="flex h-full flex-col">
                  <IFrameWrapper>
                    <ScreenshotTool />
                    <BetterToolbar />
                    <DevtoolsOverlay />
                    <BetterDrawing />
                  </IFrameWrapper>
                </div>
              </ResizablePanel>

              {devtoolsVisible && (
                <>
                  <ResizableHandle withHandle className="bg-border/40" />
                  <ResizablePanel
                    defaultSize={30}
                    minSize={15}
                    collapsible={true}
                  >
                    <div className="relative flex h-full flex-col border-t border-zinc-800/80">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 z-10 h-6 w-6 rounded-full hover:bg-background/80"
                        onClick={toggleDevtools}
                        disabled={isAnimating}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <DevTools onClose={toggleDevtools} />
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </div>
        </div>

        <CommandPaletteProvider />
        <CommandPalette />
      </ChatInstanceContext.Provider>
    </main>
  );
}

function CommandPaletteProvider() {
  const toggleChat = () => {
    window.dispatchEvent(new Event("toggle-chat"));
  };

  const { actions, state } = useChatStore((state) => state.toolbar);

  useCommandPalette({
    items: [
      createCommandItem("toggle-chat", "Chat", {
        category: "View",
        icon: <MessageSquare size={16} />,
        shortcut: "⌘K",
        onSelect: toggleChat,
      }),
      createCommandItem("draw", "Draw", {
        category: "View",
        icon: <Pencil />,
        shortcut: "⌘,",
        onSelect: () => {
          actions.setIsDrawing(!state.drawing.active);
        },
        // onSelect: () => console.log("Open settings"),
      }),
      createCommandItem("screenshot", "Screenshot", {
        category: "View",
        icon: <Airplay />,
        shortcut: "⌘F",
        onSelect: () => {
          actions.setIsScreenshotting(!state.screenshotting.active);
        },
      }),
      createCommandItem("new-file", "New File", {
        category: "Files",
        icon: <FileText size={16} />,
        shortcut: "⌘N",
        onSelect: () => console.log("New file"),
      }),
      createCommandItem("command-palette", "Command Palette", {
        category: "App",
        icon: <Command size={16} />,
        shortcut: "⌘P",
        onSelect: () => {}, // Already open when selected
      }),
    ],
  });

  return null;
}

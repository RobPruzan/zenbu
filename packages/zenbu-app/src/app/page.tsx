"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Airplay,
  Camera,
  DownloadCloudIcon,
  Gauge,
  Logs,
  MessageSquare,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  ChatInstanceContext,
  useChatStore,
} from "~/components/chat-instance-context";
import { Chat } from "~/components/chat/chat";
import { CommandPalette } from "~/components/command-palette";
import { DevtoolsOverlay } from "~/components/devtools-overlay";
import { BetterToolbar } from "~/components/slices/better-toolbar";
import { Button } from "~/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import DevTools from "../components/devtools";
import { BetterDrawing } from "./better-drawing";
import { IFrameWrapper } from "./iframe-wrapper";
import { ScreenshotTool } from "./screenshot-tool";
import { Recorder } from "~/components/screen-sharing";
import { Recording } from "~/components/recording";
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
                getEditor: () => null,
              },
              screenshotting: {
                active: false,
              },
              recording: {
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
                    <Recording />
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

        <CommandWrapper />
        {/* <CommandPaletteProvider /> */}
      </ChatInstanceContext.Provider>
    </main>
  );
}

const CommandWrapper = () => {
  const { actions, state } = useChatStore((state) => state.toolbar);
  return (
    <CommandPalette
      items={[
        {
          shortcut: "Chat",
          icon: <MessageSquare size={16} />,
          onSelect: () => {
            // bro what are we doing
            window.dispatchEvent(new Event("toggle-chat"));
          },
        },
        {
          shortcut: "Draw",
          icon: <Pencil size={16} />,
          onSelect: () => {
            actions.setIsDrawing(!state.drawing.active);
          },
        },
        {
          shortcut: "Screenshot",
          icon: <Airplay size={16} />,
          onSelect: () => {
            actions.setIsScreenshotting(!state.screenshotting.active);
          },
        },
        {
          shortcut: "Record",
          icon: <Camera size={16} />,
          onSelect: () => {
            actions.setIsRecording(!state.recording.active);
          },
        },
        {
          shortcut: "Console",
          icon: <Logs size={16} />,
          onSelect: () => {},
        },
        {
          shortcut: "Network",
          icon: <DownloadCloudIcon size={16} />,
          onSelect: () => {},
        },
        {
          shortcut: "Performance",
          icon: <Gauge size={16} />,
          onSelect: () => {},
        },
      ]}
    />
  );
};

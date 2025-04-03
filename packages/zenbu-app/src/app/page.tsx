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
} from "lucide-react";
import ChatInterface from "~/components/chat-interface";
import { useState, useEffect } from "react";
import { scan, useScan } from "react-scan";
import DevTools from "../components/devtools";
import { ChatInstanceContext } from "~/components/chat-instance-context";
import { IFrameWrapper } from "./iframe-wrapper";
import { Chat } from "~/components/chat/chat";
import { motion, AnimatePresence } from "framer-motion";

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
        setChatVisible(prev => !prev);
        
        // Dispatch an event to notify other components about the visibility change
        const visibilityEvent = new CustomEvent('chat-visibility-change', {
          detail: !chatVisible
        });
        window.dispatchEvent(visibilityEvent);
        
        setTimeout(() => setIsAnimating(false), 300);
      }
    };

    window.addEventListener('toggle-chat', handleToggleChat);
    return () => window.removeEventListener('toggle-chat', handleToggleChat);
  }, [isAnimating, chatVisible]);

  const toggleChat = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setChatVisible(!chatVisible);
    
    // Dispatch an event to notify other components about the visibility change
    const visibilityEvent = new CustomEvent('chat-visibility-change', {
      detail: !chatVisible
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
      {/* Left chat toggle button (when collapsed) */}
      {!chatVisible && (
        <div className="absolute left-2 top-2 z-30">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-border/50 bg-background shadow-md hover:bg-accent"
            onClick={toggleChat}
            disabled={isAnimating}
          >
            <MessageSquare className="h-5 w-5 text-primary" />
          </Button>
        </div>
      )}

      {/* Bottom devtools toggle button (when collapsed) */}
      {!devtoolsVisible && (
        <div className="absolute bottom-2 right-2 z-30">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-border/50 bg-background shadow-md hover:bg-accent"
            onClick={toggleDevtools}
            disabled={isAnimating}
          >
            <Terminal className="h-5 w-5 text-primary" />
          </Button>
        </div>
      )}

      <ChatInstanceContext.Provider
        initialValue={{
          toolbar: {
            state: {
              kind: "idle",
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
        {/* Use Flexbox for the main horizontal layout */}
        <div className="flex h-full w-full overflow-hidden">
          {/* Left side: Chat interface (Animated Flex Item) */}
          <AnimatePresence mode="wait">
            {chatVisible && (
              <motion.div
                key="chat-panel"
                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                animate={{
                  width: "25%", // Target width
                  opacity: 1,
                  marginRight: 0, // Ensure no margin interferes
                  transition: {
                    width: { type: "spring", stiffness: 500, damping: 30, mass: 0.8 },
                    opacity: { duration: 0.1, delay: 0.05 }
                  }
                }}
                exit={{
                  width: 0,
                  opacity: 0,
                  marginRight: "-1px", // Add small negative margin on exit to prevent gap
                  transition: {
                    width: { type: "spring", stiffness: 500, damping: 30, mass: 0.8 },
                    opacity: { duration: 0.1 }
                  }
                }}
                className="h-full flex-shrink-0 border-r border-border/40 overflow-hidden" // flex-shrink-0 is crucial
                style={{ minWidth: 0 }} // Allow shrinking below intrinsic size
              >
                <div className="relative flex h-full flex-col">
                  <Chat onCloseChat={toggleChat} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main content area (Takes remaining space) */}
          {/* Add overflow-hidden to prevent content shift */}
          <div className="h-full flex-1 overflow-hidden">
            {/* Vertical Resizable Group for Iframe/DevTools */}
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Iframe Panel - Let it take available space */}
              <ResizablePanel defaultSize={devtoolsVisible ? 70 : 100} className="h-full">
                {/* Make inner div full height too */}
                <div className="flex h-full flex-col">
                  <IFrameWrapper />
                </div>
              </ResizablePanel>

              {/* Bottom panel: Dev tools */}
              {devtoolsVisible && (
                <>
                  <ResizableHandle withHandle className="bg-border/40" />
                  <ResizablePanel defaultSize={30} minSize={15} collapsible={true}>
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
      </ChatInstanceContext.Provider>

      {/* Projects Dialog */}
      <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projects</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Your projects will appear here.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Settings will appear here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

"use client";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Terminal,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import ChatInterface from "@/components/chat-interface";
import { useState, useEffect } from "react";
import { scan } from "react-scan";
import { IFrameWrapper } from "@/app/iframe-wrapper";
import DevTools from "../components/devtools";

scan({
  showFPS: false,
  // showNotificationCount: false,
});

export default function Home() {
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [chatVisible, setChatVisible] = useState(true);
  const [devtoolsVisible, setDevtoolsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleChat = () => {
    setIsAnimating(true);
    setChatVisible(!chatVisible);
    setTimeout(() => setIsAnimating(false), 300); // Match transition duration
  };

  const toggleDevtools = () => {
    setIsAnimating(true);
    setDevtoolsVisible(!devtoolsVisible);
    setTimeout(() => setIsAnimating(false), 300); // Match transition duration
  };

  return (
    <main className="flex h-screen bg-background text-foreground overflow-hidden relative">
      {/* Left chat toggle button (when collapsed) */}
      {!chatVisible && (
        <div className="absolute top-2 left-2 z-30">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full shadow-md bg-background border-border/50 hover:bg-accent"
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
            className="h-9 w-9 rounded-full shadow-md bg-background border-border/50 hover:bg-accent"
            onClick={toggleDevtools}
            disabled={isAnimating}
          >
            <Terminal className="h-5 w-5 text-primary" />
          </Button>
        </div>
      )}

      <ResizablePanelGroup direction="horizontal">
        {/* Left side: Chat interface */}
        {chatVisible && (
          <>
            <ResizablePanel
              defaultSize={25}
              minSize={15}
              maxSize={40}
              className="transition-all duration-300 ease-in-out"
            >
              <div className="h-full flex flex-col border-r border-border/40 relative">
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full hover:bg-background/80"
                  onClick={toggleChat}
                  disabled={isAnimating}
                >
                  <X className="h-3.5 w-3.5" />
                </Button> */}
                <ChatInterface onClose={toggleChat} />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border/40" />
          </>
        )}

        {/* Main content area with iframe and bottom devtools */}
        <ResizablePanel defaultSize={chatVisible ? 75 : 100}>
          <ResizablePanelGroup direction="vertical">
            {/* Iframe */}
            <ResizablePanel
              defaultSize={devtoolsVisible ? 70 : 100}
              className="h-full"
            >
              <div className="h-full flex flex-col">
                <IFrameWrapper />
              </div>
            </ResizablePanel>

            {/* Bottom panel: Dev tools */}
            {devtoolsVisible && (
              <>
                <ResizableHandle withHandle className="bg-border/40" />
                <ResizablePanel
                  defaultSize={30}
                  minSize={15}
                  className="transition-all duration-300 ease-in-out"
                >
                  <div className="h-full flex flex-col border-t border-zinc-800/80 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full hover:bg-background/80"
                      onClick={toggleDevtools}
                      disabled={isAnimating}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                    <DevTools />
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Projects Dialog */}
      <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projects</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-sm">
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
            <p className="text-muted-foreground text-sm">
              Settings will appear here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

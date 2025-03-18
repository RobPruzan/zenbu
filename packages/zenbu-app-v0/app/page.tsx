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
import { Settings, FolderKanban } from "lucide-react";
import ChatInterface from "@/components/chat-interface";
import BrowserPreview from "@/components/browser-preview";
import { useState } from "react";
import { scan } from "react-scan";

scan({
  showNotificationCount: false,
});

export default function Home() {
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  return (
    <main className="flex h-screen bg-background text-foreground overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        {/* Left side: Chat interface */}
        <ResizablePanel defaultSize={27} minSize={27}>
          <div className="h-full flex flex-col border-r border-border/40">
            <ChatInterface />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-border/40" />

        {/* Right side: Browser preview */}
        <ResizablePanel defaultSize={73}>
          <BrowserPreview />
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

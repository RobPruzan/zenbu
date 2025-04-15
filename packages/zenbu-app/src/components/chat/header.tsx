import {
  Search,
  MessageSquare,
  PanelRightOpen,
  Minus,
  Plus,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "src/lib/utils";
import { useChatStore } from "../chat-store";
import { useState } from "react";

export function Header({ onCloseChat }: { onCloseChat: () => void }) {
  const url = useChatStore((state) => state.iframe.state.url);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex gap-x-1 items-center justify-between h-12 px-3">
        <div className="flex-1" />
        <div className="flex items-center bg-accent/5 border border-border/40 rounded-full h-7 w-[280px] px-3 group relative">
          <span
            className="font-light text-[11px] text-muted-foreground cursor-pointer "
            onClick={handleCopy}
          >
            {url}
          </span>
          <div
            className={`absolute right-3 cursor-pointer`}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="flex-1" />
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              onCloseChat();
            }}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full",
              "bg-accent/5 border border-border/40",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-accent/10 transition-all duration-300",
            )}
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => {
              const iframe = document.getElementById(
                "child-iframe",
              ) as HTMLIFrameElement;

              // Get current scale from transform or default to 1
              const currentTransform = iframe.style.transform || "scale(1)";
              const currentScale =
                parseFloat(currentTransform.replace(/[^\d.-]/g, "")) || 1;

              // Scale down by 10% of original scale (not relative to current)
              const newScale = Math.max(0.1, currentScale - 0.1);

              // Reset dimensions to ensure it fits the container
              iframe.style.width = "100%";
              iframe.style.height = "100%";
              iframe.style.transform = `scale(${newScale})`;
              iframe.style.transformOrigin = "top left";

              // Adjust container to fit the scaled content
              const container = iframe.parentElement;
              if (container) {
                container.style.overflow = "hidden";
              }
            }}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full",
              "bg-accent/5 border border-border/40",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-accent/10 transition-all duration-300",
            )}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => {
              const iframe = document.getElementById(
                "child-iframe",
              ) as HTMLIFrameElement;

              // Get current scale from transform or default to 1
              const currentTransform = iframe.style.transform || "scale(1)";
              const currentScale =
                parseFloat(currentTransform.replace(/[^\d.-]/g, "")) || 1;

              // Scale up by 10% of original scale (not relative to current)
              const newScale = currentScale + 0.1;

              // Reset dimensions to ensure it fits the container
              iframe.style.width = "100%";
              iframe.style.height = "100%";
              iframe.style.transform = `scale(${newScale})`;
              iframe.style.transformOrigin = "top left";

              // Adjust container to fit the scaled content
              const container = iframe.parentElement;
              if (container) {
                container.style.overflow = "hidden";
              }
            }}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full",
              "bg-accent/5 border border-border/40",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-accent/10 transition-all duration-300",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

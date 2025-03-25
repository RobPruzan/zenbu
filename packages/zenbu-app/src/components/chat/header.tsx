import {
  Search,
  MessageSquare,
  PanelRightOpen,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "../ui/button";

export const Header = ({ onCloseChat }: { onCloseChat: () => void }) => {
  return (
    <div className="relative z-10 backdrop-blur-xl bg-[rgba(24,24,26,0.6)] border-b border-[rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between h-12 px-3">
        <div className="flex-1"></div>
        <div className="flex items-center bg-[rgba(30,30,34,0.55)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] rounded-full h-7 w-[280px] px-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2.5 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></div>
          <span className="font-light text-[11px] text-[#F2F2F7]">
            localhost:4200
          </span>
          <div className="flex-1"></div>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              onCloseChat();
            }}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#A1A1A6] hover:text-white rounded-full bg-[rgba(30,30,34,0.55)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(40,40,46,0.7)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300"
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => {
              const iframe = document.getElementById(
                "child-iframe",
              ) as HTMLIFrameElement;
              
              // Get current scale from transform or default to 1
              const currentTransform = iframe.style.transform || 'scale(1)';
              const currentScale = parseFloat(currentTransform.replace(/[^\d.-]/g, '')) || 1;
              
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
            className="h-8 w-8 p-0 text-[#A1A1A6] hover:text-white rounded-full bg-[rgba(30,30,34,0.55)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(40,40,46,0.7)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={() => {
              const iframe = document.getElementById(
                "child-iframe",
              ) as HTMLIFrameElement;
              
              // Get current scale from transform or default to 1
              const currentTransform = iframe.style.transform || 'scale(1)';
              const currentScale = parseFloat(currentTransform.replace(/[^\d.-]/g, '')) || 1;
              
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
            className="h-8 w-8 p-0 text-[#A1A1A6] hover:text-white rounded-full bg-[rgba(30,30,34,0.55)] backdrop-blur-xl border border-[rgba(255,255,255,0.05)] hover:bg-[rgba(40,40,46,0.7)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

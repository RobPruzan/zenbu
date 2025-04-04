import { ChevronDown, RefreshCw } from "lucide-react";
import { ChatMessage } from "zenbu-plugin/src/ws/utils";

export const UserMessage = ({ message }: { message: ChatMessage }) => {
  return (
    <div className="group mb-6 max-w-full">
      <div className="rounded-2xl bg-[#121214] backdrop-blur-xl border border-[rgba(255,255,255,0.04)] shadow-[0_4px_24px_rgba(0,0,0,0.15)] overflow-hidden max-w-full transform hover:translate-y-[-1px] transition-all duration-300">
        <div className="px-4 py-3 text-xs text-[#F2F2F7] whitespace-pre-wrap font-sans leading-relaxed break-words overflow-auto">
          {message.content}
        </div>

        <div className="flex items-center justify-between text-[10px] px-4 py-2 text-[#A1A1A6] bg-[#1a1a1c]">
          <div className="flex items-center">
            <ChevronDown className="h-2.5 w-2.5 mr-1.5" />
            <span className="font-light">gpt-4o</span>
          </div>
          <div className="flex items-center">
            <button className="hover:text-white transition-colors">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-2.5 w-2.5" />
                Restore
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
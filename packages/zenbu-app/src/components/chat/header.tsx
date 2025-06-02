import {
  Search,
  MessageSquare,
  PanelRightOpen,
  Minus,
  Plus,
  Check,
  Copy,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "src/lib/utils";
import { useChatStore } from "../chat-store";
import { useState } from "react";
import { Input } from "../ui/input";
import { flushSync } from "react-dom";

export function Header({ onCloseChat }: { onCloseChat: () => void }) {
  const url = useChatStore((state) => state.iframe.state.url);
  const name = useChatStore((state) => state.iframe.state.project.name);
  const [copied, setCopied] = useState(false);
  const iframe = useChatStore((state) => state.iframe);

  const handleCopy = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [editUrl, setEditUrl] = useState(false);
  return (
    <div className="relative z-10 border-b bg-background/80 backdrop-blur-xl">
      <div className="flex gap-x-1 items-center justify-between h-12 px-3">
        <span className="text-xs truncate font-bold">{name}</span>
        <div className="flex-1" />
        <div className="flex-1 flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              window.open("cursor://");
            }}
            variant={"outline"}
            className="text-xs"
          >
            View in Cursor
          </Button>
          {/* <Button
            onClick={() => {
              onCloseChat();
            }}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full",
              "bg-accent/5 border",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-accent/10 transition-all duration-300",
            )}
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </Button> */}
        </div>
      </div>
    </div>
  );
}

// <div className="flex items-center bg-accent/5 border rounded-full h-7 w-[280px] px-3 group relative">
//   {/* {!editUrl && (
//     <span
//       className="font-light text-[11px] text-muted-foreground  "
//       onClick={() => {
//         flushSync(() => {
//           setEditUrl(true);
//           setTimeout(() => {
//             const input = document.getElementById(
//               "edit-url-input",
//             ) as HTMLInputElement;
//             input.select();
//           });
//         });
//       }}
//     >
//       {url}
//     </span>
//   )} */}
//   {/* {editUrl && (
//     <input
//       id="edit-url-input"
//       onBlur={() => {
//         setEditUrl(false);
//       }}
//       onFocus={(e) => {}}
//       value={iframe.state.url}
//       onChange={(e) => {
//         iframe.actions.setState({
//           url: e.target.value,
//         });
//       }}
//       className="font-light text-[11px] w-full  text-muted-foreground bg-transparent ring-0 outline-none text-white "
//     />
//   )} */}

//   <div className="flex-1" />
// </div>

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
    <div className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex gap-x-1 items-center justify-between h-12 px-3">
        <span className="text-xs truncate font-bold">{name}</span>
        <div className="flex-1" />
        <div className="flex-1 flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              window.open("cursor://file//Users/robby/bun-react-test", "_blank");
            }}
            variant={"outline"}
            className="text-xs"
          >
            <Cursor />
            Open in Cursor
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

import * as React from "react";
import type { SVGProps } from "react";
const Cursor = (props: SVGProps<SVGSVGElement>) => (
  <svg
    height="1em"
    style={{
      flex: "none",
      lineHeight: 1,
    }}
    viewBox="0 0 24 24"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>{"Cursor"}</title>
    <path
      d="M11.925 24l10.425-6-10.425-6L1.5 18l10.425 6z"
      fill="url(#lobe-icons-cursorundefined-fill-0)"
    />
    <path
      d="M22.35 18V6L11.925 0v12l10.425 6z"
      fill="url(#lobe-icons-cursorundefined-fill-1)"
    />
    <path
      d="M11.925 0L1.5 6v12l10.425-6V0z"
      fill="url(#lobe-icons-cursorundefined-fill-2)"
    />
    <path d="M22.35 6L11.925 24V12L22.35 6z" fill="#555" />
    <path d="M22.35 6l-10.425 6L1.5 6h20.85z" fill="#ffff" />
    <defs>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="lobe-icons-cursorundefined-fill-0"
        x1={11.925}
        x2={11.925}
        y1={12}
        y2={24}
      >
        <stop offset={0.16} stopColor="#ffff" stopOpacity={0.39} />
        <stop offset={0.658} stopColor="#ffff" stopOpacity={0.8} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="lobe-icons-cursorundefined-fill-1"
        x1={22.35}
        x2={11.925}
        y1={6.037}
        y2={12.15}
      >
        <stop offset={0.182} stopColor="#ffff" stopOpacity={0.31} />
        <stop offset={0.715} stopColor="#ffff" stopOpacity={0} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id="lobe-icons-cursorundefined-fill-2"
        x1={11.925}
        x2={1.5}
        y1={0}
        y2={18}
      >
        <stop stopColor="#ffff" stopOpacity={0.6} />
        <stop offset={0.667} stopColor="#ffff" stopOpacity={0.22} />
      </linearGradient>
    </defs>
  </svg>
);

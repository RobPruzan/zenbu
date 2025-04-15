"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2, Ban } from "lucide-react";
import { Button } from "./ui/button";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { io, Socket } from "socket.io-client";
import { FitAddon } from "xterm-addon-fit";

interface BottomPanelProps {
  isOpen: boolean;
  close: () => void;
  open: () => void;
  children?: React.ReactNode;
}

const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return false;
  }

  return children;
};

export function BottomPanel(props: BottomPanelProps) {
  return (
    <ClientOnly>
      <BottomPanelInner {...props} />
    </ClientOnly>
  );
}

export default function BottomPanelInner({
  isOpen,
  close: onClose,
}: BottomPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let socket: Socket | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;
    let isOpened = false;
    let debounceTimeout: number | null = null;
    let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

    const node = terminalRef.current;
    if (!node) return;

    const debounce = (func: () => void, delay: number) => {
      return () => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        debounceTimeout = setTimeout(() => {
          func();
        }, delay) as unknown as number;
      };
    };

    term = new Terminal({
      fontSize: 14,
      theme: {
        background: "#000000",
        foreground: "#ffffff",
        cursor: "#ffffff",
        black: "#000000",
        brightBlack: "#666666",
        red: "#ff5555",
        green: "#50fa7b",
        yellow: "#f1fa8c",
        blue: "#bd93f9",
        magenta: "#ff79c6",
        cyan: "#8be9fd",
        white: "#f8f8f2",
        brightWhite: "#ffffff",
      },
      cursorBlink: true,
    });
    fitAddon = new FitAddon();

    term.loadAddon(fitAddon);

    termRef.current = term;

    const localFitAddon = fitAddon;
    const debouncedFit = debounce(() => {
      if (isOpened) {
        try {
          localFitAddon?.fit();
        } catch (e) {
          console.error("Error fitting terminal on resize:", e);
        }
      }
    }, 10);

    resizeObserver = new ResizeObserver(debouncedFit);
    resizeObserver.observe(node);

    rafId = requestAnimationFrame(() => {
      if (!term || !localFitAddon) return;

      try {
        if (node.offsetWidth > 0 && node.offsetHeight > 0) {
          term.open(node);
          localFitAddon.fit();
          term.focus();
          isOpened = true;

          socket = io("http://localhost:40000", {
            path: "/ws",
            transports: ["websocket"],
          });
          socket.on("output", (data: string) => term?.write(data));
          term.onData((data) => socket?.emit("input", data));
          term.onResize(({ cols, rows }) =>
            socket?.emit("resize", { cols, rows }),
          );

          keydownHandler = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "j" && e.metaKey) {
              e.preventDefault();
              onClose();
            }
          };
          node.addEventListener("keydown", keydownHandler);
        } else {
          console.warn(
            "Terminal container still has zero dimensions, open deferred.",
          );
        }
      } catch (e) {
        console.error("Error opening or fitting terminal:", e);
      }
    });

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (keydownHandler) {
        node.removeEventListener("keydown", keydownHandler);
      }
      term?.dispose();
      termRef.current = null;
      socket?.disconnect();
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      term = null;
      fitAddon = null;
      socket = null;
      resizeObserver = null;
      isOpened = false;
    };
  }, [terminalRef, onClose]);

  useEffect(() => {
    if (isOpen && terminalRef.current) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    }
  }, [isOpen]);

  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-border/40 bg-background backdrop-blur-sm relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-20 h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
        onClick={() => {
          termRef.current?.clear();
        }}
        tabIndex={0}
        aria-label="Clear terminal"
        type="button"
      >
        <Ban className="h-4 w-4" />
      </Button>
      <div className="flex-1 overflow-auto">
        <div
          ref={terminalRef}
          className="w-full h-full"
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}

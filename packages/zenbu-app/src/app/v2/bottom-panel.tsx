"use client";
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { BottomSidebarRoute, useSidebarRouter } from "./context";
import { XTerm } from "./terminal";

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
export default function BottomPanel() {
  const sidebar = useSidebarRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "j" && e.metaKey) {
        console.log("toggling");

        sidebar.setBottomSidebarRoute(
          sidebar.bottom === "terminal" ? null : "terminal",
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <ClientOnly>
      <BottomPanelInner
        terminalOpen={sidebar.bottom === "terminal"}
        setTerminalOpen={(
          updaterOrValue: boolean | ((prev: boolean) => boolean),
        ) => {
          if (typeof updaterOrValue === "function") {
            sidebar.setBottomSidebarRoute(
              updaterOrValue(sidebar.bottom === "terminal") ? "terminal" : null,
            );
            return;
          }

          sidebar.setBottomSidebarRoute(updaterOrValue ? "terminal" : null);
        }}
      />
    </ClientOnly>
  );
}

const BottomPanelInner = ({
  terminalOpen,
  setTerminalOpen,
}: {
  terminalOpen: boolean;
  setTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const sidebar = useSidebarRouter();

  if (!sidebar.bottom) {
    return;
  }

  switch (sidebar.bottom) {
    case "terminal": {
      return <XTerm toggleOpen={setTerminalOpen} isOpen={terminalOpen} />;
    }
  }
  sidebar.bottom satisfies never;
};

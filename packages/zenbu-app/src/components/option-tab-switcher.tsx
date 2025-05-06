"use client";

import { Home } from "lucide-react";
import { cn } from "src/lib/utils";
import { useEffect, useRef } from "react";
import { trpc } from "src/lib/trpc";
import { Project } from "zenbu-daemon";
import { iife } from "src/lib/utils";
import { useRouter } from "next/navigation";
import { useAppSwitcherState } from "./app-switcher-context";

type InferredProject = Project;
type ProjectWithPort = Extract<InferredProject, { port: number }>;
type SwitcherItem =
  | { type: "home"; name: string }
  | ({ type: "project" } & ProjectWithPort);

const QUICK_SWITCH_DURATION = 150; 

export default function AppSwitcher({
  setProject,
}: {
  setProject: (project: ProjectWithPort) => void;
}) {
  const {
    showAppSwitcher,
    switcherIndex,
    recentlyUsed,
    altDownTimestampRef,
    setShowAppSwitcher,
    setSwitcherIndex,
    updateRecentlyUsed,
  } = useAppSwitcherState();

  const tabPressedWhileAltHeldRef = useRef(false);

  const router = useRouter();
  const { data: projects = [] } = trpc.daemon.getProjects.useQuery();

  const performSwitch = (item: SwitcherItem) => {
    if (item.type === "home") {
      router.push("/home");
    } else {
      setProject(item);
    }
    updateRecentlyUsed(item.name);
  };

  const getSortedSwitcherItems = (): SwitcherItem[] => {
    const runningProjects = projects.filter(
      (p): p is Extract<InferredProject, { status: "running" }> =>
        p.status === "running",
    );

    const baseItems: SwitcherItem[] = [
      { type: "home", name: "Home" },
      ...runningProjects.map((p): SwitcherItem => ({ ...p, type: "project" })),
    ];

    return baseItems.sort((a, b) => {
      const aIndex = recentlyUsed.indexOf(a.name);
      const bIndex = recentlyUsed.indexOf(b.name);

      if (aIndex === -1 && bIndex === -1) {
        return 0;
      }
      if (aIndex === -1) {
        return 1;
      }
      if (bIndex === -1) {
        return -1;
      }
      return aIndex - bIndex;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt" && !e.repeat) {
        altDownTimestampRef.current = performance.now();
        tabPressedWhileAltHeldRef.current = false;
      }

      if (e.key === "Escape" && showAppSwitcher) {
        e.preventDefault();
        setShowAppSwitcher(false);
        altDownTimestampRef.current = null;
        tabPressedWhileAltHeldRef.current = false;
        return;
      }

      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        tabPressedWhileAltHeldRef.current = true;
        const items = getSortedSwitcherItems();
        if (items.length === 0) return;

        const pressDuration = altDownTimestampRef.current
          ? performance.now() - altDownTimestampRef.current
          : Infinity;

        if (showAppSwitcher) {
          setSwitcherIndex((prev) => (prev + 1) % items.length);
        } else {
          if (pressDuration >= QUICK_SWITCH_DURATION) {
            setShowAppSwitcher(true);
            setSwitcherIndex(items.length > 1 ? 1 : 0);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        const altUpTimestamp = performance.now();
        const pressDuration = altDownTimestampRef.current
          ? altUpTimestamp - altDownTimestampRef.current
          : Infinity;
        const wasTabPressed = tabPressedWhileAltHeldRef.current;

        altDownTimestampRef.current = null;
        tabPressedWhileAltHeldRef.current = false;

        const items = getSortedSwitcherItems();

        if (wasTabPressed) {
          if (showAppSwitcher) {
            const selectedItem = items[switcherIndex];
            if (selectedItem) {
              performSwitch(selectedItem);
            }
          } else if (pressDuration < QUICK_SWITCH_DURATION) {
            if (items.length > 1) {
              performSwitch(items[1]);
            } else if (items.length === 1) {
              performSwitch(items[0]);
            }
          }
        }

        if (showAppSwitcher) {
          setShowAppSwitcher(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    showAppSwitcher,
    switcherIndex,
    projects,
    recentlyUsed,
    setProject,
    router,
    setShowAppSwitcher,
    setSwitcherIndex,
    updateRecentlyUsed,
    altDownTimestampRef,
  ]);

  const items = getSortedSwitcherItems();

  if (!showAppSwitcher || items.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-black border border-white/20 rounded-xl p-4 pb-8 shadow-2xl">
        <div className="flex items-center gap-3">
          {items.map((item, index) => (
            <div
              key={item.name}
              className={cn(
                "relative flex flex-col items-center",
                index === switcherIndex && "z-10",
              )}
            >
              <div
                className={cn(
                  "w-48 h-32 rounded-lg overflow-hidden border border-white/20 bg-black mb-3 transition-all",
                  index === switcherIndex
                    ? "ring-2 ring-white scale-105"
                    : "opacity-70 scale-95",
                )}
              >
                {iife(() => {
                  switch (item.type) {
                    case "home": {
                      return (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <Home className="w-12 h-12" />
                        </div>
                      );
                    }
                    case "project": {
                      return (
                        <iframe
                          src={`http://localhost:${item.port}`}
                          className="w-full h-full pointer-events-none border-0"
                          style={{
                            transform: "scale(0.25)",
                            transformOrigin: "top left",
                            width: "400%",
                            height: "400%",
                          }}
                          title={item.name}
                        />
                      );
                    }
                  }
                })}
              </div>
              <div
                className={cn(
                  "text-xs font-medium whitespace-nowrap transition-colors",
                  index === switcherIndex ? "text-white" : "text-white/60",
                )}
              >
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

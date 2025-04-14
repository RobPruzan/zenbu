"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Code, Server, Component, Layout, Command } from "lucide-react";
import { useChatStore } from "./chat-store";
import {
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "cmdk";
import { trpc } from "src/lib/trpc";

const ProjectCommandContent = ({ onClose }: { onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const { iframe } = useChatStore();
  const [recentlyVisited, setRecentlyVisited] = useState<
    Array<{ name: string; port: number; pid?: string }>
  >([]);

  const [projects, projectsQuery] = trpc.daemon.getProjects.useSuspenseQuery(
    undefined,
    {
      refetchInterval: 5000,
    },
  );

  useEffect(() => {
    const storedRecent = localStorage.getItem("recentlyVisitedProjects");
    if (storedRecent) {
      try {
        setRecentlyVisited(JSON.parse(storedRecent));
      } catch (e) {
        setRecentlyVisited([]);
      }
    }
  }, []);

  const getIcon = (type?: string) => {
    switch (type) {
      case "react":
        return <Code className="h-4 w-4 text-blue-400" />;
      case "next":
        return <Server className="h-4 w-4 text-slate-200" />;
      case "vue":
        return <Component className="h-4 w-4 text-green-400" />;
      case "svelte":
        return <Layout className="h-4 w-4 text-orange-400" />;
      case "astro":
        return <Globe className="h-4 w-4 text-purple-400" />;
      default:
        return <Globe className="h-4 w-4 opacity-70" />;
    }
  };

  const navigateToProject = (project: {
    name: string;
    port: number;
    pid?: string;
  }) => {
    iframe.actions.setInspectorState({
      url: `http://localhost:${project.port}`,
    });

    // Update recently visited - exclude current project from the list
    const currentUrl = iframe.state?.url;
    const currentPort = currentUrl
      ? parseInt(currentUrl.split(":").pop() || "0", 10)
      : 0;
    const currentProject = {
      name: projects.find((p) => p.port === currentPort)?.name || "Unknown",
      port: currentPort,
    };

    // Filter out the project we're navigating to and the current project
    const newRecent = [
      project,
      ...recentlyVisited.filter(
        (p) =>
          !(p.name === project.name && p.port === project.port) &&
          !(p.name === currentProject.name && p.port === currentProject.port),
      ),
    ].slice(0, 10); // Keep only 10 most recent

    setRecentlyVisited(newRecent);
    localStorage.setItem("recentlyVisitedProjects", JSON.stringify(newRecent));
    onClose();
  };

  // const defaultProject = {
  //   name: "Default",
  //   port: 4200
  // };

  // Get current project to exclude it
  const currentUrl = iframe.state?.url;
  const currentPort = currentUrl
    ? parseInt(currentUrl.split(":").pop() || "0", 10)
    : 0;

  // Combine all projects and sort by recency
  const allProjects = [...recentlyVisited];

  // Add default project if not in recently visited and not current
  // if (!allProjects.some(p => p.name === "Default" && p.port === 4200) && currentPort !== 4200) {
  //   allProjects.push(defaultProject);
  // }

  // Add remaining projects that aren't in recently visited and aren't current
  projects.forEach((project) => {
    if (
      !allProjects.some(
        (p) => p.name === project.name && p.port === project.port,
      ) &&
      project.port !== currentPort
    ) {
      allProjects.push({
        name: project.name,
        port: project.port,
        pid: project.pid,
      });
    }
  });

  const filteredProjects = allProjects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Command className="rounded-lg border border-border/40 bg-background shadow-2xl backdrop-blur">
      <CommandInput
        placeholder="Search projects..."
        value={search}
        onValueChange={setSearch}
        autoFocus
      />
      <CommandList>
        <CommandEmpty>No projects found.</CommandEmpty>
        <CommandGroup heading="Projects">
          {filteredProjects.map((project) => (
            <CommandItem
              key={`${project.name}-${project.port}-${project.pid || "default"}`}
              value={project.name}
              className="flex items-center gap-2 px-4 py-2"
              onSelect={() => navigateToProject(project)}
            >
              <Globe className="h-4 w-4 opacity-70" />
              <span className="flex-1">{project.name}</span>
              <span className="text-xs text-muted-foreground">
                :{project.port}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export function ProjectCommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-x-0 top-4 z-50 mx-auto w-[640px]"
      onClick={(e) => e.stopPropagation()}
    >
      <Suspense
        fallback={
          <div
            className="rounded-lg border border-border/40 bg-background p-4 shadow-2xl backdrop-blur"
            style={{ height: "343px", width: "640px" }}
          >
            <div className="flex flex-col space-y-2">
              <div className="flex items-center border-b pb-4">
                <div className="h-9 w-full rounded-md bg-muted animate-pulse"></div>
              </div>
              <div className="pt-2">
                <div className="text-sm font-medium animate-pulse bg-muted h-5 w-24 rounded mb-2"></div>
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2">
                      <div className="h-4 w-4 rounded-full bg-muted animate-pulse"></div>
                      <div className="flex-1 h-4 bg-muted animate-pulse rounded"></div>
                      <div className="w-10 h-4 bg-muted animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }
      >
        <ProjectCommandContent onClose={onClose} />
      </Suspense>
    </div>
  );
}

"use client";

import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "~/components/ui/command";
import { Globe, Code, Server, Component, Layout } from "lucide-react";
import { trpc } from "~/lib/trpc";
import { useChatStore } from "./chat-store";

const ProjectCommandContent = ({ onClose }: { onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const { iframe } = useChatStore();
  
  const [projects, projectsQuery] = trpc.daemon.getProjects.useSuspenseQuery(
    undefined,
    {
      refetchInterval: 5000,
    }
  );

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

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  const defaultProject = {
    name: "Default",
    port: 4200
  };

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
          <CommandItem
            value="Default"
            className="flex items-center gap-2 px-4 py-2"
            onSelect={() => {
              iframe.actions.setInspectorState({
                url: `http://localhost:4200`,
              });
              onClose();
            }}
          >
            <Globe className="h-4 w-4 opacity-70" />
            <span className="flex-1">Default</span>
            <span className="text-xs text-muted-foreground">:4200</span>
          </CommandItem>
          {filteredProjects.map((project) => (
            <CommandItem
              key={project.pid}
              value={project.name}
              className="flex items-center gap-2 px-4 py-2"
              onSelect={() => {
                iframe.actions.setInspectorState({
                  url: `http://localhost:${project.port}`,
                });
                onClose();
              }}
            >
              {/* {getIcon(project.type)} */}
              <span className="flex-1">{project.name}</span>
              <span className="text-xs text-muted-foreground">:{project.port}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export function ProjectCommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
    <div className="fixed inset-x-0 top-4 z-50 mx-auto w-[640px]" onClick={(e) => e.stopPropagation()}>
      <Suspense fallback={
        <div className="rounded-lg border border-border/40 bg-background p-4 shadow-2xl backdrop-blur" style={{ height: "343px", width: "640px" }}>
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
      }>
        <ProjectCommandContent onClose={onClose} />
      </Suspense>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "~/components/ui/command";
import { Globe, Code, Server, Component, Layout } from "lucide-react";

interface Project {
  id: string;
  name: string;
  type: "react" | "next" | "vue" | "svelte" | "astro";
  port: number;
}

const mockProjects: Project[] = [
  { id: "1", name: "marketing-site", type: "next", port: 3000 },
  { id: "2", name: "admin-dashboard", type: "react", port: 3001 },
  { id: "3", name: "blog-platform", type: "astro", port: 3002 },
  { id: "4", name: "e-commerce", type: "vue", port: 3003 },
  { id: "5", name: "documentation", type: "svelte", port: 3004 },
  { id: "6", name: "landing-page", type: "next", port: 3005 },
  { id: "7", name: "analytics-app", type: "react", port: 3006 },
  { id: "8", name: "design-system", type: "vue", port: 3007 },
];

export function ProjectCommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");

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

  const getIcon = (type: Project["type"]) => {
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
    }
  };

  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-x-0 top-4 z-50 mx-auto w-[640px]">
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
                key={project.id}
                value={project.name}
                className="flex items-center gap-2 px-4 py-2"
                onSelect={() => {
                  console.log(`Selected project: ${project.name}`);
                  onClose();
                }}
              >
                {getIcon(project.type)}
                <span className="flex-1">{project.name}</span>
                <span className="text-xs text-muted-foreground">:{project.port}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
} 
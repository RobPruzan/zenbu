import React from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  ChevronRight,
  Globe,
  X,
  Folder,
  Code,
  Package,
  FileJson,
  Server,
  Component,
  Layout,
  Palette,
  FileCode,
  Settings,
  Database,
  FolderPlus,
  Filter,
  PanelLeft,
  Plus,
  Loader2,
  Trash,
  Ellipsis,
} from "lucide-react";

import { useChatStore } from "../chat-store";
import { trpc } from "src/lib/trpc";
import { cn } from "src/lib/utils";
import { Button } from "../ui/button";

interface WebsiteNode {
  id: string;
  title: string;
  url?: string;
  type?: "react" | "next" | "vue" | "svelte" | "astro";
  port?: number;
  children?: WebsiteNode[];
}

const generateMockProjects = (n: number): WebsiteNode[] => {
  const frameworks = ["react", "next", "vue", "svelte", "astro"] as const;
  const projectTypes = [
    "Dashboard",
    "Portfolio",
    "E-commerce",
    "Blog",
    "SaaS",
    "Landing Page",
    "Admin Panel",
    "Documentation",
    "Marketing Site",
  ];

  const generateId = () => Math.random().toString(36).substr(2, 9);
  const randomPort = () => Math.floor(Math.random() * 1000) + 3000;
  const pickRandom = <T,>(arr: T[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  const generateChildren = (depth: number = 0): WebsiteNode[] | undefined => {
    if (depth > 2) return undefined;

    const numChildren = Math.floor(Math.random() * 4);
    if (numChildren === 0) return undefined;

    return Array.from({ length: numChildren }).map(() => ({
      id: generateId(),
      title: pickRandom([
        "components",
        "pages",
        "layouts",
        "styles",
        "api",
        "utils",
        "hooks",
        "lib",
        "config",
        "assets",
      ]),
      children: generateChildren(depth + 1),
    }));
  };

  return Array.from({ length: n }).map(() => {
    const framework = pickRandom(frameworks);
    const projectType = pickRandom(projectTypes);
    const projectName = `${projectType.toLowerCase().replace(/\s+/g, "-")}`;

    return {
      id: generateId(),
      title: projectName,
      type: framework,
      port: randomPort(),
      url: `http://localhost:\${port}`,
      children: [
        {
          id: generateId(),
          title: "src",
          children: generateChildren(0),
        },
        {
          id: generateId(),
          title: "public",
          children: [
            {
              id: generateId(),
              title: "assets",
            },
          ],
        },
        {
          id: generateId(),
          title:
            framework === "next"
              ? "next.config.js"
              : framework === "astro"
                ? "astro.config.mjs"
                : "vite.config.ts",
        },
        {
          id: generateId(),
          title: "package.json",
        },
      ],
    };
  });
};

interface TreeNodeProps {
  node: WebsiteNode;
  level?: number;
  onSelect?: (url: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level = 0, onSelect }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleClick = () => {
    if (node.children?.length) {
      setIsExpanded(!isExpanded);
    } else if (node.url && onSelect) {
      onSelect(node.url);
    }
  };

  const getIcon = () => {
    if (node.type) {
      switch (node.type) {
        case "react":
          return <Code className="h-3 w-3 mr-1 text-blue-400" />;
        case "next":
          return <Server className="h-3 w-3 mr-1 text-slate-200" />;
        case "vue":
          return <Component className="h-3 w-3 mr-1 text-green-400" />;
        case "svelte":
          return <Layout className="h-3 w-3 mr-1 text-orange-400" />;
        case "astro":
          return <Globe className="h-3 w-3 mr-1 text-purple-400" />;
      }
    }

    if (node.children?.length) {
      return <Folder className="h-3 w-3 mr-1 opacity-70" />;
    }

    // File icons based on name
    if (node.title.endsWith(".json"))
      return <FileJson className="h-3 w-3 mr-1 text-yellow-300" />;
    if (node.title.endsWith(".ts") || node.title.endsWith(".js"))
      return <FileCode className="h-3 w-3 mr-1 text-blue-300" />;
    if (node.title === "styles")
      return <Palette className="h-3 w-3 mr-1 text-pink-400" />;
    if (node.title === "config")
      return <Settings className="h-3 w-3 mr-1 text-gray-400" />;
    if (node.title === "api")
      return <Server className="h-3 w-3 mr-1 text-green-400" />;
    if (node.title === "database" || node.title === "db")
      return <Database className="h-3 w-3 mr-1 text-blue-400" />;

    return <Globe className="h-3 w-3 mr-1 opacity-70" />;
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 text-sm text-muted-foreground transition-colors duration-100",
          "hover:bg-muted/20 hover:text-foreground active:bg-muted/50",
          "rounded-sm cursor-pointer",
          node.url && "hover:underline",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.children?.length ? (
          <ChevronRight
            className={cn(
              "h-3 w-3 mr-1 transition-transform duration-150",
              isExpanded && "transform rotate-90",
            )}
          />
        ) : null}
        {getIcon()}
        <span className="truncate">{node.title}</span>
        {node.port && (
          <span className="ml-2 text-xs opacity-50">:{node.port}</span>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface WebsiteTreeProps {
  onClose: () => void;
  onSelect?: (url: string) => void;
}

export const WebsiteTree: React.FC<WebsiteTreeProps> = ({
  onClose,
  onSelect,
}) => {
  // we should have the concept of dead projects and alive projects, but always showing all the projects that exist
  const [projects, projectsQuery] = trpc.daemon.getProjects.useSuspenseQuery(
    undefined,
    {
      refetchInterval: 5000,
    },
  );

  const { iframe } = useChatStore();
  const utils = trpc.useUtils();
  const createProjectMutation = trpc.daemon.createProject.useMutation({
    meta: { noInvalidate: true },
    onSuccess: (result) => {
      const existing = utils.daemon.getProjects.getData();
      utils.daemon.getProjects.setData(
        undefined,
        existing ? [...existing, result] : [result],
      );

      // projectsQuery.refetch();
      iframe.actions.setInspectorState({
        url: `http://localhost:${result.port}`,
      });
    },
  });

  const deleteProjectMutation = trpc.daemon.deleteProject.useMutation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border/40 px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-sm hover:bg-muted/20"
          onClick={
            () => {
              createProjectMutation.mutate();
            }

            // window.dispatchEvent(new Event("toggle-website-tree-refresh"))
          }
        >
          {/* <Globe className="h-3.5 w-3.5" /> */}

          {createProjectMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-sm hover:bg-muted/20"
          onClick={() =>
            window.dispatchEvent(new Event("toggle-website-tree-filter"))
          }
        >
          <Filter className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-sm hover:bg-muted/20"
          onClick={onClose}
        >
          <PanelLeft />
        </Button>
      </div>

      {/* WHAT ,oh they were all h-full so they just overlowed and it only cacled the size of one??*/}
      <div className="overflow-y-auto px-2 py-2 h-full">
        {/* {mockData.map((node) => (
          <TreeNode key={node.id} node={node} onSelect={onSelect} />
        ))} */}

        <div className="flex items-center h-8">
          <Button
            variant={"ghost"}
            className={cn([
              "group flex items-center w-full px-2 py-0 text-xs justify-start h-full",
              `http://localhost:4200` === iframe.state.url &&
                "bg-muted/30 hover:bg-muted/60",
            ])}
            onClick={() => {
              // some store set that determines the project url
              iframe.actions.setInspectorState({
                url: `http://localhost:4200`,
              });
              onSelect?.(`http://localhost:4200`);
            }}
          >
            <div className="w-3/5 flex justify-start"> Default</div>
            <div className="w-2/5 flex justify-end">4200</div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-sm px-0 py-0 h-fit w-fit p-1 [&_svg]:size-auto [&_svg]:shrink-1 flex justify-center items-center"
            // onClick={() => {
            //   deleteProjectMutation.mutate({
            //     name: project.name,
            //   });
            // }}
          >
            <Ellipsis size={14} />
          </Button>
        </div>
        {projects.toReversed().map((project) => (
          <div key={project.pid} className="flex items-center h-8 gap-y-1">
            <Button
              key={project.pid}
              variant={"ghost"}
              className={cn([
                "group flex items-center w-[calc(100%-24px)] px-2 py-0 text-xs justify-start h-full",
                `http://localhost:${project.port}` === iframe.state.url &&
                  "bg-muted/50 hover:bg-muted/60",
              ])}
              onClick={() => {
                // some store set that determines the project url
                iframe.actions.setInspectorState({
                  url: `http://localhost:${project.port}`,
                });
                onSelect?.(`http://localhost:${project.port}`);
              }}
            >
              <div className="w-3/5 flex justify-start"> {project.name}</div>
              <div className="w-2/5 flex justify-end">{project.port}</div>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-sm px-0 py-0 h-fit w-fit p-1 [&_svg]:size-auto [&_svg]:shrink-1 flex justify-center items-center"
              onClick={() => {
                deleteProjectMutation.mutate({
                  name: project.name,
                });
              }}
            >
              {deleteProjectMutation.isPending &&
              deleteProjectMutation.variables.name === project.name ? (
                <Loader2 size={14} />
              ) : (
                <Trash size={14} />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

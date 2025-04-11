"use client";

import { ChevronRight, ChevronDown, Component, Box, Layers, Search, RefreshCcw, Filter, Maximize2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { ReactComponentData, mockComponentTree } from "./mock-data";

interface ReactTreeProps {
  onClose: () => void;
}

export function ReactTree({ onClose }: ReactTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const renderComponentDetails = (component: ReactComponentData) => {
    if (!component.props && !component.state && !component.context) return null;

    return (
      <div className="ml-6 mt-1 space-y-2 border-l-2 border-border/40 pl-2 text-xs">
        {component.props && Object.keys(component.props).length > 0 && (
          <div className="space-y-1">
            <div className="font-medium text-purple-400">Props</div>
            <pre className="text-muted-foreground">{JSON.stringify(component.props, null, 2)}</pre>
          </div>
        )}
        {component.state && Object.keys(component.state).length > 0 && (
          <div className="space-y-1">
            <div className="font-medium text-blue-400">State</div>
            <pre className="text-muted-foreground">{JSON.stringify(component.state, null, 2)}</pre>
          </div>
        )}
        {component.context && Object.keys(component.context).length > 0 && (
          <div className="space-y-1">
            <div className="font-medium text-green-400">Context</div>
            <pre className="text-muted-foreground">{JSON.stringify(component.context, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  const renderNode = (node: ReactComponentData, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const showDetails = isSelected && (node.props || node.state || node.context);

    if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      if (!hasChildren) return null;
      const filteredChildren = node.children?.map(child => renderNode(child, depth + 1)).filter(Boolean);
      if (!filteredChildren?.length) return null;
      return <>{filteredChildren}</>;
    }

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1",
            isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
            "cursor-pointer text-sm"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setSelectedNode(node.id)}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-background/50"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-4" />}
          {node.type === "component" ? (
            <Component className="h-3 w-3 text-purple-400" />
          ) : node.type === "element" ? (
            <Box className="h-3 w-3 text-blue-400" />
          ) : (
            <Layers className="h-3 w-3 text-green-400" />
          )}
          <span className={cn(node.type === "element" && "text-muted-foreground")}>
            {node.name}
          </span>
        </div>
        {showDetails && renderComponentDetails(node)}
        {isExpanded && node.children && (
          <div className="py-1">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/40 px-2 py-1.5">
        <div className="relative flex w-full items-center gap-1.5">
          <Search className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search components..."
            className="h-7 w-full rounded bg-accent/50 pl-8 pr-2 text-xs focus:bg-accent focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSearchTerm("")}>
            <RefreshCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Filter className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {mockComponentTree.map((node) => renderNode(node))}
      </div>
    </div>
  );
} 
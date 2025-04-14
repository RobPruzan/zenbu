"use client";

import {
  Send,
  Save,
  Play,
  ChevronDown,
  ArrowLeft,
  Copy,
  Code,
  Eye,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "src/lib/utils";
import { useState } from "react";

interface Tab {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
}

export function HttpClient({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<string>("1");
  const [tabs] = useState<Tab[]>([
    {
      id: "1",
      name: "Get Users",
      method: "GET",
      url: "https://api.example.com/users",
    },
    {
      id: "2",
      name: "Create User",
      method: "POST",
      url: "https://api.example.com/users",
    },
    {
      id: "3",
      name: "Update Profile",
      method: "PUT",
      url: "https://api.example.com/users/1",
    },
  ]);

  const [selectedMethod, setSelectedMethod] = useState<Tab["method"]>("GET");
  const [showResponse, setShowResponse] = useState(true);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">HTTP Client</div>
      </div>

      <div className="flex flex-1">
        {/* Left sidebar */}
        <div className="w-[240px] border-r border-border/40 flex flex-col">
          <div className="p-3 border-b border-border/40">
            <Button className="w-full justify-start gap-2 text-xs" size="sm">
              <Save className="h-3.5 w-3.5" />
              New Request
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-xs",
                  "flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "text-[10px] font-medium px-1.5 rounded",
                    tab.method === "GET" && "bg-blue-500/20 text-blue-500",
                    tab.method === "POST" && "bg-green-500/20 text-green-500",
                    tab.method === "PUT" && "bg-yellow-500/20 text-yellow-500",
                    tab.method === "DELETE" && "bg-red-500/20 text-red-500",
                    tab.method === "PATCH" &&
                      "bg-purple-500/20 text-purple-500",
                  )}
                >
                  {tab.method}
                </div>
                <span className="truncate">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Request section */}
          <div className="border-b border-border/40 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 gap-2 text-xs font-medium rounded-r-none",
                    "border border-r-0 border-border/40",
                  )}
                >
                  {selectedMethod}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <input
                  type="text"
                  placeholder="Enter request URL"
                  className={cn(
                    "h-8 px-3 text-xs bg-transparent",
                    "border border-border/40 rounded-r-md",
                    "focus:outline-none focus:ring-1 focus:ring-accent",
                    "flex-1 min-w-[400px]",
                  )}
                  defaultValue="https://api.example.com/users"
                />
              </div>
              <Button size="sm" className="h-8 px-4 gap-2 text-xs">
                <Send className="h-3.5 w-3.5" />
                Send
              </Button>
            </div>

            <div className="flex gap-2 text-xs">
              <button
                className={cn(
                  "px-3 py-1 rounded-md",
                  "hover:bg-accent/50",
                  !showResponse && "bg-accent",
                )}
              >
                Body
              </button>
              <button
                className={cn("px-3 py-1 rounded-md", "hover:bg-accent/50")}
              >
                Auth
              </button>
              <button
                className={cn("px-3 py-1 rounded-md", "hover:bg-accent/50")}
              >
                Headers
              </button>
              <button
                className={cn("px-3 py-1 rounded-md", "hover:bg-accent/50")}
              >
                Query
              </button>
            </div>

            <div className="rounded-md border border-border/40 bg-accent/5 h-[120px] p-2">
              <pre className="text-xs font-mono text-muted-foreground">
                {`{
  "name": "John Doe",
  "email": "john@example.com"
}`}
              </pre>
            </div>
          </div>

          {/* Response section */}
          <div className="flex-1 flex flex-col">
            <div className="border-b border-border/40 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">200 OK</span>
                </div>
                <div className="text-muted-foreground">234 ms</div>
                <div className="text-muted-foreground">32.4 KB</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Code className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-3">
              <pre className="text-xs font-mono text-muted-foreground">
                {`{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "created_at": "2024-01-15T10:00:00Z"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user",
      "created_at": "2024-01-16T15:30:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "per_page": 10
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

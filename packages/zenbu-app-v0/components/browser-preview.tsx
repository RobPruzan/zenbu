"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  Plus,
  X,
  MousePointer,
  Terminal,
  Network,
  BarChart,
  Globe,
  MessageCircle,
  Code,
  Home,
  Search,
  Inspect,
  Activity,
  Loader,
  Monitor,
  PenTool,
  BookOpen,
  GitBranch,
  Split,
  Blocks,
  Sparkles,
  Braces,
  Puzzle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IFrameWrapper } from "@/app/iframe-wrapper";

interface Tab {
  id: string;
  url: string;
  title: string;
}

interface CommandOption {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  url?: string;
}

// List of websites known to work in iframes
const IFRAME_FRIENDLY_SITES = [
  "https://example.com",
  "https://hn.algolia.com",
  "https://codepen.io",
  "https://codesandbox.io",
  "https://jsfiddle.net",
];

export default function BrowserPreview() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: "https://algoviz.app", title: "Tracing Practice" },
    { id: "2", url: "zenbu/progress", title: "Progress" },
  ]);
  const [activeTabId, setActiveTabId] = useState("1"); // Default to Tracing Practice tab
  const [currentUrl, setCurrentUrl] = useState("https://algoviz.app");
  const [isLoading, setIsLoading] = useState(false);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [activeDevTool, setActiveDevTool] = useState<string | null>(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const commandMenuRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];

  // Command menu options
  const commandOptions: CommandOption[] = [
    {
      id: "current",
      icon: (
        <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
          <span className="text-white text-xs font-bold">v0</span>
        </div>
      ),
      title: "Zenbu Website Builder - v0 by Vercel",
      url: currentUrl,
    },
    {
      id: "t3app",
      icon: (
        <div className="w-6 h-6 flex items-center justify-center text-zinc-300">
          <Code className="w-4 h-4" />
        </div>
      ),
      title: "Create T3 App",
      subtitle: "localhost:3000",
      url: "http://localhost:3000",
    },
    {
      id: "buffalo",
      icon: (
        <div className="w-6 h-6 flex items-center justify-center text-zinc-300">
          <Home className="w-4 h-4" />
        </div>
      ),
      title: "Homepage - University at Buffalo",
      subtitle: "ublearns.buffalo.edu",
      url: "https://ublearns.buffalo.edu",
    },
    {
      id: "tracing",
      icon: (
        <div className="w-6 h-6 flex items-center justify-center text-zinc-300">
          <Search className="w-4 h-4" />
        </div>
      ),
      title: "UB Power - Instructing made easy.",
      subtitle: "tracing.cse.buffalo.edu",
      url: "https://algoviz.app",
    },
    {
      id: "contact",
      icon: (
        <div className="w-6 h-6 flex items-center justify-center text-zinc-300">
          <MessageCircle className="w-4 h-4" />
        </div>
      ),
      title: "Contact the Team",
      url: "zenbu/contact",
    },
  ];

  // Filter command options based on search
  const filteredOptions =
    commandSearch.trim() === ""
      ? commandOptions
      : commandOptions.filter(
          (option) =>
            option.title.toLowerCase().includes(commandSearch.toLowerCase()) ||
            (option.subtitle &&
              option.subtitle
                .toLowerCase()
                .includes(commandSearch.toLowerCase())) ||
            (option.url &&
              option.url.toLowerCase().includes(commandSearch.toLowerCase()))
        );

  useEffect(() => {
    if (activeTab) {
      setCurrentUrl(activeTab.url);
      setIframeError(null);
    }
  }, [activeTabId, activeTab]);

  // Focus the command input when the menu opens
  useEffect(() => {
    if (showCommandMenu && commandInputRef.current) {
      setTimeout(() => {
        commandInputRef.current?.focus();
        commandInputRef.current?.select(); // Select all text in the input
      }, 10);
    }
  }, [showCommandMenu]);

  // Handle clicks outside the command menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        commandMenuRef.current &&
        !commandMenuRef.current.contains(event.target as Node)
      ) {
        setShowCommandMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [commandMenuRef]);

  // Update the openCommandMenu function to set the command search to the current URL
  const openCommandMenu = () => {
    setShowCommandMenu(true);
    setCommandSearch(currentUrl);
  };

  const navigateToUrl = (url: string) => {
    setIsLoading(true);
    setIframeError(null);
    setShowCommandMenu(false);

    // Update the current tab's URL
    setTabs(
      tabs.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, url: url, title: getTabTitle(url) }
          : tab
      )
    );
    setCurrentUrl(url);

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If there's a search term, treat it as a URL or search
    if (commandSearch.trim()) {
      let url = commandSearch;

      // Add https:// if it's missing and not a zenbu command
      if (
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        !url.startsWith("zenbu/")
      ) {
        // Check if it looks like a URL
        if (url.includes(".") && !url.includes(" ")) {
          url = "https://" + url;
        } else {
          // Treat as a search query
          url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
        }
      }

      navigateToUrl(url);
    } else if (filteredOptions.length > 0) {
      // If no search but we have options, navigate to the first one
      navigateToUrl(filteredOptions[0].url || currentUrl);
    }
  };

  const selectCommandOption = (option: CommandOption) => {
    if (option.url) {
      navigateToUrl(option.url);
    }
  };

  const getTabTitle = (url: string) => {
    if (url.startsWith("zenbu/")) {
      return (
        url.split("/")[1].charAt(0).toUpperCase() + url.split("/")[1].slice(1)
      );
    }

    // Special case for the tracing practice site
    if (url.includes("tracing.cse.buffalo.edu/student/tracing/practice")) {
      return "Tracing Practice";
    }

    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const addNewTab = () => {
    const newTabId = String(Date.now());
    const newTab = {
      id: newTabId,
      url: "zenbu/showcase",
      title: "Zenbu Showcase",
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTabId);
    setCurrentUrl(newTab.url);
    setIframeError(null);
  };

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;

    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    // If we're closing the active tab, activate the first tab
    if (tabId === activeTabId) {
      setActiveTabId(newTabs[0].id);
      setCurrentUrl(newTabs[0].url);
      setIframeError(null);
    }
  };

  const handleIframeError = () => {
    setIframeError(
      "This website cannot be displayed in an iframe due to security restrictions."
    );
  };

  const toggleDevTool = (tool: string) => {
    if (activeDevTool === tool) {
      setActiveDevTool(null);
    } else {
      setActiveDevTool(tool);
    }
  };

  // Function to get favicon for a tab
  const getFavicon = (url: string) => {
    if (url.startsWith("zenbu/")) {
      // No favicon for zenbu tabs
      return null;
    }

    if (url.includes("tracing.cse.buffalo.edu")) {
      // Custom favicon for tracing practice
      return (
        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[8px] font-bold">T</span>
        </div>
      );
    }

    // Default favicon for other sites
    return (
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-zinc-400">
        <Globe className="w-3 h-3" />
      </div>
    );
  };

  // Function to open a new tab with the specified URL and focus it
  const openNewTab = (url: string) => {
    const newTabId = String(Date.now());
    const newTab = {
      id: newTabId,
      url: url,
      title: getTabTitle(url),
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTabId);
    setCurrentUrl(url);
    setIframeError(null);
  };

  // Update the renderContent function to check for localhost
  const renderContent = () => {
    // Determine if we're on localhost
    const isLocalhost =
      currentUrl.includes("localhost") ||
      currentUrl.startsWith("http://127.0.0.1");

    if (currentUrl.startsWith("zenbu/")) {
      if (currentUrl === "zenbu/showcase") {
        return (
          <div className="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Zenbu Development
            </h2>

            {/* Local Development Section */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                Available Development Servers
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4 bg-[#0d0d0d] border-zinc-800/50 hover:bg-[#0f0f0f]"
                  onClick={() => navigateToUrl("http://localhost:3000")}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="font-medium text-zinc-200">
                        Next.js App
                      </span>
                      <span className="text-xs text-zinc-500">
                        localhost:3000
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Main application server
                    </p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4 bg-[#0d0d0d] border-zinc-800/50 hover:bg-[#0f0f0f]"
                  onClick={() => navigateToUrl("http://localhost:3000")}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="font-medium text-zinc-200">
                        Vite Dev Server
                      </span>
                      <span className="text-xs text-zinc-500">
                        localhost:3000
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Component development environment
                    </p>
                  </div>
                </Button>
              </div>
            </div>

            {/* Quick Setup Section */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                Quick Setup
              </h3>
              <div className="bg-[#0d0d0d] rounded-lg border border-zinc-800/50 overflow-hidden">
                <div className="p-4">
                  <p className="text-xs text-zinc-400 mb-3">
                    Get started with Zenbu CLI:
                  </p>
                  <div className="bg-black/50 rounded-md p-3 font-mono text-xs">
                    <p className="text-zinc-300">npm create zenbu@latest</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tools & Features Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">
                Tools & Features
              </h3>
              <div className="bg-[#0d0d0d] rounded-xl border border-zinc-800/50 overflow-hidden">
                {/* Code Editor */}
                <div
                  className="flex items-center p-4 border-b border-zinc-800/50 hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                  onClick={() => openNewTab("zenbu/editor")}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mr-4">
                    <Code className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      Code Editor
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Advanced code editing with syntax highlighting and
                      intelligent completions
                    </p>
                  </div>
                </div>

                {/* Component Library */}
                <div
                  className="flex items-center p-4 border-b border-zinc-800/50 hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                  onClick={() => openNewTab("zenbu/components")}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mr-4">
                    <Blocks className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      Component Library
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Pre-built components and patterns for rapid development
                    </p>
                  </div>
                </div>

                {/* AI Assistant */}
                <div
                  className="flex items-center p-4 border-b border-zinc-800/50 hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                  onClick={() => openNewTab("zenbu/ai")}
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mr-4">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      AI Assistant
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Intelligent code suggestions and automated development
                      workflows
                    </p>
                  </div>
                </div>

                {/* Documentation */}
                <div
                  className="flex items-center p-4 border-b border-zinc-800/50 hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                  onClick={() => openNewTab("zenbu/docs")}
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mr-4">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      Documentation
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Comprehensive guides, API references, and examples
                    </p>
                  </div>
                </div>

                {/* Build Progress */}
                <div
                  className="flex items-center p-4 border-b border-zinc-800/50 hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                  onClick={() => openNewTab("zenbu/progress")}
                >
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 mr-4">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      Build Progress
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Monitor your project's build status and deployment
                      progress
                    </p>
                  </div>
                </div>

                {/* Settings */}
                <div
                  className="flex items-center p-4 border-b border-zinc-800/50 hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                  onClick={() => openNewTab("zenbu/settings")}
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-500/10 flex items-center justify-center text-zinc-400 mr-4">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      Settings
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Customize your development environment and project
                      configurations
                    </p>
                  </div>
                </div>

                {/* Git Integration */}
                <div
                  className="flex items-center p-4 border-b border-zinc-800/50 hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                  onClick={() => openNewTab("zenbu/git")}
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 mr-4">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      Git Integration
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Seamless version control with built-in Git tools and
                      workflows
                    </p>
                  </div>
                </div>

                {/* Canvas & Design */}
                <div
                  className="flex items-center p-4 hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                  onClick={() => openNewTab("zenbu/canvas")}
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 mr-4">
                    <PenTool className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-zinc-200 mb-1">
                      Canvas & Design
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Visual design tools for creating stunning user interfaces
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else if (currentUrl.startsWith("zenbu/progress")) {
        return (
          <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Model Progress</h2>
            <div className="space-y-4">
              <div className="bg-[#0d0d0d] p-4 rounded-md border border-zinc-900/70">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">
                  Current Task
                </h3>
                <p className="text-zinc-300">Building website structure...</p>
                <div className="mt-3 w-full bg-[#121212] rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
              <div className="bg-[#0d0d0d] p-4 rounded-md border border-zinc-900/70">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Log</h3>
                <div className="text-xs font-mono text-zinc-400 space-y-1">
                  <p>10:15:32 - Analyzing project requirements</p>
                  <p>10:15:45 - Creating component structure</p>
                  <p>10:16:02 - Implementing responsive layout</p>
                  <p>10:16:30 - Applying styling to components</p>
                  <p className="text-emerald-400">
                    10:17:05 - Building navigation system
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      } else if (currentUrl.startsWith("zenbu/contact")) {
        return (
          <div className="p-6 h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Contact the Team</h2>
            <div className="space-y-4">
              <div className="bg-[#0d0d0d] p-4 rounded-md border border-zinc-900/70">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">
                  Zenbu Support
                </h3>
                <p className="text-zinc-400 mb-2">
                  Have questions or feedback? Our team is here to help.
                </p>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-x-0.5 text-sm">
                    <MessageCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-zinc-300">support@zenbu.dev</span>
                  </div>
                  <div className="flex items-center gap-x-0.5 text-sm">
                    <Code className="h-4 w-4 text-emerald-500" />
                    <span className="text-zinc-300">github.com/zenbu-dev</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center justify-center h-full text-zinc-500 overflow-y-auto">
            <p>Unknown Zenbu command: {currentUrl}</p>
          </div>
        );
      }
    } else {
      // For regular URLs, render an iframe
      try {
        // Basic URL validation
        new URL(currentUrl);

        if (iframeError) {
          return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="text-amber-500 mb-4">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9V14M12 17.5V17.6M4.9 19.25H19.1C20.6 19.25 21.5 17.75 20.75 16.5L13.65 4.75C12.9 3.5 11.1 3.5 10.35 4.75L3.25 16.5C2.5 17.75 3.4 19.25 4.9 19.25Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-zinc-200 mb-2">
                Content Security Policy Restriction
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md">
                This website cannot be displayed in an iframe due to security
                restrictions. This is a security feature implemented by the
                website to prevent clickjacking attacks.
              </p>
              <div className="space-y-4 w-full max-w-md">
                <div className="bg-[#0d0d0d] p-4 rounded-md border border-zinc-900/70">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">
                    Try these iframe-friendly sites:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {IFRAME_FRIENDLY_SITES.map((site) => (
                      <Button
                        key={site}
                        variant="outline"
                        className="justify-start text-xs bg-[#121212] border-zinc-800 hover:bg-[#1a1a1a]"
                        onClick={() => navigateToUrl(site)}
                      >
                        {site}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0d0d0d] p-4 rounded-md border border-zinc-900/70">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">
                    For local development:
                  </h4>
                  <p className="text-xs text-zinc-400">
                    When connected to your local development server, you'll be
                    able to preview your own websites without these
                    restrictions.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="w-full h-full">
            <IFrameWrapper />
            {/* <iframe
              src={currentUrl}
              className="w-full h-full border-0"
              title={`Preview of ${currentUrl}`}
              sandbox="allow-same-origin allow-scripts allow-forms"
              loading="lazy"
              onError={handleIframeError}
              onLoad={() => {
                try {
                  const iframe = document.querySelector("iframe");
                  if (iframe && iframe.contentWindow) {
                    // If we can access contentWindow without error, it's probably loaded
                  }
                } catch (error) {
                  handleIframeError();
                }
              }}
            /> */}
          </div>
        );
      } catch (error) {
        return (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <p>Please enter a valid URL</p>
          </div>
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Browser chrome with modern Vercel-inspired design */}
      <div className="bg-[#0a0a0a]">
        {/* Tab bar that melds with URL bar */}
        <div className="flex items-end px-2 pt-2 relative">
          <div className="flex items-end gap-[1px] relative z-10">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const isZenbuTab = tab.url.startsWith("zenbu/");
              const favicon = getFavicon(tab.url);

              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                    group relative flex items-center gap-2 h-[32px] px-4
                    cursor-pointer select-none
                    transition-colors duration-150
                    ${
                      isActive
                        ? "bg-[#111111] text-white rounded-t-lg border-zinc-800 border-t border-l border-r"
                        : "text-zinc-400 hover:text-zinc-300 hover:bg-[#0c0c0c] rounded-t-lg"
                    }
                  `}
                  style={{
                    marginBottom: isActive ? "-1px" : "0",
                  }}
                >
                  {favicon}
                  <span
                    className={`
                    text-[13px] tracking-tight truncate max-w-[140px] 
                    ${isActive ? "text-zinc-200" : "text-zinc-400 group-hover:text-zinc-300"}
                  `}
                  >
                    {tab.title}
                  </span>
                  <button
                    className={`
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200
                      hover:bg-zinc-800/50 rounded-full
                      p-1 ml-1
                      ${isActive ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-300"}
                    `}
                    onClick={(e) => closeTab(tab.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            <button
              onClick={addNewTab}
              className="h-8 w-8 flex items-center justify-center rounded-md
                text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50
                transition-colors ml-1"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* URL bar that connects with active tab */}
        <div className="bg-[#111111] relative z-0 border-t border-zinc-800/50">
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              className={`
                w-8 h-8 flex items-center justify-center rounded-md
                text-zinc-400 hover:text-white hover:bg-white/5
                transition-colors
                ${isLoading ? "animate-spin text-white" : ""}
              `}
              onClick={() => navigateToUrl(currentUrl)}
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <button
              onClick={openCommandMenu}
              className="flex-1 h-9 px-3 bg-[#0a0a0a] hover:bg-[#0c0c0c]
                rounded-md text-left transition-colors relative group border border-border/10"
            >
              <div className="flex items-center gap-3">
                <div className="text-zinc-500 group-hover:text-zinc-400">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <span className="text-[13px] text-zinc-300 group-hover:text-white truncate font-medium tracking-tight">
                  {currentUrl}
                </span>
              </div>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-border/10"></div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 relative bg-[#111111]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-zinc-300"></div>
          </div>
        ) : null}
        {renderContent()}

        {/* Arc-style command menu */}
        {showCommandMenu && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-background/40 backdrop-blur-[2px]">
            <div
              ref={commandMenuRef}
              className="w-[600px] max-w-[90%] bg-[#0a0a0a] rounded-xl border border-zinc-800 shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleCommandSubmit}>
                <div className="p-2 border-b border-zinc-800/80">
                  <Input
                    ref={commandInputRef}
                    autoFocus
                    value={commandSearch}
                    onChange={(e) => setCommandSearch(e.target.value)}
                    placeholder="Search or enter web address..."
                    className="bg-[#0a0a0a] border-none h-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-zinc-500"
                  />
                </div>
              </form>
              <div className="max-h-[400px] overflow-y-auto">
                {filteredOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={`
                      flex items-center gap-3 p-3 cursor-pointer hover:bg-[#111111] transition-colors
                      ${index === 0 ? "bg-indigo-600/10" : ""}
                    `}
                    onClick={() => selectCommandOption(option)}
                  >
                    {option.icon}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium truncate ${index === 0 ? "text-white" : "text-zinc-300"}`}
                      >
                        {option.title}
                      </div>
                      {option.subtitle && (
                        <div className="text-xs text-zinc-500 truncate">
                          {option.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Only show toolbar for localhost connections and tracing practice site */}
      </div>
    </div>
  );
}

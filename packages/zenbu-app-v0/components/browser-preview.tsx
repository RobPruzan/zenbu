"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Tab {
  id: string
  url: string
  title: string
}

interface CommandOption {
  id: string
  icon: React.ReactNode
  title: string
  subtitle?: string
  url?: string
}

// List of websites known to work in iframes
const IFRAME_FRIENDLY_SITES = [
  "https://example.com",
  "https://hn.algolia.com",
  "https://codepen.io",
  "https://codesandbox.io",
  "https://jsfiddle.net",
]

export default function BrowserPreview() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", url: "https://tracing.cse.buffalo.edu/student/tracing/practice", title: "Tracing Practice" },
    { id: "2", url: "zenbu/progress", title: "Progress" },
  ])
  const [activeTabId, setActiveTabId] = useState("1") // Default to Tracing Practice tab
  const [currentUrl, setCurrentUrl] = useState("https://tracing.cse.buffalo.edu/student/tracing/practice")
  const [isLoading, setIsLoading] = useState(false)
  const [iframeError, setIframeError] = useState<string | null>(null)
  const [activeDevTool, setActiveDevTool] = useState<string | null>(null)
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandSearch, setCommandSearch] = useState("")
  const commandMenuRef = useRef<HTMLDivElement>(null)
  const commandInputRef = useRef<HTMLInputElement>(null)

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0]

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
      url: "https://tracing.cse.buffalo.edu/student/tracing/practice",
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
  ]

  // Filter command options based on search
  const filteredOptions =
    commandSearch.trim() === ""
      ? commandOptions
      : commandOptions.filter(
          (option) =>
            option.title.toLowerCase().includes(commandSearch.toLowerCase()) ||
            (option.subtitle && option.subtitle.toLowerCase().includes(commandSearch.toLowerCase())) ||
            (option.url && option.url.toLowerCase().includes(commandSearch.toLowerCase())),
        )

  useEffect(() => {
    if (activeTab) {
      setCurrentUrl(activeTab.url)
      setIframeError(null)
    }
  }, [activeTabId, activeTab])

  // Focus the command input when the menu opens
  useEffect(() => {
    if (showCommandMenu && commandInputRef.current) {
      setTimeout(() => {
        commandInputRef.current?.focus()
        commandInputRef.current?.select() // Select all text in the input
      }, 10)
    }
  }, [showCommandMenu])

  // Handle clicks outside the command menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (commandMenuRef.current && !commandMenuRef.current.contains(event.target as Node)) {
        setShowCommandMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [commandMenuRef])

  // Update the openCommandMenu function to set the command search to the current URL
  const openCommandMenu = () => {
    setShowCommandMenu(true)
    setCommandSearch(currentUrl)
  }

  const navigateToUrl = (url: string) => {
    setIsLoading(true)
    setIframeError(null)
    setShowCommandMenu(false)

    // Update the current tab's URL
    setTabs(tabs.map((tab) => (tab.id === activeTabId ? { ...tab, url: url, title: getTabTitle(url) } : tab)))
    setCurrentUrl(url)

    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // If there's a search term, treat it as a URL or search
    if (commandSearch.trim()) {
      let url = commandSearch

      // Add https:// if it's missing and not a zenbu command
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("zenbu/")) {
        // Check if it looks like a URL
        if (url.includes(".") && !url.includes(" ")) {
          url = "https://" + url
        } else {
          // Treat as a search query
          url = `https://www.google.com/search?q=${encodeURIComponent(url)}`
        }
      }

      navigateToUrl(url)
    } else if (filteredOptions.length > 0) {
      // If no search but we have options, navigate to the first one
      navigateToUrl(filteredOptions[0].url || currentUrl)
    }
  }

  const selectCommandOption = (option: CommandOption) => {
    if (option.url) {
      navigateToUrl(option.url)
    }
  }

  const getTabTitle = (url: string) => {
    if (url.startsWith("zenbu/")) {
      return url.split("/")[1].charAt(0).toUpperCase() + url.split("/")[1].slice(1)
    }

    // Special case for the tracing practice site
    if (url.includes("tracing.cse.buffalo.edu/student/tracing/practice")) {
      return "Tracing Practice"
    }

    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  const addNewTab = () => {
    const newTabId = String(Date.now())
    const newTab = { id: newTabId, url: "https://example.com", title: "Example" }
    setTabs([...tabs, newTab])
    setActiveTabId(newTabId)
    setCurrentUrl(newTab.url)
    setIframeError(null)
  }

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabs.length === 1) return

    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    setTabs(newTabs)

    // If we're closing the active tab, activate the first tab
    if (tabId === activeTabId) {
      setActiveTabId(newTabs[0].id)
      setCurrentUrl(newTabs[0].url)
      setIframeError(null)
    }
  }

  const handleIframeError = () => {
    setIframeError("This website cannot be displayed in an iframe due to security restrictions.")
  }

  const toggleDevTool = (tool: string) => {
    if (activeDevTool === tool) {
      setActiveDevTool(null)
    } else {
      setActiveDevTool(tool)
    }
  }

  // Function to get favicon for a tab
  const getFavicon = (url: string) => {
    if (url.startsWith("zenbu/")) {
      // No favicon for zenbu tabs
      return null
    }

    if (url.includes("tracing.cse.buffalo.edu")) {
      // Custom favicon for tracing practice
      return (
        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[8px] font-bold">T</span>
        </div>
      )
    }

    // Default favicon for other sites
    return (
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-zinc-400">
        <Globe className="w-3 h-3" />
      </div>
    )
  }

  // Update the renderContent function to check for localhost
  const renderContent = () => {
    // Determine if we're on localhost
    const isLocalhost = currentUrl.includes("localhost") || currentUrl.startsWith("http://127.0.0.1")

    if (currentUrl.startsWith("zenbu/")) {
      if (currentUrl.startsWith("zenbu/progress")) {
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Model Progress</h2>
            <div className="space-y-4">
              <div className="bg-[#0d0d0d] p-4 rounded-lg border border-zinc-900/70">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Current Task</h3>
                <p className="text-zinc-300">Building website structure...</p>
                <div className="mt-3 w-full bg-[#121212] rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
              <div className="bg-[#0d0d0d] p-4 rounded-lg border border-zinc-900/70">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">Log</h3>
                <div className="text-xs font-mono text-zinc-400 space-y-1">
                  <p>10:15:32 - Analyzing project requirements</p>
                  <p>10:15:45 - Creating component structure</p>
                  <p>10:16:02 - Implementing responsive layout</p>
                  <p>10:16:30 - Applying styling to components</p>
                  <p className="text-emerald-400">10:17:05 - Building navigation system</p>
                </div>
              </div>
            </div>
          </div>
        )
      } else if (currentUrl.startsWith("zenbu/contact")) {
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contact the Team</h2>
            <div className="space-y-4">
              <div className="bg-[#0d0d0d] p-4 rounded-lg border border-zinc-900/70">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Zenbu Support</h3>
                <p className="text-zinc-400 mb-2">Have questions or feedback? Our team is here to help.</p>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-zinc-300">support@zenbu.dev</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Code className="h-4 w-4 text-emerald-500" />
                    <span className="text-zinc-300">github.com/zenbu-dev</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <p>Unknown Zenbu command: {currentUrl}</p>
          </div>
        )
      }
    } else {
      // For regular URLs, render an iframe
      try {
        // Basic URL validation
        new URL(currentUrl)

        if (iframeError) {
          return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="text-amber-500 mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 9V14M12 17.5V17.6M4.9 19.25H19.1C20.6 19.25 21.5 17.75 20.75 16.5L13.65 4.75C12.9 3.5 11.1 3.5 10.35 4.75L3.25 16.5C2.5 17.75 3.4 19.25 4.9 19.25Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-zinc-200 mb-2">Content Security Policy Restriction</h3>
              <p className="text-zinc-400 mb-6 max-w-md">
                This website cannot be displayed in an iframe due to security restrictions. This is a security feature
                implemented by the website to prevent clickjacking attacks.
              </p>
              <div className="space-y-4 w-full max-w-md">
                <div className="bg-[#0d0d0d] p-4 rounded-lg border border-zinc-900/70">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Try these iframe-friendly sites:</h4>
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
                <div className="bg-[#0d0d0d] p-4 rounded-lg border border-zinc-900/70">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">For local development:</h4>
                  <p className="text-xs text-zinc-400">
                    When connected to your local development server, you'll be able to preview your own websites without
                    these restrictions.
                  </p>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div className="w-full h-full">
            <iframe
              src={currentUrl}
              className="w-full h-full border-0"
              title={`Preview of ${currentUrl}`}
              sandbox="allow-same-origin allow-scripts allow-forms"
              loading="lazy"
              onError={handleIframeError}
              onLoad={() => {
                try {
                  const iframe = document.querySelector("iframe")
                  if (iframe && iframe.contentWindow) {
                    // If we can access contentWindow without error, it's probably loaded
                  }
                } catch (error) {
                  handleIframeError()
                }
              }}
            />
          </div>
        )
      } catch (error) {
        return (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <p>Please enter a valid URL</p>
          </div>
        )
      }
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Browser chrome with very distinct tabs */}
      <div className="bg-[#0a0a0a]">
        {/* Tab bar with traditional browser tabs */}
        <div className="flex items-end h-10 px-1 relative">
          {/* Background line that tabs sit on */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-800 z-0"></div>

          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            const isZenbuTab = tab.url.startsWith("zenbu/")
            const favicon = getFavicon(tab.url)

            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                  group relative flex items-center gap-2 h-9 cursor-pointer mr-1
                  ${
                    isActive
                      ? "bg-[#111111] text-white z-10"
                      : "text-zinc-400 bg-[#080808] hover:bg-[#0c0c0c] hover:text-zinc-300"
                  }
                `}
                style={{
                  marginBottom: isActive ? "-1px" : "0",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  borderTop: isActive ? "1px solid #27272a" : "1px solid #18181b",
                  borderLeft: isActive ? "1px solid #27272a" : "1px solid #18181b",
                  borderRight: isActive ? "1px solid #27272a" : "1px solid #18181b",
                  paddingLeft: "12px",
                  paddingRight: "8px",
                }}
              >
                {/* Favicon or nothing for zenbu tabs */}
                {favicon}

                {/* Tab title - green for zenbu tabs */}
                <span className={`truncate text-sm font-medium max-w-[120px] ${isZenbuTab ? "text-emerald-500" : ""}`}>
                  {tab.title}
                </span>

                <button
                  className={`
                    opacity-0 group-hover:opacity-100 transition-opacity
                    w-5 h-5 flex items-center justify-center rounded-full
                    ${isActive ? "text-zinc-400 hover:text-white hover:bg-zinc-700" : "text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800"}
                  `}
                  onClick={(e) => closeTab(tab.id, e)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}

          <button
            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-300 rounded-md hover:bg-zinc-900 transition-colors ml-1"
            onClick={addNewTab}
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="flex-grow"></div>
        </div>

        {/* URL bar as a button instead of an input */}
        <div className="flex items-center gap-2 p-2 pb-3 bg-[#111111] border-b border-zinc-800 relative">
          <button
            className={`
              w-8 h-8 flex items-center justify-center rounded-full
              text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors
              ${isLoading ? "animate-spin text-zinc-300" : ""}
            `}
            onClick={() => navigateToUrl(currentUrl)}
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={openCommandMenu}
            className="flex-1 h-9 px-9 bg-[#0a0a0a] border border-zinc-800 rounded-md text-left text-sm text-zinc-300 hover:bg-[#0c0c0c] transition-colors relative"
          >
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-600">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span className="truncate block">{currentUrl}</span>
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 relative bg-[#080808]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-zinc-300"></div>
          </div>
        ) : null}
        {renderContent()}

        {/* Arc-style command menu */}
        {showCommandMenu && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 backdrop-blur-[2px]">
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
                      <div className={`text-sm font-medium truncate ${index === 0 ? "text-white" : "text-zinc-300"}`}>
                        {option.title}
                      </div>
                      {option.subtitle && <div className="text-xs text-zinc-500 truncate">{option.subtitle}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Only show toolbar for localhost connections and tracing practice site */}
        {(currentUrl.includes("localhost") ||
          currentUrl.startsWith("http://127.0.0.1") ||
          currentUrl.includes("tracing.cse.buffalo.edu/student/tracing/practice")) && (
          <TooltipProvider>
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm rounded-lg shadow-lg border border-zinc-800 flex items-center p-1 z-20">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`h-7 px-3 flex items-center justify-center rounded-md text-xs transition-colors ${activeDevTool === "selector" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"}`}
                    onClick={() => toggleDevTool("selector")}
                  >
                    <MousePointer className="h-3 w-3 mr-1.5" />
                    <span>Select</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>Element selector</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`h-7 px-3 flex items-center justify-center rounded-md text-xs transition-colors ${activeDevTool === "console" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"}`}
                    onClick={() => toggleDevTool("console")}
                  >
                    <Terminal className="h-3 w-3 mr-1.5" />
                    <span>Console</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>JavaScript console</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`h-7 px-3 flex items-center justify-center rounded-md text-xs transition-colors ${activeDevTool === "network" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"}`}
                    onClick={() => toggleDevTool("network")}
                  >
                    <Network className="h-3 w-3 mr-1.5" />
                    <span>Network</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>Network requests</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`h-7 px-3 flex items-center justify-center rounded-md text-xs transition-colors ${activeDevTool === "performance" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"}`}
                    onClick={() => toggleDevTool("performance")}
                  >
                    <BarChart className="h-3 w-3 mr-1.5" />
                    <span>Perf</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p>Performance metrics</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}


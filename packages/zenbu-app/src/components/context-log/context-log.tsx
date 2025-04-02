'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Virtuoso } from 'react-virtuoso'
import { CheckCircle, XCircle, AlertCircle, InfoIcon, Clock, Search, Filter, Download, RefreshCw, X, ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group'
import { ScrollArea } from '../../ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../ui/tooltip'
import { cn } from '../../lib/utils'

// Type definitions
export type LogLevel = 'info' | 'debug' | 'warn' | 'error' | 'trace'

export interface LogEntry {
  id: string
  timestamp: Date | string | number
  level: LogLevel
  message: string
  source?: string
  context?: Record<string, any>
  duration?: number
  tags?: string[]
}

interface ContextLogProps {
  entries: LogEntry[]
  title?: string
  maxHeight?: string | number
  onClear?: () => void
  onSearch?: (term: string) => void
  onFilterChange?: (filters: LogLevel[]) => void
}

interface JsonViewerProps {
  data: any
  initialExpanded?: boolean
  depth?: number
  path?: string
}

const levelColors: Record<LogLevel, { bg: string, text: string, icon: React.ReactNode }> = {
  error: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    icon: <XCircle size={16} />
  },
  warn: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    icon: <AlertCircle size={16} />
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    icon: <InfoIcon size={16} />
  },
  debug: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    icon: <CheckCircle size={16} />
  },
  trace: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    icon: <Clock size={16} />
  }
}

// A reusable styled button for the toolbar
const ToolbarButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
>(({ className, active, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-md p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      active && 'bg-accent text-accent-foreground',
      className
    )}
    {...props}
  >
    {children}
  </button>
))
ToolbarButton.displayName = 'ToolbarButton'

// JsonViewer Component with collapsible tree view
const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  initialExpanded = false,
  depth = 0,
  path = ''
}) => {
  const [expanded, setExpanded] = useState(initialExpanded || depth < 2)
  const isObject = data !== null && typeof data === 'object'
  const isArray = Array.isArray(data)
  const isEmpty = isObject && Object.keys(data).length === 0
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }
  
  const copyValue = (e: React.MouseEvent, value: any) => {
    e.stopPropagation()
    navigator.clipboard.writeText(
      typeof value === 'object' 
        ? JSON.stringify(value, null, 2) 
        : String(value)
    )
  }

  // Render a primitive value (string, number, boolean, null, undefined)
  if (!isObject) {
    const valueClass = cn(
      'px-1 rounded font-mono text-xs',
      typeof data === 'string' ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' :
      typeof data === 'number' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' :
      typeof data === 'boolean' ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' :
      'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400'
    )
    
    return (
      <div className="flex items-center gap-1">
        <span className={valueClass}>
          {data === null ? 'null' :
           data === undefined ? 'undefined' :
           typeof data === 'string' ? `"${data}"` :
           String(data)}
        </span>
        <button 
          onClick={(e) => copyValue(e, data)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <Copy size={12} />
        </button>
      </div>
    )
  }
  
  // Empty object or array
  if (isEmpty) {
    return (
      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-mono text-xs">
        {isArray ? '[]' : '{}'}
      </div>
    )
  }
  
  // Render a collapsible object or array
  return (
    <div className={`pl-${depth > 0 ? '4' : '0'}`}>
      <div 
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -ml-1 group"
        onClick={toggleExpand}
      >
        <span className="text-gray-500 dark:text-gray-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="font-mono text-xs text-gray-800 dark:text-gray-200">
          {isArray ? `Array(${Object.keys(data).length})` : `Object`}
        </span>
        {!expanded && (
          <span className="text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-[300px]">
            {isArray 
              ? `[${Object.values(data).map(v => typeof v === 'object' ? (Array.isArray(v) ? '[]' : '{}') : JSON.stringify(v)).join(', ')}]`
              : `{${Object.entries(data).map(([k, v]) => `${k}: ${typeof v === 'object' ? (Array.isArray(v) ? '[]' : '{}') : JSON.stringify(v)}`).join(', ')}}`
            }
          </span>
        )}
        <button 
          onClick={(e) => copyValue(e, data)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ml-auto"
        >
          <Copy size={12} />
        </button>
      </div>
      
      {expanded && (
        <div className="border-l border-gray-200 dark:border-gray-700 mt-1">
          {Object.entries(data).map(([key, value], index) => (
            <div key={`${path}.${key}`} className="flex py-1">
              <div className="flex items-baseline gap-2">
                <div className="min-w-[20px] text-right">
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-mono">
                    {isArray ? index : ''}
                  </span>
                </div>
                <div className="flex gap-1">
                  {!isArray && (
                    <span className="text-gray-800 dark:text-gray-200 font-mono text-xs">
                      {key}:
                    </span>
                  )}
                  <JsonViewer
                    data={value}
                    depth={depth + 1}
                    path={`${path}.${key}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Log entry component with expandable details
const LogEntryItem: React.FC<{
  entry: LogEntry
  index: number
  expandedEntries: Set<string>
  toggleExpand: (id: string) => void
}> = ({ entry, index, expandedEntries, toggleExpand }) => {
  const isExpanded = expandedEntries.has(entry.id)
  const levelInfo = levelColors[entry.level] || levelColors.info
  const hasContext = entry.context && Object.keys(entry.context).length > 0
  const formattedTime = typeof entry.timestamp === 'string' 
    ? entry.timestamp 
    : new Date(entry.timestamp).toLocaleTimeString()
  
  const copyEntry = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2))
  }
  
  return (
    <div 
      className={cn(
        'border-b border-gray-100 dark:border-gray-800 group transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/30',
        index % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50/50 dark:bg-gray-900/10'
      )}
    >
      {/* Header row - always visible */}
      <div 
        className="flex items-center py-1 px-2 cursor-pointer"
        onClick={() => toggleExpand(entry.id)}
      >
        <div className={cn("flex items-center justify-center p-1", levelInfo.bg)}>
          <span className={levelInfo.text}>{levelInfo.icon}</span>
        </div>
        
        <div className="flex items-center space-x-2 ml-2 text-xs text-gray-500 dark:text-gray-400 w-[110px] flex-shrink-0">
          <span>{formattedTime}</span>
        </div>
        
        {entry.source && (
          <div className="px-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs mx-2 flex-shrink-0">
            {entry.source}
          </div>
        )}
        
        <div className="flex-grow px-2 font-mono text-xs text-gray-800 dark:text-gray-200 truncate">
          {entry.message}
        </div>
        
        <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {entry.tags?.length > 0 && (
            <div className="flex gap-1">
              {entry.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-[9px] h-4 px-1">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          {entry.duration != null && (
            <Badge variant="outline" className="text-[9px] h-4 px-1 flex items-center gap-0.5">
              <Clock size={9} />
              {entry.duration}ms
            </Badge>
          )}
          
          <button 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={copyEntry}
          >
            <Copy size={12} />
          </button>
          
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="pl-8 pr-2 pb-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20">
          {hasContext && (
            <div className="mt-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Context:</div>
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2 overflow-auto max-h-[400px]">
                <JsonViewer data={entry.context} initialExpanded={true} />
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mt-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={copyEntry}
            >
              <Copy size={10} className="mr-1" />
              Copy JSON
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Main ContextLog component
export function ContextLog({
  entries,
  title = "Context Log",
  maxHeight = 600,
  onClear,
  onSearch,
  onFilterChange
}: ContextLogProps) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<LogLevel[]>([])
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const virtuosoRef = useRef<any>(null)
  
  const toggleExpand = useCallback((id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])
  
  // Apply filters
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Apply level filter
      if (activeFilters.length > 0 && !activeFilters.includes(entry.level)) {
        return false
      }
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const messageMatches = entry.message.toLowerCase().includes(searchLower)
        const sourceMatches = entry.source?.toLowerCase().includes(searchLower)
        const tagMatches = entry.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        const contextMatches = entry.context ? 
          JSON.stringify(entry.context).toLowerCase().includes(searchLower) : false
          
        return messageMatches || sourceMatches || tagMatches || contextMatches
      }
      
      return true
    })
  }, [entries, search, activeFilters])
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value
    setSearch(newSearch)
    onSearch?.(newSearch)
  }
  
  // Handle filter changes
  const handleFilterChange = (newFilters: string[]) => {
    const typedFilters = newFilters as LogLevel[]
    setActiveFilters(typedFilters)
    onFilterChange?.(typedFilters)
  }
  
  // Export logs as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
    
    const exportName = `context-logs-${new Date().toISOString()}.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportName)
    linkElement.click()
  }
  
  // Scroll to bottom when new logs arrive if auto-scroll is on
  useEffect(() => {
    if (isAutoScroll && entries.length > 0) {
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({ index: entries.length - 1, behavior: 'smooth' })
      }, 50)
    }
  }, [entries.length, isAutoScroll])
  
  return (
    <div className="flex flex-col border border-gray-200 dark:border-gray-800 rounded-md shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header with title and controls */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
        <div className="font-medium text-sm text-gray-700 dark:text-gray-300">
          {title} {filteredEntries.length > 0 && <span className="text-xs">({filteredEntries.length})</span>}
        </div>
        
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToolbarButton 
                  active={isAutoScroll} 
                  onClick={() => setIsAutoScroll(prev => !prev)}
                >
                  <RefreshCw size={14} className={cn("text-gray-600 dark:text-gray-400", isAutoScroll && "text-blue-500 dark:text-blue-400")} />
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent>
                {isAutoScroll ? 'Auto-scroll is on' : 'Auto-scroll is off'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToolbarButton onClick={handleExport}>
                  <Download size={14} className="text-gray-600 dark:text-gray-400" />
                </ToolbarButton>
              </TooltipTrigger>
              <TooltipContent>
                Export logs as JSON
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {onClear && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToolbarButton onClick={onClear}>
                    <X size={14} className="text-gray-600 dark:text-gray-400" />
                  </ToolbarButton>
                </TooltipTrigger>
                <TooltipContent>
                  Clear logs
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-2">
        <div className="relative flex-grow max-w-md">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={handleSearch}
            className="pl-8 h-8 text-sm"
          />
          {search && (
            <button
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setSearch('')
                onSearch?.('')
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
        
        <ToggleGroup 
          type="multiple" 
          value={activeFilters} 
          onValueChange={handleFilterChange}
          className="flex-wrap"
        >
          {Object.entries(levelColors).map(([level, { text, icon }]) => (
            <ToggleGroupItem 
              key={level} 
              value={level} 
              size="sm"
              className={cn("h-8 text-xs gap-1", activeFilters.includes(level as LogLevel) ? text : "")}
            >
              {React.cloneElement(icon as React.ReactElement, { size: 12 })}
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      
      {/* Log entries - virtualized for performance */}
      <div style={{ height: maxHeight, maxHeight }} className="overflow-hidden relative">
        {filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
            {search || activeFilters.length > 0 ? 'No matching log entries' : 'No log entries'}
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            style={{ height: '100%' }}
            data={filteredEntries}
            itemContent={(index, entry) => (
              <LogEntryItem
                key={entry.id}
                entry={entry}
                index={index}
                expandedEntries={expandedEntries}
                toggleExpand={toggleExpand}
              />
            )}
            followOutput={isAutoScroll ? 'smooth' : false}
          />
        )}
      </div>
    </div>
  )
}

// Simple hook for creating and managing log entries
export function useContextLog(initialEntries: LogEntry[] = []) {
  const [entries, setEntries] = useState<LogEntry[]>(initialEntries)
  const entryIdCounter = useRef(0)
  
  const addEntry = useCallback((entry: Omit<LogEntry, 'id'>) => {
    const id = `log-${Date.now()}-${entryIdCounter.current++}`
    setEntries(prev => [...prev, { ...entry, id }])
    return id
  }, [])
  
  const clearEntries = useCallback(() => {
    setEntries([])
  }, [])
  
  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id))
  }, [])
  
  return {
    entries,
    addEntry,
    clearEntries,
    removeEntry,
    log: useCallback((message: string, context?: Record<string, any>, tags?: string[]) => {
      return addEntry({
        timestamp: new Date(),
        level: 'info',
        message,
        context,
        tags
      })
    }, [addEntry]),
    debug: useCallback((message: string, context?: Record<string, any>, tags?: string[]) => {
      return addEntry({
        timestamp: new Date(),
        level: 'debug',
        message,
        context,
        tags
      })
    }, [addEntry]),
    warn: useCallback((message: string, context?: Record<string, any>, tags?: string[]) => {
      return addEntry({
        timestamp: new Date(),
        level: 'warn',
        message,
        context,
        tags
      })
    }, [addEntry]),
    error: useCallback((message: string, context?: Record<string, any>, tags?: string[]) => {
      return addEntry({
        timestamp: new Date(),
        level: 'error',
        message,
        context,
        tags
      })
    }, [addEntry]),
  }
} 
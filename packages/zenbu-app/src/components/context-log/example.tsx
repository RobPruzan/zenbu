'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '../../ui/button'
import { ContextLog, useContextLog, LogEntry } from './context-log'
import { PlusCircle } from 'lucide-react'

const generateRandomLog = (logger: ReturnType<typeof useContextLog>) => {
  const levels = ['info', 'debug', 'warn', 'error', 'trace'] as const
  const sources = ['backend', 'frontend', 'database', 'network', 'auth', 'system']
  const actions = ['request', 'response', 'process', 'initialize', 'connect', 'disconnect', 'validate', 'compute']
  const objects = ['user', 'session', 'data', 'record', 'document', 'config', 'state', 'component']
  const statuses = ['started', 'completed', 'failed', 'pending', 'timeout', 'invalid', 'unknown']
  
  // Random selection helpers
  const randomItem = <T extends any>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const randomBool = () => Math.random() > 0.5
  const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  
  // Pick a random level and source
  const level = randomItem(levels)
  const source = randomBool() ? randomItem(sources) : undefined
  
  // Generate a meaningful message
  const action = randomItem(actions)
  const object = randomItem(objects)
  const status = randomItem(statuses)
  const message = `${action.charAt(0).toUpperCase() + action.slice(1)} ${object} ${status}`
  
  // Add some random tags (50% chance)
  const tags = randomBool() ? [action, object, status].filter(() => randomBool()) : undefined
  
  // Add some random duration (70% chance)
  const duration = Math.random() < 0.7 ? randomNumber(1, 2000) : undefined
  
  // Generate context object (80% chance)
  let context: Record<string, any> | undefined = undefined
  if (Math.random() < 0.8) {
    context = {}
    
    // Add random properties
    if (randomBool()) context.id = `${object}_${randomNumber(1000, 9999)}`
    if (randomBool()) context.timestamp = new Date().toISOString()
    if (randomBool()) context.status = status
    
    // Add nested object (30% chance)
    if (Math.random() < 0.3) {
      context.details = {
        type: object,
        action: action,
        success: status !== 'failed' && status !== 'timeout' && status !== 'invalid',
        metadata: randomBool() ? {
          version: `v${randomNumber(1, 5)}.${randomNumber(0, 9)}.${randomNumber(0, 9)}`,
          environment: randomItem(['development', 'staging', 'production']),
        } : undefined
      }
    }
    
    // Add array (20% chance)
    if (Math.random() < 0.2) {
      const arrayLength = randomNumber(1, 5)
      context.items = Array.from({ length: arrayLength }, (_, i) => ({
        id: `item_${i + 1}`,
        value: randomNumber(1, 100),
        active: randomBool()
      }))
    }
  }
  
  // Add log entry using the appropriate level method
  switch (level) {
    case 'info':
      return logger.log(message, context, tags)
    case 'debug':
      return logger.debug(message, context, tags)
    case 'warn':
      return logger.warn(message, context, tags)
    case 'error':
      return logger.error(message, context, tags)
    case 'trace':
      return logger.addEntry({
        timestamp: new Date(),
        level: 'trace',
        message,
        context,
        tags,
        source,
        duration
      })
  }
}

// Sample predefined logs for the initial state
const sampleLogs: Omit<LogEntry, 'id'>[] = [
  {
    timestamp: new Date(Date.now() - 3600000),
    level: 'info',
    message: 'Application initialized',
    source: 'system',
    context: {
      version: '1.0.0',
      environment: 'development',
      config: {
        theme: 'dark',
        features: {
          experimental: true
        }
      }
    }
  },
  {
    timestamp: new Date(Date.now() - 3500000),
    level: 'debug',
    message: 'User configuration loaded',
    context: {
      userId: 'user_123',
      preferences: {
        language: 'en-US',
        notifications: true
      }
    },
    tags: ['config', 'user']
  },
  {
    timestamp: new Date(Date.now() - 3400000),
    level: 'info',
    message: 'User authenticated successfully',
    source: 'auth',
    duration: 145,
    context: {
      userId: 'user_123',
      method: 'password',
      sessionId: 'sess_abc123'
    },
    tags: ['auth', 'login']
  },
  {
    timestamp: new Date(Date.now() - 3300000),
    level: 'warn',
    message: 'API rate limit approaching',
    source: 'network',
    context: {
      endpoint: '/api/data',
      usagePercent: 85,
      resetTime: new Date(Date.now() + 900000).toISOString(),
      requestsRemaining: 15
    },
    tags: ['api', 'rate-limit']
  },
  {
    timestamp: new Date(Date.now() - 3200000),
    level: 'error',
    message: 'Database connection failed',
    source: 'database',
    duration: 1243,
    context: {
      connection: 'primary',
      error: {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      },
      attempts: 3
    },
    tags: ['database', 'connection', 'error']
  },
  {
    timestamp: new Date(Date.now() - 3100000),
    level: 'debug',
    message: 'Cache miss for user profile',
    source: 'backend',
    duration: 12,
    context: {
      userId: 'user_123',
      cacheKey: 'profile:user_123',
      fallbackMethod: 'database'
    }
  },
  {
    timestamp: new Date(Date.now() - 3000000),
    level: 'trace',
    message: 'Component render cycle',
    source: 'frontend',
    duration: 8,
    context: {
      component: 'UserProfile',
      renderTime: 8.42,
      props: {
        userId: 'user_123',
        showDetails: true
      }
    },
    tags: ['performance', 'render']
  }
]

export function ContextLogExample() {
  const logger = useContextLog()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamInterval, setStreamIntervalValue] = useState<NodeJS.Timeout | null>(null)
  
  // Add sample logs on mount
  useEffect(() => {
    // Add sample logs
    sampleLogs.forEach(log => {
      logger.addEntry(log)
    })
    
    return () => {
      // Clean up interval on unmount
      if (streamInterval) {
        clearInterval(streamInterval)
      }
    }
  }, [])
  
  // Toggle log streaming
  const toggleStreaming = () => {
    if (isStreaming) {
      if (streamInterval) {
        clearInterval(streamInterval)
        setStreamIntervalValue(null)
      }
    } else {
      const interval = setInterval(() => {
        generateRandomLog(logger)
      }, 1000)
      setStreamIntervalValue(interval)
    }
    setIsStreaming(!isStreaming)
  }
  
  // Add a single random log
  const addRandomLog = () => {
    generateRandomLog(logger)
  }
  
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Context Log Viewer</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={addRandomLog}
          >
            <PlusCircle size={14} className="mr-1" />
            Add Log
          </Button>
          <Button
            size="sm"
            variant={isStreaming ? "destructive" : "default"}
            onClick={toggleStreaming}
          >
            {isStreaming ? 'Stop Stream' : 'Start Stream'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={logger.clearEntries}
          >
            Clear Logs
          </Button>
        </div>
      </div>
      
      <ContextLog 
        entries={logger.entries}
        title="Application Logs"
        maxHeight={600}
        onClear={logger.clearEntries}
      />
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        <p>✨ Features:</p>
        <ul className="list-disc ml-5 mt-1 space-y-1">
          <li>Virtualized list for high-performance with thousands of logs</li>
          <li>Expandable JSON viewer for complex nested objects</li>
          <li>Advanced search across message, source, tags and context</li>
          <li>Filter by log level with toggle buttons</li>
          <li>Auto-scroll with the ability to pause</li>
          <li>Export logs to JSON file</li>
          <li>Copy individual log entries</li>
          <li>Syntax highlighting for different data types</li>
        </ul>
      </div>
    </div>
  )
} 
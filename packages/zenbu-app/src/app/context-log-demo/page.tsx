'use client'

import React, { useEffect, useState } from 'react'
import { ContextLogExample } from '../../components/context-log/example'
import { LogEntry, useContextLog } from '../../components/context-log/context-log'
import { Button } from '../../ui/button'
import { Loader2 } from 'lucide-react'

// Enhanced version that generates a ton of data
export default function ContextLogDemo() {
  const [isLoading, setIsLoading] = useState(true)
  const [logCount, setLogCount] = useState(0)
  const logger = useContextLog()
  
  // Generate logs with specific patterns to test search functionality
  const generateBatchLogs = (count: number) => {
    const startTime = Date.now()
    
    const levels = ['info', 'debug', 'warn', 'error', 'trace'] as const
    const sources = ['backend', 'frontend', 'database', 'network', 'auth', 'system']
    const actions = ['request', 'response', 'process', 'initialize', 'connect', 'disconnect', 'validate', 'compute']
    const objects = ['user', 'session', 'data', 'record', 'document', 'config', 'state', 'component']
    const statuses = ['started', 'completed', 'failed', 'pending', 'timeout', 'invalid', 'unknown']
    
    // Add logs in batches for better performance
    const batchSize = 100
    const totalBatches = Math.ceil(count / batchSize)
    
    // Add some logs with special searchable patterns
    const searchablePatterns = [
      { message: "CRITICAL SECURITY ALERT", level: 'error', source: 'security' },
      { message: "User authentication with special permissions", level: 'warn', source: 'auth' },
      { message: "Memory leak detected in component", level: 'error', source: 'frontend' },
      { message: "Performance bottleneck identified", level: 'warn', source: 'backend' },
      { message: "Unusual traffic pattern detected", level: 'warn', source: 'network' },
      { message: "Database query optimization needed", level: 'info', source: 'database' },
    ]
    
    // Helpers
    const randomItem = <T extends any>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
    const randomBool = () => Math.random() > 0.5
    const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    
    let generatedCount = 0
    const newEntries: Omit<LogEntry, 'id'>[] = []
    
    // Generate batches of logs
    for (let batch = 0; batch < totalBatches; batch++) {
      const batchEntries: Omit<LogEntry, 'id'>[] = []
      const currentBatchSize = Math.min(batchSize, count - generatedCount)
      
      for (let i = 0; i < currentBatchSize; i++) {
        // Every 50th log, add a special searchable pattern
        let entry: Omit<LogEntry, 'id'>
        
        if (i % 50 === 0 && generatedCount + i > 0) {
          const pattern = searchablePatterns[randomNumber(0, searchablePatterns.length - 1)]
          entry = {
            timestamp: new Date(startTime - randomNumber(0, 86400000)), // Random time within last 24h
            level: pattern.level as any,
            message: pattern.message,
            source: pattern.source,
            tags: ['searchable', 'pattern', `pattern-${randomNumber(1, 5)}`],
            context: {
              patternId: `pattern-${randomNumber(1000, 9999)}`,
              importance: 'high',
              details: {
                location: randomItem(['client', 'server', 'database', 'network']),
                affects: randomItem(['performance', 'security', 'reliability', 'functionality']),
                detectedAt: new Date().toISOString()
              }
            }
          }
        } else {
          // Generate normal random log
          const level = randomItem(levels)
          const source = randomBool() ? randomItem(sources) : undefined
          const action = randomItem(actions)
          const object = randomItem(objects)
          const status = randomItem(statuses)
          const message = `${action.charAt(0).toUpperCase() + action.slice(1)} ${object} ${status}`
          
          // Add random timestamp within the last 24 hours
          const timestamp = new Date(startTime - randomNumber(0, 86400000))
          
          // Add some random tags (30% chance)
          const tags = Math.random() < 0.3 ? [action, object, status].filter(() => randomBool()) : undefined
          
          // Add some random duration (40% chance)
          const duration = Math.random() < 0.4 ? randomNumber(1, 2000) : undefined
          
          // Generate context object (40% chance)
          let context: Record<string, any> | undefined = undefined
          if (Math.random() < 0.4) {
            context = {}
            
            if (randomBool()) context.id = `${object}_${randomNumber(1000, 9999)}`
            if (randomBool()) context.status = status
            
            // Add nested object (20% chance)
            if (Math.random() < 0.2) {
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
            
            // Add array (10% chance)
            if (Math.random() < 0.1) {
              const arrayLength = randomNumber(1, 5)
              context.items = Array.from({ length: arrayLength }, (_, i) => ({
                id: `item_${i + 1}`,
                value: randomNumber(1, 100),
                active: randomBool()
              }))
            }
          }
          
          entry = {
            timestamp,
            level,
            message,
            source,
            context,
            tags,
            duration
          }
        }
        
        batchEntries.push(entry)
        generatedCount++
      }
      
      // Add current batch to overall list
      newEntries.push(...batchEntries)
    }
    
    return newEntries
  }
  
  // Generate and add massive amount of logs on mount
  useEffect(() => {
    if (isLoading) {
      setTimeout(() => {
        // Generate 10,000 logs to test virtualization
        const entries = generateBatchLogs(10000)
        
        // Add logs in smaller batches for better UI responsiveness
        const batchSize = 500
        let processed = 0
        
        const processNextBatch = () => {
          const batch = entries.slice(processed, processed + batchSize)
          batch.forEach(entry => logger.addEntry(entry))
          processed += batch.length
          setLogCount(processed)
          
          if (processed < entries.length) {
            // Process next batch after small delay to keep UI responsive
            setTimeout(processNextBatch, 0)
          } else {
            setIsLoading(false)
          }
        }
        
        processNextBatch()
      }, 500) // Small initial delay for UI to render
    }
  }, [isLoading])
  
  const handleGenerateMore = () => {
    const moreEntries = generateBatchLogs(5000)
    moreEntries.forEach(entry => logger.addEntry(entry))
    setLogCount(prevCount => prevCount + 5000)
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Context Log Performance Demo</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Testing the context log component with thousands of entries to verify virtualization and performance
      </p>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <Loader2 size={40} className="animate-spin text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">Generating Log Data</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Creating {logCount.toLocaleString()} of 10,000 log entries...
          </p>
          <div className="w-full max-w-md h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-blue-500 transition-all duration-300 ease-out" 
              style={{ width: `${(logCount / 10000) * 100}%` }} 
            />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-md">
            <div className="font-medium text-yellow-800 dark:text-yellow-400 mb-1">Test Searchable Patterns</div>
            <p className="text-sm text-yellow-700 dark:text-yellow-500 mb-2">
              Try searching for these special terms to test search functionality:
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded">CRITICAL SECURITY</span>
              <span className="px-2 py-1 bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded">special permissions</span>
              <span className="px-2 py-1 bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded">Memory leak</span>
              <span className="px-2 py-1 bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded">Performance bottleneck</span>
              <span className="px-2 py-1 bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded">Unusual traffic</span>
              <span className="px-2 py-1 bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded">optimization</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-medium">
              Currently displaying <span className="font-bold text-blue-600 dark:text-blue-400">{logCount.toLocaleString()}</span> log entries
            </div>
            <Button onClick={handleGenerateMore}>Generate 5,000 More Logs</Button>
          </div>
          
          <ContextLog 
            entries={logger.entries}
            title="Performance Test Logs"
            maxHeight={700}
            onClear={() => {
              logger.clearEntries();
              setLogCount(0);
            }}
          />
          
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md border">
            <h3 className="font-medium mb-2">Performance Notes:</h3>
            <ul className="list-disc ml-5 space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <li>The log component uses virtualization to efficiently render thousands of rows</li>
              <li>Only visible rows are actually rendered in the DOM, regardless of how many logs are in the data</li>
              <li>Try scrolling quickly through the logs to test the rendering performance</li>
              <li>Search and filtering is optimized with memoization to maintain responsiveness</li>
              <li>Expanding log entries with complex nested objects should remain performant</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
} 
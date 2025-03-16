"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { SendIcon, PaperclipIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your website building assistant. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px" // Reset height
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px` // Max height of 120px
    }
  }, [input])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        role: "assistant",
        content: "I've received your request. I'll help you build your website!",
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)

    setInput("")

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                message.role === "user" ? "bg-[#121212] ml-8" : "bg-[#0d0d0d] mr-8 border border-zinc-900/70"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-zinc-900/70">
        <div className="relative rounded-xl bg-[#0d0d0d] border border-zinc-900/70">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full min-h-[40px] max-h-[120px] py-3 px-4 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-zinc-100 placeholder:text-zinc-500"
            style={{ paddingBottom: "40px" }} // Make room for the buttons
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-transparent"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-transparent"
            >
              <PaperclipIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              size="icon"
              className={`h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 ${!input.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!input.trim()}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import ChatInterface from "@/components/chat-interface"
import BrowserPreview from "@/components/browser-preview"

export default function Home() {
  return (
    <main className="flex h-screen bg-[#080808] text-zinc-100 overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        {/* Left side: Chat interface */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col border-r border-zinc-900/70">
            <div className="p-4 border-b border-zinc-900/70 flex items-center">
              <h1 className="text-xl font-semibold">
                <span className="text-emerald-500">Zenbu</span>
              </h1>
            </div>
            <ChatInterface />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right side: Browser preview */}
        <ResizablePanel defaultSize={60}>
          <BrowserPreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  )
}


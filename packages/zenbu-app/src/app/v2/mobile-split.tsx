import { useChatStore } from "src/components/chat-store";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "src/components/ui/resizable";
import { IFrameWrapper } from "../iframe-wrapper";
import { ScreenshotTool } from "../sunset/[projectName]/screenshot-tool";

export const WithMobileSplit = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // waida minute
  const mobileSplitActive = useChatStore(
    (state) => state.toolbar.state.mobileSplit.active,
  );
  if (!mobileSplitActive) {
    return children;
  }

  return (
    <div key={"mobile-split"} className="h-full w-full">
      {/* er how do i want to do this */}

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={70}>{children}</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={30}>
          {/* oh shit we're gonna have to pass if it's mobile or not to the iframe
       so it knows how to position 


       maybe this should handle rendering both? The iframe wrapper, instead of being
       a hoc

       i wonder if kyju could help with sync between the two? Surely?

       you can run hooks in both context

       could have a flush interaction buffer to apply (like session replay events)
       that the other iframe should apply. I mean it can technically just be ephemeral
       which means you don't need state
       but i guess colocated functionality here works better anyways, so that's
       good confirmation

       oh wait im retarded




        
        */}
          <div className="w-full h-full bg-[#111111] flex justify-center items-center">
            <div className="relative bg-black rounded-[2.5rem] p-2 shadow-2xl">
              <div className="bg-black rounded-[2.25rem] p-1">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  <div className="bg-[#f6f6f6] h-10 flex items-center justify-center relative">
                    <div className="absolute left-4 w-1 h-1 bg-black rounded-full"></div>
                    <div className="absolute left-6 w-1 h-1 bg-black rounded-full"></div>
                    <div className="absolute left-8 w-1 h-1 bg-black rounded-full"></div>
                    <div className="flex items-center bg-white rounded-full px-4 py-1 text-sm text-gray-600 min-w-[200px]">
                      <div className="w-4 h-4 mr-2 flex items-center justify-center">
                        <div className="w-3 h-3 border border-gray-400 rounded-sm"></div>
                      </div>
                      localhost:3000
                    </div>
                    <div className="absolute right-4 w-6 h-6 border border-gray-400 rounded flex items-center justify-center">
                      <div className="w-3 h-3 border-t border-r border-gray-400 transform rotate-45"></div>
                    </div>
                  </div>
                  <IFrameWrapper mobile>
                    <ScreenshotTool />
                  </IFrameWrapper>
                </div>
              </div>
              {/* <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-black rounded-full"></div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full"></div> */}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

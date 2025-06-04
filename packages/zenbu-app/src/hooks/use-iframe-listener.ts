import { useGetProject } from "src/app/[workspaceId]/hooks";
import { useChatStore } from "src/components/chat-store";
import { ParentToChildMessage } from "zenbu-devtools";

export const useIFrameMessenger = () => {
  // const url = useChatStore((state) => state.iframe.state.url);
  const { url } = useGetProject();
  const sendMessageToChild = (
    message: ParentToChildMessage,
    options?: Partial<{ mobile: true }>,
  ) => {
    const iframe = document.getElementById(
      options?.mobile ? "mobile-iframe" : "child-iframe",
    ) as HTMLIFrameElement | null;

    if (!iframe) {
      return; // idk
      throw new Error("invairant: must have child-iframe as preview");
    }

    if (!iframe || !iframe.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(message, "*");
  };

  return sendMessageToChild;
};

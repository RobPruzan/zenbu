import { useChatStore } from "src/components/chat-store";
import { ParentToChildMessage } from "zenbu-devtools";

export const useIFrameMessenger = () => {
  const url = useChatStore((state) => state.iframe.state.url);
  const sendMessageToChild = (message: ParentToChildMessage) => {
    const iframe = document.getElementById(
      "child-iframe",
    ) as HTMLIFrameElement | null;

    if (!iframe) {
      throw new Error("invairant: must have child-iframe as preview");
    }

    if (!iframe || !iframe.contentWindow) {
      return;
    }

    iframe.contentWindow.postMessage(message, url);
  };

  return sendMessageToChild;
};

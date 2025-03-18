import { ParentToChildMessage } from "zenbu-devtools";

export const useIFrameMessenger = () => {
  const sendMessageToChild = (message: ParentToChildMessage) => {

    const iframe = document.getElementById(
      "child-iframe"
    ) as HTMLIFrameElement | null;

    if (!iframe) {
      throw new Error("invairant: must have child-iframe as preview");
    }

    if (!iframe || !iframe.contentWindow) {

      return;
    }


    iframe.contentWindow.postMessage(message, "http://localhost:4200");
  };

  return sendMessageToChild;
};

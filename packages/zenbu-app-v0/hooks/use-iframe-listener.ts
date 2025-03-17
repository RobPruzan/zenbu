import { ParentToChildMessage } from "zenbu-devtools";

export const useIFrameMessenger = () => {
  const sendMessageToChild = (message: ParentToChildMessage) => {
    console.log("start");

    const iframe = document.getElementById(
      "child-iframe"
    ) as HTMLIFrameElement | null;

    if (!iframe) {
      throw new Error("invairant: must have child-iframe as preview");
    }

    if (!iframe || !iframe.contentWindow) {
      console.log("nipe", iframe, iframe?.contentWindow);

      return;
    }

    console.log("posting");

    iframe.contentWindow.postMessage(message, "http://localhost:4200");
  };

  return sendMessageToChild;
};

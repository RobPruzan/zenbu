import {
  MessageSquare,
  FileText,
  Smartphone,
  SplitSquareHorizontal,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useLayoutEffect } from "react";
import { useWS } from "src/app/ws";
import { useChatStore } from "src/components/chat-store";
import { CommandPalette } from "src/components/command-palette";
import { useIFrameMessenger } from "src/hooks/use-iframe-listener";
import { trpc } from "src/lib/trpc";
import { ChildToParentMessage } from "zenbu-devtools";
import { getCommandItems } from "./command-items";

interface CommandWrapperProps {
  onToggleChat: (position: "left" | "right") => void;
  onToggleWebsiteTree: (position: "left" | "right") => void;
}

export const CommandWrapper: React.FC<CommandWrapperProps> = ({
  onToggleChat,
  onToggleWebsiteTree,
}) => {
  const toolbarState = useChatStore((state) => state.toolbar);
  const inspector = useChatStore((state) => state.inspector);

  const createProjectMutation = trpc.daemon.createProject.useMutation({
    meta: {
      noInvalidate: true,
    },
  });
  const iframe = useChatStore((state) => state.iframe);
  const [projects] = trpc.daemon.getProjects.useSuspenseQuery();
  const project = projects.at(0);
  useLayoutEffect(() => {
    if (project && !iframe.state.url && project.status === "running") {
      iframe.actions.setState({
        url: `http://localhost:${project.port}`, // totally redundant
        project,
        // project: newProject,
      });
    }
  }, []);

  const utils = trpc.useUtils();

  const additionalCommands = [
    {
      id: "toggle-chat-left",
      shortcut: "Toggle Chat Left",
      icon: <MessageSquare className="h-5 w-5" />,
      onSelect: () => onToggleChat("left"),
    },
    {
      id: "toggle-chat-right",
      shortcut: "Toggle Chat Right",
      icon: <MessageSquare className="h-5 w-5" />,
      onSelect: () => onToggleChat("right"),
    },
    {
      id: "toggle-website-tree-left",
      shortcut: "Toggle Website Tree Left",
      icon: <FileText className="h-5 w-5" />,
      onSelect: () => onToggleWebsiteTree("left"),
    },
    {
      id: "toggle-mobile-split",
      shortcut: "Toggle Mobile Split",
      icon: <Smartphone className="h-5 w-5" />,
      onSelect: () => window.dispatchEvent(new Event("toggle-mobile-split")),
    },
    {
      id: "toggle-split",
      shortcut: "Toggle Split",
      icon: <SplitSquareHorizontal className="h-5 w-5" />,
      onSelect: () => window.dispatchEvent(new Event("toggle-split")),
    },
    {
      id: "toggle-website-tree-right",
      shortcut: "Toggle Website Tree Right",
      icon: <FileText className="h-5 w-5" />,
      onSelect: () => onToggleWebsiteTree("right"),
    },
  ];
  const context = useChatStore((state) => state.context);
  // fuck it
  const replay = useWS<any>({
    url: "http://localhost:6969",
    projectName: project?.name,
    onMessage: (message: { action: "video"; url: string }) => {
      if (message.action !== "video") {
        return;
      }

      navigator.clipboard.writeText(message.url);

      // Create a toast notification with a green check mark
      const toast = document.createElement("div");
      toast.style.position = "fixed";
      toast.style.bottom = "20px";
      toast.style.right = "20px";
      toast.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      toast.style.color = "#fff";
      toast.style.padding = "10px 15px";
      toast.style.borderRadius = "4px";
      toast.style.display = "flex";
      toast.style.alignItems = "center";
      toast.style.zIndex = "9999";
      toast.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
      toast.style.transition = "opacity 0.3s ease-in-out";
      toast.style.cursor = "pointer";

      const checkIcon = document.createElement("span");
      checkIcon.innerHTML = "✓";
      checkIcon.style.color = "#4ade80";
      checkIcon.style.marginRight = "8px";
      checkIcon.style.fontSize = "18px";

      const text = document.createElement("span");
      text.textContent = "Copied to clipboard";
      text.style.fontSize = "14px";

      toast.appendChild(checkIcon);
      toast.appendChild(text);

      toast.addEventListener("click", () => {
        window.open(message.url, "_blank");
      });

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 2000);

      console.log("replay message", message);
    },
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent<ChildToParentMessage>) => {
      switch (event.data.kind) {
        case "rrweb-event": {
          console.log("got event", event.data.event);

          replay.socket?.emit("message", {
            kind: "event",
            event: event.data.event,
          });
          return;
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [replay.socket]);
  // const devtoolsRequesct = useMakeRequest();
  const message = useIFrameMessenger();

  const items = [
    ...getCommandItems({
      onStartReplay: async () => {
        // replay.socket?.emit("message", {
        //   kind: "create-recording",
        // });

        const res = await message({
          kind: "start-recording",
          id: nanoid(),
          responsePossible: true,
        });

        console.log("yippy skippy start recording", res);
      },
      ...toolbarState,
      // onStartRecording: () => {

      // },
      onCreateReplay: () => {
        replay.socket?.emit("message", {
          kind: "create-recording",
        });
        /**
         * await get recording
         * await recording to mp4
         * that's it, i should have a replay preview component that polls for
         * callback status + with retry to determine state of video
         *
         * we will wait the upload on the model side too, just like chatgpt does
         * when I upload a photo and hit send, objectively the best UX, that
         * upload sometime takes long af lol
         *
         * i love ado
         *
         *
         */
      },
      inspector,
      createProjectLoading: false,
      onCreateProject: async () => {
        const newProject = await createProjectMutation.mutateAsync();
        utils.daemon.getProjects.setData(undefined, (prev) =>
          !prev ? [newProject] : [...prev, newProject],
        );
        utils.project.getEvents.prefetch({ projectName: newProject.name });

        const checkUrlReady = () => {
          const hiddenIframe = document.createElement("iframe");

          hiddenIframe.style.display = "none";
          hiddenIframe.src = `http://localhost:${newProject.port}`;

          hiddenIframe.onload = () => {
            setTimeout(() => {
              iframe.actions.setState({
                url: `http://localhost:${newProject.port}`,
                project: newProject,
              });
            }, 20);
            if (document.documentElement.contains(hiddenIframe)) {
              document.documentElement.removeChild(hiddenIframe);
            }
          };

          hiddenIframe.onerror = () => {
            if (document.documentElement.contains(hiddenIframe)) {
              document.documentElement.removeChild(hiddenIframe);
            }
            setTimeout(checkUrlReady, 10);
          };

          document.documentElement.appendChild(hiddenIframe);
        };

        checkUrlReady();

        // iframe.actions.setInspectorState({
        //   url: `http://localhost:${newProject.port}`,
        // });
      },
    }),
    ...additionalCommands,
  ];

  return <CommandPalette items={items} />;
};

import {
  useState,
  useRef,
  useEffect,
  SetStateAction,
  Dispatch,
  FormEventHandler,
} from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useWSContext } from "./chat";
import { useChatStore } from "../chat-store";
import { nanoid } from "nanoid";
import { z } from "zod";

import { ContextItem } from "../slices/context-slice";
import { iife } from "src/lib/utils";
import { ClientEvent } from "zenbu-redis";
import { trpc } from "src/lib/trpc";

interface MentionMenuProps {
  onSelect: (item: string) => void;
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  filteredItems: string[];
}

const MentionMenu = ({
  onSelect,
  selectedIndex,
  setSelectedIndex,
  filteredItems,
}: MentionMenuProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, setSelectedIndex]);

  return (
    <div className="w-full">
      {filteredItems.map((item, index) => (
        <div
          key={item}
          className={`flex items-center px-1 py-1.5 cursor-pointer ${
            index === selectedIndex
              ? "bg-[#1E1E22] text-white"
              : "text-[#A1A1A6] hover:text-white"
          }`}
          onClick={() => onSelect(item)}
        >
          <div className="w-6 h-6 rounded-full bg-[#1E1E22] flex items-center justify-center text-xs mr-2">
            {item[0]}
          </div>
          <span className="text-xs font-light">{item}</span>
        </div>
      ))}
    </div>
  );
};

export const ChatTextArea = () => {
  const items = ["react-scan", "console", "network", "localstorage"];
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const {
    state: { items: contextItems },
    actions,
  } = useChatStore((state) => state.context);
  const utils = trpc.useUtils();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [query, setQuery] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<string[]>(items);
  const chatInputRef = useRef<HTMLDivElement>(null);

  const { eventLog, inspector, chatControls, context, toolbar } =
    useChatStore();
  const { socket } = useWSContext();
  // there should be no sync this was dumb design by grok
  const syncSelectedItems = () => {};
  const handleInput = () => {
    const chatInput = chatInputRef.current;
    if (!chatInput) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowMenu(false);
      syncSelectedItems();
      return;
    }

    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      setShowMenu(false);
      syncSelectedItems();
      return;
    }

    const offset = range.startOffset;
    const textBeforeCursor = node.textContent?.slice(0, offset) || "";
    const atIndex = textBeforeCursor.lastIndexOf("@");

    let isMentionActive = false;
    let currentQuery = "";
    if (atIndex !== -1) {
      const queryText = textBeforeCursor.slice(atIndex + 1);
      if (!/\s/.test(queryText)) {
        isMentionActive = true;
        currentQuery = queryText;
      }
    }

    if (currentQuery !== query) {
      setQuery(currentQuery);
      setSelectedIndex(0);
    }

    const filtered = items.filter((item) =>
      item.toLowerCase().startsWith(currentQuery.toLowerCase()),
    );
    setFilteredItems(filtered);

    setShowMenu(isMentionActive && filtered.length > 0);

    syncSelectedItems();
  };
  const project = useChatStore((state) => state.iframe.state.project);
  const insertMention = (mention: string) => {
    const chatInput = chatInputRef.current;
    if (!chatInput) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const offset = range.startOffset;
        const text = node.textContent || "";
        const atIndex = text.slice(0, offset).lastIndexOf("@");
        if (atIndex !== -1) {
          node.textContent = text.slice(0, atIndex) + text.slice(offset);
          range.setStart(node, atIndex);
          range.setEnd(node, atIndex);
        }
      }
    }

    // setContextItems((prev) => [...prev, { kind: "react-scan", name: mention }]);
    // what? Why are we hard coding react scan
    actions.pushItem({
      kind: "react-scan",
      name: mention,
    });

    const mentionSpan = document.createElement("span");
    mentionSpan.className =
      "bg-[#2A2A30] text-white px-1.5 py-0.5 rounded-sm mention";
    mentionSpan.textContent = `@${mention}`;
    mentionSpan.contentEditable = "false";

    const spaceNode = document.createTextNode(" ");
    const range = selection?.getRangeAt(0);
    if (range) {
      range.insertNode(mentionSpan);
      mentionSpan.parentNode?.insertBefore(spaceNode, mentionSpan.nextSibling);
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.setEndAfter(spaceNode);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    } else {
      chatInput.appendChild(mentionSpan);
      chatInput.appendChild(spaceNode);
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.setEndAfter(spaceNode);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    }

    setShowMenu(false);
    syncSelectedItems();
  };

  const removeItem = (index: number) => {
    const newItems = contextItems.filter((_, i) => i !== index);

    const mentionSpans = chatInputRef.current?.querySelectorAll(".mention");

    if (mentionSpans && index < mentionSpans.length) {
      mentionSpans[index].remove();
    }

    actions.setItems(newItems);
    // wut
    syncSelectedItems();
  };

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        syncSelectedItems();
      }
    };

    document.addEventListener("keyup", handleKeyUp);
    return () => document.removeEventListener("keyup", handleKeyUp);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMenu(false);
        return;
      }

      if (showMenu && e.key === "Enter") {
        e.preventDefault();
        if (filteredItems.length > 0) {
          insertMention(filteredItems[selectedIndex]);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showMenu, selectedIndex, filteredItems]);

  return (
    <div className="w-full">
      {contextItems.length > 0 && (
        <div className="px-2 py-2 border-b  overflow-x-auto">
          <div className="flex items-center gap-2">
            {contextItems.map((item, index) =>
              iife(() => {
                switch (item.kind) {
                  case "video": {
                    return (
                      <div
                        key={index}
                        className="flex flex-col relative items-center gap-1 text-muted-foreground text-xs font-light border  px-1.5 py-1 rounded-md bg-accent/5"
                      >
                        <div className="flex gap-x-1 absolute -top-1 -right-1">
                          <button
                            onClick={() => removeItem(index)}
                            className="h-4 w-4 rounded-full bg-background border  hover:bg-accent/20 text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <video
                          src={`http://localhost:5001/video/${item.filePath}`}
                          className="h-[100px] min-w-[100px] object-cover rounded-sm"
                          width={100}
                          height={100}
                          controls
                        />
                      </div>
                    );
                  }
                  case "image": {
                    return (
                      <div
                        key={index}
                        className="flex flex-col relative items-center gap-1 text-muted-foreground text-xs font-light border  px-1.5 py-1 rounded-md bg-accent/5"
                      >
                        <div className="flex gap-x-1 absolute -top-1 -right-1">
                          <button
                            onClick={() => removeItem(index)}
                            className="h-4 w-4 rounded-full bg-background border  hover:bg-accent/20 text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <img
                          alt="Screenshot"
                          src={`http://localhost:5001/image/${item.filePath}`}
                          className="h-[100px] min-w-[100px] object-cover rounded-sm"
                          width={100}
                          height={100}
                        />
                      </div>
                    );
                  }
                  case "react-scan": {
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 text-muted-foreground text-xs font-light border  px-2 py-1 rounded-md bg-accent/5"
                      >
                        <span>{item.name}</span>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  }
                }
              }),
            )}
          </div>
        </div>
      )}
      {showMenu && (
        <MentionMenu
          onSelect={insertMention}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          filteredItems={filteredItems}
        />
      )}
      <div
        data-placeholder="Build anything..."
        ref={chatInputRef}
        contentEditable
        onPaste={async (e) => {
          // const text = e.clipboardData?.getData("text/plain") || "";
          const files = e.clipboardData?.files;

          if (files.length === 0) {
            return;
          }
          e.preventDefault();

          const fileDataArray = [];
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const reader = new FileReader();
              reader.onload = (event) => {
                const rawData = event.target?.result;
                console.log("File Raw Data:", {
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: rawData,
                });
              };
              reader.readAsArrayBuffer(file);
              fileDataArray.push(file);
            }
          }

          const formData = new FormData();

          const blob = new Blob([await fileDataArray[0].arrayBuffer()]);
          formData.append("image", blob);

          const res = await fetch("http://localhost:5001/upload", {
            body: formData,
            method: "POST",
          });

          const json = await res.json();

          const schema = z.object({
            success: z.literal(true),
            fileName: z.string(),
          });

          const data = schema.parse(json);

          // console.log("hi data", data);

          /**
           *
           * okay but i still need that local cache, do i just treat it like a content item?
           *
           * that would be nice if i knew how that worked lol
           *
           *
           * alr u just set the state
           *
           */
          actions.pushItem({
            kind: "image",
            filePath: data.fileName,
            name: nanoid(),
          });
          // setContextItems((prev) => [
          //   ...prev,
          //   {
          //     kind: "image",
          //     filePath: data.fileName,
          //     name: nanoid(),
          //   },
          // ]);

          // i guess we want to upload the image, and paste the result? i wonder how fast this is, do we even need an optimistic preview? If this is backed by a service it might be nice but i don't want to build an abstraction for a feature that doesn't exist yet

          // console.log("Clipboard Text Data:", text);
          console.log("Clipboard Files:", fileDataArray);
        }}
        className="w-full text-[13px] chat-input text-foreground caret-foreground font-light leading-relaxed min-h-[50px] pt-2.5 pl-3 pr-4 pb-2 focus:outline-none"
        onInput={handleInput}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.metaKey && !showMenu) {
            const target = e.target as HTMLDivElement;
            e.preventDefault();
            e.stopPropagation();

            const clientEvent: ClientEvent = {
              requestId: nanoid(),
              // context: [],
              context: contextItems
                .map((item) => {
                  switch (item.kind) {
                    case "image": {
                      return {
                        kind: "image" as const,
                        filePath: item.filePath,
                      };
                    }

                    case "video": {
                      return {
                        kind: "video" as const,
                        filePath: item.filePath,
                      };
                    }
                  }
                })
                .filter((item) => typeof item !== "undefined"),
              kind: "user-message",
              text: target.textContent ?? "",
              timestamp: Date.now(),
              id: nanoid(),
            };
            console.log("sending dis");

            actions.setItems([]);
            eventLog.actions.pushEvent(clientEvent);

            utils.project.getEvents.setData(
              { projectName: project.name },
              (prev) => (prev ? [...prev, clientEvent] : [clientEvent]),
            );
            socket.emit("message", {
              event: clientEvent,
              projectName: project.name,
            });
            target.textContent = "";
          }
        }}
      />
    </div>
  );
};

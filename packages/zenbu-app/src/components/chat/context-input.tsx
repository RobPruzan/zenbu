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
import { useChatStore } from "../chat-instance-context";
import { nanoid } from "nanoid";
import { ClientMessageEvent, ClientTaskEvent } from "zenbu-plugin/src/ws/ws";
import { z } from "zod";
import { iife } from "~/lib/utils";

// Props for the MentionMenu component
interface MentionMenuProps {
  onSelect: (item: string) => void;
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  filteredItems: string[];
}

type ContextItem =
  | {
      kind: "react-scan";
      // probably should be an id instead of name
      name: string;
    }
  | {
      kind: "image";
      name: string;
      filePath: string;
    };

// MentionMenu component with keyboard navigation (Arrow keys + Ctrl+N/P)
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

const ChatTextArea = () => {
  const items = ["react-scan", "console", "network", "localstorage"];
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [contextItems, setContextItems] = useState<ContextItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [query, setQuery] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<string[]>(items);
  const chatInputRef = useRef<HTMLDivElement>(null);

  const { eventLog, inspector, chatControls, context, toolbar } =
    useChatStore();
  const { socket } = useWSContext();

  // there should be no sync this was dumb design by grok
  const syncSelectedItems = () => {
    // if (Math.random() > 0) {
    //   return;
    // }
    // const chatInput = chatInputRef.current;
    // if (!chatInput) return;

    // const mentionSpans = chatInput.querySelectorAll(".mention");
    // const currentMentions: string[] = Array.from(mentionSpans)
    //   .map((span) => span.textContent?.replace(/^@/, "") || "")
    //   .filter((name) => name);

    // setContextItems((prev) => {
    //   const newItems: ContextItem[] = [];
    //   currentMentions.forEach((mentionName) => {
    //     const existingItem = prev.find((item) => item.name === mentionName);
    //     if (existingItem) {
    //       newItems.push(existingItem);
    //     } else {
    //       newItems.push({ kind: "react-scan", name: mentionName });
    //     }
    //   });
    //   return newItems;
    // });
  };

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

    setContextItems((prev) => [...prev, { kind: "react-scan", name: mention }]);

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
    setContextItems((prev) => {
      const newItems = prev.filter((_, i) => i !== index);
      const mentionSpans = chatInputRef.current?.querySelectorAll(".mention");
      if (mentionSpans && index < mentionSpans.length) {
        mentionSpans[index].remove();
      }
      return newItems;
    });
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
        <div className="px-1 py-2 border-b border-[rgba(255,255,255,0.04)] overflow-x-auto">
          <div className="flex items-center gap-2">
            {contextItems.map((item, index) =>
              iife(() => {
                switch (item.kind) {
                  case "image": {
                    return (
                      <div
                        key={index}
                        className="flex flex-col relative items-center gap-1 text-[#A1A1A6] text-xs font-light border px-1 py-0.5 rounded-sm"
                      >
                        <div className="flex gap-x-1 absolute top-0 right-0">
                          {/* <span>{item.name}</span> */}
                          <button
                            onClick={() => removeItem(index)}
                            className="text-white hover:text-white "
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <img
                          alt="Screenshot"
                          src={`http://localhost:5001/image/${item.filePath}`}
                          className="h-[100px] min-w-[100px] object-cover"
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
                        className="flex items-center gap-1 text-[#A1A1A6] text-xs font-light border px-1 py-0.5 rounded-sm"
                      >
                        <span>{item.name}</span>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-[#A1A1A6] hover:text-white"
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

          /**
           *
           * okay so what is there to be done
           *
           * upload image
           *
           * get url
           *
           * what data structure do we need to encapsulate this?
           *
           * is this just context? i guess its fine to model it like that for now
           *
           * okay so each message has context and a message?
           *
           * how is context treated in the system? User message? System prompt? Something else? I suppose user data just combined into one thing
           *
           * so you want a message to have context and the message side by side then you will have some function that combines them
           *
           * okay so then you have a message that has text and context, do we ever want more data that we can one shot right now?
           *
           * i think context is a fine abstraction and then can make that a discriminated union...............
           *
           *
           * does this mean a message has to look like that now? can i just include it in the message itself when it has text parts and then it also has context?
           *
           *
           * and now i fuck myself cause i decided to use the raw type lol
           *
           *
           * its fine i can abstract it i guess?
           *
           *
           * uh does my rpc work for this? idk
           */

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
          setContextItems((prev) => [
            ...prev,
            {
              kind: "image",
              filePath: data.fileName,
              name: nanoid(),
            },
          ]);

          // i guess we want to upload the image, and paste the result? i wonder how fast this is, do we even need an optimistic preview? If this is backed by a service it might be nice but i don't want to build an abstraction for a feature that doesn't exist yet

          // console.log("Clipboard Text Data:", text);
          console.log("Clipboard Files:", fileDataArray);
        }}
        className="w-full text-[13px] chat-input text-white caret-white font-light leading-relaxed min-h-[50px] pt-1.5 pl-2 pr-4 pb-1.5 focus:outline-none"
        onInput={handleInput}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.metaKey && !showMenu) {
            const target = e.target as HTMLDivElement;
            e.preventDefault();
            e.stopPropagation();
            const clientEvent: ClientMessageEvent = {
              requestId: nanoid(),
              context: contextItems
                .map((item) => {
                  switch (item.kind) {
                    case "image": {
                      return {
                        kind: "image" as const,
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
              previousEvents: eventLog.events,
            };
            console.log("sending dis");

            setContextItems([]);
            eventLog.actions.pushEvent(clientEvent);
            socket.emit("message", clientEvent);
            target.textContent = "";
          }
        }}
      />
    </div>
  );
};

export default ChatTextArea;

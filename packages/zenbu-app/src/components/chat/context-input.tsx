import { useState, useRef, useEffect, SetStateAction, Dispatch } from "react";
import { X } from "lucide-react";

// Props for the MentionMenu component
interface MentionMenuProps {
  onSelect: (item: string) => void;
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  filteredItems: string[];
}

interface SelectedItem {
  type: "react-scan";
  name: string;
}

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
          (prev) => (prev - 1 + filteredItems.length) % filteredItems.length
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

// Main ChatComponent with mention functionality
const ChatComponent = () => {
  const items = ["react-scan", "console", "network", "localstorage"];
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [query, setQuery] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<string[]>(items);
  const chatInputRef = useRef<HTMLDivElement>(null);

  const syncSelectedItems = () => {
    const chatInput = chatInputRef.current;
    if (!chatInput) return;

    const mentionSpans = chatInput.querySelectorAll(".mention");
    const currentMentions: string[] = Array.from(mentionSpans)
      .map((span) => span.textContent?.replace(/^@/, "") || "")
      .filter((name) => name);

    setSelectedItems((prev) => {
      const newItems: SelectedItem[] = [];
      currentMentions.forEach((mentionName) => {
        const existingItem = prev.find((item) => item.name === mentionName);
        if (existingItem) {
          newItems.push(existingItem);
        } else {
          newItems.push({ type: "react-scan", name: mentionName });
        }
      });
      return newItems;
    });
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
      item.toLowerCase().startsWith(currentQuery.toLowerCase())
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

    setSelectedItems((prev) => [
      ...prev,
      { type: "react-scan", name: mention },
    ]);

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
    setSelectedItems((prev) => {
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
      {selectedItems.length > 0 && (
        <div className="px-1 py-2 border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-2">
            {selectedItems.map((item, index) => (
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
            ))}
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
        ref={chatInputRef}
        contentEditable
        className="w-full text-[13px] text-white caret-white font-light leading-relaxed min-h-[50px] pt-1.5 pl-2 pr-4 pb-1.5 focus:outline-none"
        onInput={handleInput}
      />
    </div>
  );
};

export default ChatComponent;
import { useState, useRef, useEffect, SetStateAction, Dispatch } from "react";
import { X } from "lucide-react";

// Props for the MentionMenu component
interface MentionMenuProps {
  onSelect: (item: string) => void;
  selectedIndex: number;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
}

interface SelectedItem {
  type: "react-scan";
  name: string;
}

// MentionMenu component with keyboard navigation (Arrow keys only)
const MentionMenu = ({
  onSelect,
  selectedIndex,
  setSelectedIndex,
}: MentionMenuProps) => {
  const items = ["react-scan", "console", "network", "localstorage"];

  // Handle keyboard navigation (Arrow keys only)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [items, setSelectedIndex]);

  return (
    <div className="w-full">
      {items.map((item, index) => (
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
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const chatInputRef = useRef<HTMLDivElement>(null);

  // Detect "@" before the cursor position and sync selectedItems
  const handleInput = () => {
    const chatInput = chatInputRef.current;
    if (!chatInput) return;

    // Step 1: Detect "@" for mention menu
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowMenu(false);
    } else {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const offset = range.startOffset;
        const textBeforeCursor = node.textContent?.slice(0, offset) || "";
        setShowMenu(textBeforeCursor.endsWith("@"));
      } else {
        setShowMenu(false);
      }
    }

    // Step 2: Sync selectedItems with mentions in the chat input
    const mentionSpans = chatInput.querySelectorAll(".mention");
    const currentMentions: string[] = Array.from(mentionSpans)
      .map((span) => span.textContent?.replace(/^@/, "") || "")
      .filter((name) => name);

    // Update selectedItems to match the current mentions in the chat input
    setSelectedItems((prev) => {
      const newItems: SelectedItem[] = [];
      currentMentions.forEach((mentionName) => {
        const existingItem = prev.find((item) => item.name === mentionName);
        if (existingItem) {
          newItems.push(existingItem);
        } else {
          // If a mention is somehow re-added (e.g., via undo), recreate the item
          newItems.push({ type: "react-scan", name: mentionName });
        }
      });
      return newItems;
    });
  };

  // Insert a mention at the cursor position with a real space after
  const insertMention = (mention: string) => {
    const chatInput = chatInputRef.current;
    if (!chatInput) return;

    // Remove the "@" before inserting the mention
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        const offset = range.startOffset;
        const text = node.textContent || "";
        if (text.slice(0, offset).endsWith("@")) {
          node.textContent = text.slice(0, offset - 1) + text.slice(offset);
          range.setStart(node, offset - 1);
          range.setEnd(node, offset - 1);
        }
      }
    }

    // Add to selected items (fixed syntax error here)
    setSelectedItems((prev) => [
      ...prev,
      { type: "react-scan", name: mention },
    ]);

    // Create mention span (non-editable, without trailing space)
    const mentionSpan = document.createElement("span");
    mentionSpan.className =
      "bg-[#2A2A30] text-white px-1.5 py-0.5 rounded-sm mention";
    mentionSpan.textContent = `@${mention}`;
    mentionSpan.contentEditable = "false";

    // Create a space as a separate text node
    const spaceNode = document.createTextNode(" ");

    // Insert the mention span and space at cursor position
    const range = selection?.getRangeAt(0);
    if (range) {
      // Insert the mention span
      range.insertNode(mentionSpan);
      // Insert the space node after the mention span
      mentionSpan.parentNode?.insertBefore(spaceNode, mentionSpan.nextSibling);

      // Create a new range to position the cursor after the space
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.setEndAfter(spaceNode);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    } else {
      // Fallback: append to chat input
      chatInput.appendChild(mentionSpan);
      chatInput.appendChild(spaceNode);

      // Position cursor after the space
      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.setEndAfter(spaceNode);
      selection?.removeAllRanges();
      selection?.addRange(newRange);
    }

    setShowMenu(false);
  };

  // Remove a selected item
  const removeItem = (index: number) => {
    setSelectedItems((prev) => {
      const newItems = prev.filter((_, i) => i !== index);
      // Also remove the corresponding mention from the chat input
      const mentionSpans = chatInputRef.current?.querySelectorAll(".mention");
      if (mentionSpans && index < mentionSpans.length) {
        mentionSpans[index].remove();
      }
      return newItems;
    });
  };

  // Handle Enter key to select mention when menu is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMenu(false);
        return;
      }

      // Only handle Enter when the mention menu is open
      if (showMenu && e.key === "Enter") {
        e.preventDefault(); // Prevent default Enter behavior (new line)
        const items = ["react-scan", "console", "network", "localstorage"];
        insertMention(items[selectedIndex]); // Select the highlighted item
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showMenu, selectedIndex]);

  return (
    <div className="w-full">
      {/* Display selected items */}
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
      {/* Mention menu */}
      {showMenu && (
        <MentionMenu
          onSelect={insertMention}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      )}
      {/* Chat input */}
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

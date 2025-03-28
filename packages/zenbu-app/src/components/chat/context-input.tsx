import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

// Props for the MentionMenu component
interface MentionMenuProps {
  onSelect: (item: string) => void;
}

interface SelectedItem {
  type: "gpt";
  name: string;
}

// MentionMenu component with prominent highlighting
const MentionMenu = ({ onSelect }: MentionMenuProps) => {
  const items = ["GPT-4", "ConciseGPT", "nvim gpt", "Wolfram"];
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(items[selectedIndex]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, items, onSelect]);

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

// Main ChatComponent with fixes for all issues
const ChatComponent = () => {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const chatInputRef = useRef<HTMLDivElement>(null);

  // Detect "@" at the end of the last text node
  const handleInput = () => {
    const chatInput = chatInputRef.current;
    if (!chatInput) return;

    const lastChild = chatInput.lastChild;
    if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
      const text = lastChild.textContent || "";
      setShowMenu(text.endsWith("@"));
    } else {
      setShowMenu(false);
    }
  };

  // Insert mention and position cursor correctly
  const insertMention = (mention: string) => {
    const chatInput = chatInputRef.current;
    if (!chatInput) return;

    // Remove the trailing "@" from the last text node
    const lastChild = chatInput.lastChild;
    if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
      const text = lastChild.textContent || "";
      if (text.endsWith("@")) {
        lastChild.textContent = text.slice(0, -1);
      }
    }

    // Add to selected items
    setSelectedItems(prev => [...prev, { type: "gpt", name: mention }]);

    // Create mention span
    const mentionSpan = document.createElement("span");
    mentionSpan.className = "bg-[#2A2A30] text-white px-1.5 py-0.5 rounded-sm mention";
    mentionSpan.textContent = `@${mention}`;
    mentionSpan.contentEditable = "false";

    // Append span and set cursor
    chatInput.appendChild(mentionSpan);
    const range = document.createRange();
    range.setStartAfter(mentionSpan);
    range.setEndAfter(mentionSpan);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    setShowMenu(false);
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Close menu with Escape key
  useEffect(() => {
    if (!showMenu) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMenu(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showMenu]);


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
      {showMenu && <MentionMenu onSelect={insertMention} />}
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
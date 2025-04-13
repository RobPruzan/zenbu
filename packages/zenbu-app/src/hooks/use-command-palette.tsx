import { useEffect } from "react";
import { useChatStore } from "~/components/chat-store";
import { CommandItem } from "~/components/slices/command-palette-slice";
import { LucideIcon } from "lucide-react";

type UseCommandPaletteOptions = {
  items?: CommandItem[];
};

export function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const { actions, isOpen } = useChatStore((state) => state.commandPalette);
  
  useEffect(() => {
    if (options.items && options.items.length > 0) {
      actions.registerItems(options.items);
      
      // Clean up registered items when unmounted
      return () => {
        // This is a simple approach - in a more complex app we might want to only remove items
        // registered by this particular component
        const itemIds = new Set(options.items.map(item => item.id));
        actions.clearItems();
      };
    }
  }, [options.items, actions]);
  
  return {
    open: () => actions.setOpen(true),
    close: () => actions.setOpen(false),
    toggle: () => actions.setOpen(!isOpen),
    isOpen,
  };
}

// Helper to create command items with icons
export function createCommandItem(
  id: string,
  title: string,
  options?: {
    subtitle?: string;
    category?: string;
    icon?: React.ReactNode;
    shortcut?: string;
    onSelect?: () => void;
  }
): CommandItem {
  return {
    id,
    title,
    ...options,
  };
} 
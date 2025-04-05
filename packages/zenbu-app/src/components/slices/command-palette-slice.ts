import { SliceCreator } from "../chat-instance-context";

export type CommandItem = {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect?: () => void;
};

export type CommandPaletteSliceInitialState = {
  isOpen: boolean;
  items: CommandItem[];
};

export type CommandPaletteSlice = {
  isOpen: boolean;
  items: CommandItem[];
  actions: {
    setOpen: (isOpen: boolean) => void;
    registerItems: (items: CommandItem[]) => void;
    clearItems: () => void;
    selectItem: (id: string) => void;
  };
};

export const createCommandPaletteSlice =
  (initialState: CommandPaletteSliceInitialState): SliceCreator<CommandPaletteSlice> =>
  (set, get) => ({
    isOpen: initialState.isOpen,
    items: initialState.items,
    actions: {
      setOpen: (isOpen) =>
        set((state) => {
          state.commandPalette.isOpen = isOpen;
        }),
      registerItems: (items) =>
        set((state) => {
          // Merge new items with existing ones, replacing any with the same id
          const existingIds = new Set(state.commandPalette.items.map(item => item.id));
          const newItems = items.filter(item => !existingIds.has(item.id));
          state.commandPalette.items = [...state.commandPalette.items, ...newItems];
        }),
      clearItems: () =>
        set((state) => {
          state.commandPalette.items = [];
        }),
      selectItem: (id) => {
        const item = get().commandPalette.items.find(item => item.id === id);
        if (item && item.onSelect) {
          item.onSelect();
        }
        // Close the palette after selection
        set((state) => {
          state.commandPalette.isOpen = false;
        });
      }
    },
  }); 
import { FocusedInfo } from "zenbu-devtools";
import { SliceCreator } from "../chat-store";

export type ContextItem =
  | {
      kind: "react-scan";
      // probably should be an id instead of name
      name: string;
    }
  | {
      kind: "image";
      name: string;
      filePath: string;
    }
  | {
      kind: "video";
      name: string;
      filePath: string;
    };
export type ContextSliceInitialState = {
  items: Array<ContextItem>;
};
export type ContextSlice = {
  state: {
    items: Array<ContextItem>;
  };
  actions: {
    pushItem: (item: ContextItem) => void;
    // CHANGE THIS TO ID WHAT ARE U DOING
    removeItem: (name: string) => void;
    setItems: (items: Array<ContextItem>) => void;
  };
};
export const createContextSlice =
  (initialState: ContextSliceInitialState): SliceCreator<ContextSlice> =>
  (set, get) => ({
    state: {
      items: initialState.items,
    },
    actions: {
      pushItem: (event) =>
        set((state) => {
          state.context.state.items.push(event);
        }),
      removeItem: (name) =>
        set((state) => {
          state.context.state.items = state.context.state.items.filter(
            (item) => item.name !== name,
          );
        }),
      setItems: (items) =>
        set((state) => {
          state.context.state.items = items;
        }),
    },
  });

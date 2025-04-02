import { FocusedInfo } from "zenbu-devtools";
import { SliceCreator  } from "../chat-instance-context";


type ReactScanContextItem = { kind: "react-scan"; data: any };
type ContextItems = (
  | ReactScanContextItem
  | { kind: "inspector"; data: FocusedInfo }
) & { id: string };
export type ContextSliceInitialState = {
  items: Array<ContextItems>;
};
export type ContextSlice = {
  state: {
    items: Array<ContextItems>;
  };
  actions: {
    pushItem: (item: ContextItems) => void;
    removeItem: (itemId: string) => void;
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
      removeItem: (itemId) =>
        set((state) => {
          state.context.state.items = state.context.state.items.filter(
            (item) => item.id !== itemId,
          );
        }),
    },
  });
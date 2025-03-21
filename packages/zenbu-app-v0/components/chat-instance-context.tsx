import { createStore, StateCreator, useStore } from "zustand";
import { createZustandContext } from "./create-zustant-context";
import { immer } from "zustand/middleware/immer";
import { FocusedInfo, InspectorState } from "zenbu-devtools";
export type ChatInstanceInitialState = {
  messages: Array<{}>;
  inspector: InspectorSliceInitialState;
};

export type ChatInstanceStore = {
  messages: Array<{}>;
  inspector: SliceCreator<InspectorSlice>;
};

export const ChatInstanceContext = createZustandContext(
  (initialState: ChatInstanceInitialState) =>
    createStore<ChatInstanceStore>()(
      immer(() => ({
        messages: initialState.messages,
        inspector: createInspectorSlice(initialState.inspector),
      }))
    )
);

export function useChatStore(): ChatInstanceStore;
export function useChatStore<T>(selector: (state: ChatInstanceStore) => T): T;
export function useChatStore<T>(selector?: (state: ChatInstanceStore) => T) {
  const store = ChatInstanceContext.useContext();
  return useStore(store, selector!);
}

export type SliceCreator<SliceState> = StateCreator<
  ChatInstanceStore,
  [["zustand/immer", never], never],
  [],
  SliceState
>;

type InspectorSlice = {
  state: InspectorState;
};

type InspectorSliceInitialState = {
  state: InspectorState;
};

const createInspectorSlice =
  (initialState: InspectorSliceInitialState): SliceCreator<InspectorSlice> =>
  (set, get) => ({
    state: initialState.state,
  });

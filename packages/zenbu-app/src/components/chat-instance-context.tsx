import { createStore, StateCreator, useStore } from "zustand";
import { createZustandContext } from "./create-zustant-context";
import { immer } from "zustand/middleware/immer";
import {
  ChatControlsInitialState,
  ChatControlsSlice,
  createChatControlsSlice,
} from "./slices/chat-controls-slice";
import {
  createInspectorSlice,
  InspectorSlice,
  InspectorSliceInitialState,
} from "./slices/inspector-slice";
import {
  ContextSliceInitialState,
  ContextSlice,
  createContextSlice,
} from "./slices/context-slice";
import {
  createEventLogSlice,
  EventLogSlice,
  EventLogSliceInitialState,
} from "./slices/event-log-slice";
import {
  createToolbarSLice,
  ToolbarSlice,
  ToolbarSliceInitialState,
} from "./slices/toolbar-slice";

export type ChatInstanceInitialState = {
  eventLog: EventLogSliceInitialState;
  inspector: InspectorSliceInitialState;
  chatControls: ChatControlsInitialState;
  context: ContextSliceInitialState;
  toolbar: ToolbarSliceInitialState;
  // commandPalette: CommandPaletteSliceInitialState;
};

export type ChatInstanceStore = {
  eventLog: EventLogSlice;
  inspector: InspectorSlice;
  chatControls: ChatControlsSlice;
  context: ContextSlice;
  toolbar: ToolbarSlice;
  // commandPalette: CommandPaletteSlice;
};

export const ChatInstanceContext = createZustandContext(
  (initialState: ChatInstanceInitialState) =>
    createStore<ChatInstanceStore>()(
      immer((...args) => ({
        eventLog: createEventLogSlice(initialState.eventLog)(...args),
        inspector: createInspectorSlice(initialState.inspector)(...args),
        chatControls: createChatControlsSlice(initialState.chatControls)(
          ...args,
        ),
        context: createContextSlice(initialState.context)(...args),
        toolbar: createToolbarSLice(initialState.toolbar)(...args),
        // commandPalette: createCommandPaletteSlice(initialState.commandPalette)(...args),
      })),
    ),
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

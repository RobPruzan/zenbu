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
import {
  createIFrameSlice,
  IFrameSlice,
  IFrameSliceInitialState,
} from "./slices/iframe-slice";

export type ChatInstanceInitialState = {
  eventLog: EventLogSliceInitialState;
  inspector: InspectorSliceInitialState;
  chatControls: ChatControlsInitialState;
  context: ContextSliceInitialState;
  toolbar: ToolbarSliceInitialState;
  iframe: IFrameSliceInitialState;
};

/**
 * should think about the actual state i need
 *
 * er this is a bad environment I'm not thinking at all
 *
 * well I guess I'd need a plugin shared state k/v but for the frontend?
 *
 * do i want to do this first? Or have the infra setup
 *
 *
 * so i guess we will need some json typed store?
 *
 * okay yeah i probably want to connect to the infra first, i roughly know what i want though
 * but it works better when you're making something you want to instantly verify it against it
 *
 * er so do we want to build the effect daemon first?
 *
 *
 * yeah cause then I connect connect and swap, I'll have the projects, which I'll need for full plugin system
 *
 * then I'll have a project to write to when I setup the device bridge
 *
 *
 *
 *
 */

export type ChatInstanceStore = {
  eventLog: EventLogSlice;
  inspector: InspectorSlice;
  chatControls: ChatControlsSlice;
  context: ContextSlice;
  toolbar: ToolbarSlice;
  iframe: IFrameSlice;
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
        iframe: createIFrameSlice(initialState.iframe)(...args),
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

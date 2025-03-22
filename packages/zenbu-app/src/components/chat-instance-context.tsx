import { createStore, StateCreator, useStore } from "zustand";
import { createZustandContext } from "./create-zustant-context";
import { immer } from "zustand/middleware/immer";
import { FocusedInfo, InspectorState } from "zenbu-devtools";
import { EventLogEvent, PluginServerEvent } from "zenbu-plugin/src/ws/ws";

/**
 * okay so what do i want this event log to be
 *
 * the first i definitely just need user messages i sent, that's trivial since there's not many events i can send
 *
 * its just messages composed of any combination of context
 *
 * er i probably want this on the plugin so we can trivially distribute it
 */
export type ChatInstanceInitialState = {
  // messages: Array<{}>;
  eventLog: EventLogSliceInitialState;
  inspector: InspectorSliceInitialState;
  chatControls: ChatControlsInitialState;
};

export type ChatInstanceStore = {
  // messages: Array<{}>;
  eventLog: EventLogSlice;
  inspector: InspectorSlice;
  chatControls: ChatControlsSlice;
};

/**
 *
 * next now i probably need to actually fix the dog shit UI now that I've thought of the
 * whole thing e2e
 *
 * gr first should we migrate to t3 app?
 *
 * then we should fix the state management
 *
 * then we can hook up to ws events so we can start chatting with model :)
 *
 *
 *
 * i could do a little more depth for verification this makes sense since i've never paired streaming
 * event logs and ws connections in one app
 *
 * also it would be most fun to actually have a working chat, and migrating and knowing i have it working
 * when i have these large pillars working (inspect element, devtool hot reloading, chat)
 *
 *
 */

export const ChatInstanceContext = createZustandContext(
  (initialState: ChatInstanceInitialState) =>
    createStore<ChatInstanceStore>()(
      immer((...args) => ({
        eventLog: createEventLogSlice(initialState.eventLog)(...args),
        inspector: createInspectorSlice(initialState.inspector)(...args),
        chatControls: createChatControlsSlice(initialState.chatControls)(
          ...args,
        ),
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

type InspectorSlice = {
  state: InspectorState;
  actions: {
    setInspectorState: (state: InspectorState) => void;
  };
};
type ChatControlsInitialState = {
  input: string;
};
type ChatControlsSlice = {
  state: {
    input: string;
  };
  actions: {
    setInput: (input: string) => void;
  };
};

type InspectorSliceInitialState = {
  state: InspectorState;
};

const createInspectorSlice =
  (initialState: InspectorSliceInitialState): SliceCreator<InspectorSlice> =>
  (set, get) => ({
    state: initialState.state,
    actions: {
      setInspectorState: (inspectorState) =>
        set((state) => {
          state.inspector.state = {
            ...state.inspector.state,
            ...inspectorState,
          };
        }),
    },
  });

const createChatControlsSlice =
  (initialState: ChatControlsInitialState): SliceCreator<ChatControlsSlice> =>
  (set, get) => ({
    state: {
      input: initialState.input,
    },
    actions: {
      setInput: (input) =>
        set((prev) => {
          prev.chatControls.state.input = input;
        }),
    },
  });

type EventLogSliceInitialState = {
  events: Array<EventLogEvent>;
};
type EventLogSlice = {
  events: Array<EventLogEvent>;
  actions: {
    pushEvent: (event: EventLogEvent) => void;
  };
};
const createEventLogSlice =
  (initialState: EventLogSliceInitialState): SliceCreator<EventLogSlice> =>
  (set, get) => ({
    events: initialState.events,
    actions: {
      pushEvent: (event) =>
        set((state) => {
          state.eventLog.events.push(event);
        }),
    },
  });

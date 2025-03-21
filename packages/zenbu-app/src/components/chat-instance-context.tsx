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
  eventLog: Array<EventLogEvent>;
  inspector: InspectorSliceInitialState;
};

export type ChatInstanceStore = {
  // messages: Array<{}>;
  eventLog: Array<EventLogEvent>;
  inspector: SliceCreator<InspectorSlice>;
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
      immer(() => ({
        eventLog: initialState.eventLog,
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

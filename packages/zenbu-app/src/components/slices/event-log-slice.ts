import { EventLogEvent } from "zenbu-plugin/src/ws/ws";
import { SliceCreator } from "../chat-store";

export type EventLogSliceInitialState = {
  events: Array<EventLogEvent>;
};
export type EventLogSlice = {
  events: Array<EventLogEvent>;
  actions: {
    pushEvent: (event: EventLogEvent) => void;
  };
};
export const createEventLogSlice =
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

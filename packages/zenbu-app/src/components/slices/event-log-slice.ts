import { PartialEvent } from "zenbu-redis";

// i could have a last code response for a room and then feed that back into reapply, may make future things hairy like parallel stuff idk

import { SliceCreator } from "../chat-store";

export type EventLogSliceInitialState = {
  events: Array<PartialEvent>;
};
export type EventLogSlice = {
  events: Array<PartialEvent>;
  actions: {
    pushEvent: (event: PartialEvent) => void;
  };
};
export const createEventLogSlice =
  (initialState: EventLogSliceInitialState): SliceCreator<EventLogSlice> =>
  (set, get) => ({
    events: initialState.events,
    actions: {
      pushEvent: (event) =>
        set((state) => {
          switch (event.kind) {
            case "model-message": {
              state.eventLog.events.push({
                associatedRequestId: event.associatedRequestId,
                chunk: event.chunk,
                id: event.id,
                kind: event.kind,
                timestamp: event.timestamp,
              });
              // state.eventLog.events.push(event);
              return;
            }
            case "user-message": {
              // typescript bug/monorepo weirdness
              state.eventLog.events.push({
                kind: event.kind,
                context: event.context,
                id: event.id,
                requestId: event.requestId,
                text: event.text,
                timestamp: event.timestamp,
              });
              // state.eventLog.events.push(event);
              return;
            }
          }

          // state.eventLog.events.push(event);
        }),
    },
  });

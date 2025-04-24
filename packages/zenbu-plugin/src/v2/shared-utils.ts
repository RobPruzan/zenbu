import { Effect } from "effect";
import { ClientEvent, ModelEvent } from "../../../zenbu-redis/src/redis";
import { TextStreamPart } from "ai";

const compareGroupId = (
  a: ClientEvent | ModelEvent,
  b: ClientEvent | ModelEvent
) => {
  if (a.kind !== b.kind) {
    return false;
  }

  return getGroupId(a) === getGroupId(b);
};
const getGroupId = (event: ClientEvent | ModelEvent) => {
  switch (event.kind) {
    case "model-message": {
      return event.associatedRequestId;
    }
    case "user-message": {
      event.requestId;
    }
  }
};

type ModelMessage = {
  kind: "model-message";
  // text: string;
  chunks: Array<TextStreamPart<{ stupid: any }>>;
  timestamp: ModelEvent["timestamp"];
  id: ModelEvent["id"];
};
type UserMessage = {
  kind: "user-message";
  text: string;
  context: ClientEvent["context"];
  id: ClientEvent["id"];
  timestamp: ClientEvent["timestamp"];
};
export type FullEvent = UserMessage | ModelMessage;

const initializeFullEvent = (
  partialEvent: ClientEvent | ModelEvent
): FullEvent => {
  switch (partialEvent.kind) {
    case "model-message": {
      return {
        kind: "model-message",
        id: partialEvent.id,
        chunks: [],
        timestamp: partialEvent.timestamp,
      };
    }
    case "user-message": {
      return {
        kind: "user-message",
        context: partialEvent.context,
        id: partialEvent.id,
        text: partialEvent.text,
        timestamp: partialEvent.timestamp,
      };
    }
  }
};

function pushAcc(
  message: ModelMessage | UserMessage,
  event: ModelEvent | ClientEvent
) {
  if (message.kind === "model-message") {
    if (event.kind !== "model-message") {
      throw new Error("Impossible State");
    }

    message.chunks.push(event.chunk);
    return;
  }

  if (event.kind !== "user-message") {
    throw new Error("Impossible State");
  }
  message.text += event.text;
}

export const accumulateEvents = (events: Array<ClientEvent | ModelEvent>) =>
  Effect.gen(function* () {
    
    if (events.length === 0) {
      return [];
    }
    const sortedEvents = events.toSorted((a, b) => a.timestamp - b.timestamp);

    let accumulatedEvents: Array<ModelEvent | ClientEvent> = [sortedEvents[0]];

    let flushedEvents: Array<FullEvent> = [];

    let accumulateStartPointer = 0;
    let accumulateIncrementPointer = 1;

    while (accumulateStartPointer < sortedEvents.length) {
      const start = sortedEvents[accumulateStartPointer];
      const candidate = sortedEvents[accumulateIncrementPointer];

      const startNewAccumulation = () => {
        const message = initializeFullEvent(start);

        accumulatedEvents.forEach((event) => {
          pushAcc(message, event);
        });

        flushedEvents.push(message);
        accumulatedEvents = [];
        accumulateStartPointer = accumulateIncrementPointer;
      };
      const continueAccumulation = () => {
        accumulateIncrementPointer++;
        accumulatedEvents.push(candidate);
        if (accumulateIncrementPointer === sortedEvents.length) {
          accumulateStartPointer = sortedEvents.length;
        }
      };

      if (compareGroupId(start, candidate)) {
        continueAccumulation();
        continue;
      }

      startNewAccumulation();
      continue;
    }

    if (accumulatedEvents.length > 0) {
      const message = initializeFullEvent(accumulatedEvents[0]);
      accumulatedEvents.forEach((event) => {
        pushAcc(message, event);
      });

      flushedEvents.push(message);
    }

    return flushedEvents;
  });

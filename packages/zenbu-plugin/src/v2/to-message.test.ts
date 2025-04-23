import { Effect } from "effect";
import { ClientEvent, ModelEvent, accumulateEvents } from "./shared-utils";

const a: Array<ClientEvent | ModelEvent> = [];
const b: Array<ClientEvent | ModelEvent> = [
  {
    context: [],
    id: "a",
    kind: "user-message",
    requestId: "client-a",
    text: "hello model",
    timestamp: 0,
  },
  {
    kind: "model-message",
    text: "he",
    associatedRequestId: "client-a",
    id: "b",
    timestamp: 1,
  },
  {
    kind: "model-message",
    text: "ll",
    associatedRequestId: "client-a",
    id: "b",
    timestamp: 2,
  },
  {
    kind: "model-message",
    text: "o",
    associatedRequestId: "client-a",
    id: "c",
    timestamp: 3,
  },
  {
    context: [],
    id: "z",
    kind: "user-message",
    requestId: "client-x",
    text: "great day man",
    timestamp: 4,
  },
];

const effect = accumulateEvents(b);

const result = await Effect.runPromise(effect);

console.log(result);

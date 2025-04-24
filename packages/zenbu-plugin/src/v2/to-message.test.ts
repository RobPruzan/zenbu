import { Effect } from "effect";
import { ClientEvent, ModelEvent } from "../../../zenbu-redis/src/redis";
import { accumulateEvents } from "./shared-utils";

import * as util from "util";

util.inspect.defaultOptions.depth = null;
util.inspect.defaultOptions.showHidden = true;
util.inspect.defaultOptions.maxArrayLength = null;
util.inspect.defaultOptions.colors = true;

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
    chunk: { textDelta: "he", type: "text-delta" },
    associatedRequestId: "client-a",
    id: "b",
    timestamp: 1,
  },
  {
    kind: "model-message",
    chunk: { textDelta: "ll", type: "text-delta" },
    associatedRequestId: "client-a",
    id: "b",
    timestamp: 2,
  },
  {
    kind: "model-message",
    chunk: { textDelta: "o", type: "text-delta" },
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

const c: Array<ClientEvent | ModelEvent> = [
  {
    context: [],
    id: "a",
    kind: "user-message",
    requestId: "client-a",
    text: "hello model",
    timestamp: 0,
  },
{
    context: [],
    id: "b",
    kind: "user-message",
    requestId: "client-b",
    text: "hello model again",
    timestamp: 1,
  }
];
const effect = accumulateEvents(c);

const result = await Effect.runPromise(effect);

console.log(
  util.inspect(result, { depth: null, colors: true, maxArrayLength: null })
);

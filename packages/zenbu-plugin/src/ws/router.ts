import { ChatMessage } from "./utils.js";

// todo: do the interface thing finally
export type PQueueItem = PausedItem | ExecutingItem;

type PausedItem = {
  kind: "paused";
  id: string; // remember to make this small- nanoid?
  /**
   * larger = higher priority
   */
  importance: number;
  message: string;
  /**
   * we use this timestamp to tell the model how many seconds ago this request was
   */
  timestamp: number;
  resume: () => void;
  onComplete: (output: string) => void;
};

type ExecutingItem = {
  kind: "executing";
  id: string; // remember to make this small- nanoid?
  /**
   * larger = higher priority
   */
  importance: number;
  message: string;
  /**
   * we use this timestamp to tell the model how many seconds ago this request was
   */
  timestamp: number;
  pause: () => void;
  onComplete: (output: string) => void;
};

/**
 * oh shit we probably want the abort signals in here
 *
 * this would allow tasks to be super easy
 *
 * we can't make this serializable which kinda sucks, i don't think we can reasonably described what it takes to pause/resume a request and then just do it
 *
 */
export const pqueue: Array<PQueueItem> = [];

export const router = ({
  chatHistory,
  message,
}: {
  chatHistory: Array<ChatMessage>;
  message: string;
}) => {
  /**
   *
   * cases:
   * - pqueue
   * - interrupt
   * - thread
   *
   *
   * for now we want to pqueue, so we need a priority queue (just a sorted array), and have the model know existing tasks, and how to assign priorities
   *
   * the model also needs to be able to delete tasks (small ids to reference to delete)
   *
   * it also needs to be able to of course not queue the message and just interrupt/thread
   *
   *
   * okay so actually need to make these prompts lol
   *
   *
   * i wonder if node supports importing markdown files?
   *
   * todo: add a custom loader for markdown files
   *
   *
   * we may want to tell the model to try not to starve requests, so to correctly weight how tasks should be ordered?
   *
   * Maybe we have tasks and a separate stage tries to order the tasks correctly to optimize over my objective, i guess same intuition as before, you
   * just out different experiments and see what works best
   */
};

/**
 *
 * new cases:
 *
 * - model splits up task into tasks
 * - model executes single task plainly
 * - model is sent a message while generating
 *  - interrupt and provide info/allow model to determine what to do next
 *  - add a task to the task queue and allow it to read from the queue when it's done
 *
 */

const NOOP = () => null;

/**
 *
 * FINAL STATE:
 * - we know howe we want to process each case ^ (cases above, and some notes below)
 * - we know we have to modify system prompt, maintain a task queue, make a llm function to pull from queue
 * - we know we need a function that attempts to parallelize a task if possible, and does it smartly with mutexes
 * - we know the we need to make a prompt that for happy case does not make multiple tasks (1 or 1.5 tasks should not be sub tasks)
 * - but when multiple tasks it should be split, since it can be parallelized
 * - the language of each task should be **extremely similar** to the content inside the original message, its basically cropping it from the request, and then formatting it so the sentence/s can stand on its/their own
 * - model should know the result of everything that executes and always see the latest version of the file before writing/reading
 * - need to make sure the sub threads are just as powerful as agents, just don't have implicit threads being spawned
 */

const dummyQ: any[] = [];
const shouldParallelizeNextMessage = () => {
  const nextItem = dummyQ.pop();

  const canBeParallelized = true;

  const getLockedFiles = () => ["dummy-lock-file.ts"];

  const acquireMutex = NOOP;

  const unlockMutex = NOOP;
};

const scheduleWhileGenerating = () => {
  // while generating its different cause we need a router model here
  // should we

  const messageRoute: "new-task" | "interrupt" = "interrupt";

  const howToBehavePromptAfterInterruptionPrompt = "";
};

const scheduleWhileIdle = () => {
  // split into tasks or execute all at once
  /**
   *  split into tasks or execute all at once
   *
   * i guess we need to do this in the system prompt itself
   *
   * and the model should also not read the latest message but should pull from tasks, its not really conversational, its just assigning tasks for the model to pluck off and execute
   *
   */
};

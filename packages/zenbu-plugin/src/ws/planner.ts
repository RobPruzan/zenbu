import { readFile } from "node:fs/promises";
import { ChatMessage, removeMarkdownComments } from "./utils.js";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getCodebaseIndexPrompt } from "./ws.js";
import { chatMessagesToString } from "../tools/message-runtime.js";

interface Task {
  priority: number;
  description: string;
}

interface Plan {
  goal: string;
  tasks: Task[];
}

interface PlannerResult {
  rawText: string;
  plan: Plan | null;
  response: string | null;
  type: 'plan' | 'response' | null;
}

export function parsePlanFromXml(xmlContent: string): Plan | null {
  // Check if the content contains a plan
  if (!xmlContent.includes('<plan>')) {
    return null; // No plan found
  }

  try {
    // Extract the plan section from the XML
    const planMatch = xmlContent.match(/<plan>([\s\S]*?)<\/plan>/);
    if (!planMatch) {
      return null;
    }
    const planContent = planMatch[1];

    // Extract goal
    const goalMatch = planContent.match(/<goal>([\s\S]*?)<\/goal>/);
    const goal = goalMatch ? goalMatch[1].trim() : '';

    // Extract tasks
    const tasks: Task[] = [];
    const taskRegex = /<task>[\s\S]*?<priority>([\s\S]*?)<\/priority>[\s\S]*?<description>([\s\S]*?)<\/description>[\s\S]*?<\/task>/g;
    
    let match;
    while ((match = taskRegex.exec(planContent)) !== null) {
      const priorityText = match[1].trim();
      const description = match[2].trim();
      
      // Parse priority, defaulting to 99 (lowest) if invalid
      let priority = 99;
      try {
        const parsed = parseInt(priorityText);
        if (!isNaN(parsed)) {
          priority = parsed;
        }
      } catch (e) {
        // Keep default priority
      }
      
      tasks.push({
        priority,
        description
      });
    }

    // Sort tasks by priority (lower numbers = higher priority)
    tasks.sort((a, b) => a.priority - b.priority);

    return { goal, tasks };
  } catch (error) {
    console.error("Error parsing plan XML:", error);
    return null;
  }
}

export function parseResponseFromXml(xmlContent: string): string | null {
  // Check if the content contains a response
  if (!xmlContent.includes('<response>')) {
    return null; // No response found
  }

  try {
    // Extract the response section from the XML
    const responseMatch = xmlContent.match(/<response>([\s\S]*?)<\/response>/);
    if (!responseMatch) {
      return null;
    }
    return responseMatch[1].trim();
  } catch (error) {
    console.error("Error parsing response XML:", error);
    return null;
  }
}

export function parseModelOutput(xmlContent: string): PlannerResult {
  const plan = parsePlanFromXml(xmlContent);
  const response = parseResponseFromXml(xmlContent);
  
  let type: 'plan' | 'response' | null = null;
  if (plan) {
    type = 'plan';
  } else if (response) {
    type = 'response';
  }
  
  return {
    rawText: xmlContent,
    plan,
    response,
    type
  };
}

export const planner = async ({
  codebase,
  message,
  previousMessages,
  emitEvent,
}: {
  codebase: string;
  previousMessages: Array<ChatMessage>;
  message: string;
  emitEvent: (text: string) => void;
}): Promise<PlannerResult> => {
  const prompt = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/ws/planner.md",
    "utf-8"
  ).then(removeMarkdownComments);
  
  const messages = chatMessagesToString(previousMessages) 

  
  const { fullStream, text } = streamText({
    // @ts-expect-error
    model: google("gemini-2.0-flash-001"),
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `\
<data>
  <codebase>
  ${codebase}
  </codebase>

  <previous-messages>
${messages ? messages : "There has not been any previous messages"}
  </previous-messages>

  <latest-user-message>
  ${message}
  </latest-user-message>
</data>
`,
      },
    ],
  });

  for await (const obj of fullStream) {
    switch (obj.type) {
      case "tool-call-delta": {
        emitEvent(obj.argsTextDelta);
        break;
      }
      case "error": {
        emitEvent(`Error: ${(obj.error as Error).message}`);
        break;
      }
      case "redacted-reasoning": {
        emitEvent(`Redacted reasoning: ${obj.data}`);
        break;
      }
      case "reasoning": {
        emitEvent(obj.textDelta);
        break;
      }
      case "tool-call": {
        emitEvent(`Tool call: ${obj.toolName}`);
        break;
      }

      case "text-delta": {
        emitEvent(obj.textDelta);
        break;
      }
      case "finish": {
        emitEvent("Finished reason:" + obj.finishReason);
        break;
      }
      case "tool-call-streaming-start": {
        emitEvent(`Starting tool call: ${obj.toolName}`);
        break;
      }
    }
  }

  const result = await text;
  return parseModelOutput(result);
};

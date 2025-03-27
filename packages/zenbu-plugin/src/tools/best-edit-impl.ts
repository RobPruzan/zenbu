import { streamText } from "ai";
import { ChatMessage } from "../ws/utils.js";
import { anthropic } from "@ai-sdk/anthropic";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { getCodebaseIndexPrompt } from "../ws/ws.js";
import { chatMessagesToString } from "./message-runtime.js";
import * as path from "path";
import { existsSync } from "node:fs";
import { google } from "@ai-sdk/google";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { openai } from "@ai-sdk/openai";

const execAsync = promisify(exec);

function addLineNumbers(sourceCode: string): string {
  return sourceCode
    .split("\n")
    .map((line, index) => `${index + 1}: ${line}`)
    .join("\n");
}

async function formatWithPrettier(filePath: string): Promise<void> {
  try {
    // Check if file exists before attempting to format
    if (!existsSync(filePath)) {
      console.warn(`Skipping formatting: File not found: ${filePath}`);
      return;
    }
    await execAsync(`npx prettier --write "${filePath}"`);
  } catch (error) {
    console.error(`Error formatting ${filePath} with Prettier:`, error);
  }
}

async function parseModelResponse(
  responseText: string,
  targetFile: string
): Promise<string> {
  let result = "";

  if (responseText.includes("<fileWrites>")) {
    // New format - multiple file writes
    const results: string[] = [];

    // Find all writeFile blocks
    const writeFileMatches = responseText.matchAll(
      /<writeFile>[\s\S]*?<fileStatus>([\s\S]*?)<\/fileStatus>[\s\S]*?<code>([\s\S]*?)<\/code>[\s\S]*?<\/writeFile>/gi
    );

    // Process each writeFile block
    for (const match of Array.from(writeFileMatches)) {
      const fileStatus = match[1].trim();
      const code = match[2].trim();

      // Get the file path from the target file or a different path if specified in the writeFile block
      let filePath = targetFile;
      const filePathMatch = /<filePath>([\s\S]*?)<\/filePath>/i.exec(match[0]);
      if (filePathMatch && filePathMatch[1]) {
        filePath = filePathMatch[1].trim();
      }

      // Create directory if it's a new file
      if (fileStatus === "new-file") {
        const dir = path.dirname(filePath);
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }
      }

      // Write the file
      await writeFile(filePath, code);
      await formatWithPrettier(filePath);

      results.push(
        `File ${fileStatus === "new-file" ? "created" : "updated"}: ${filePath}`
      );
    }

    result = results.join("\n");
  } else if (responseText.includes("<rewriteFile>")) {
    // Legacy format - single file rewrite
    const fileStatusMatch = /<fileStatus>([\s\S]*?)<\/fileStatus>/i.exec(
      responseText
    );
    const codeMatch = /<code>([\s\S]*?)<\/code>/i.exec(responseText);

    if (codeMatch && codeMatch[1]) {
      const code = codeMatch[1].trim();
      const fileStatus = fileStatusMatch
        ? fileStatusMatch[1].trim()
        : "existing";

      if (fileStatus === "new-file") {
        const dir = path.dirname(targetFile);
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }
      }

      await writeFile(targetFile, code);
      await formatWithPrettier(targetFile);
      result = `File ${fileStatus === "new-file" ? "created" : "updated"}: ${targetFile}`;
    }
  } else if (responseText.includes("<updates>")) {
    const originalContent = await readFile(targetFile, "utf-8");
    const lines = originalContent.split("\n");
    let updatedLines = [...lines];

    // Define edit types
    type ReplaceEdit = {
      type: "replace";
      startLine: number;
      endLine: number;
      newCode: string[];
    };

    type InsertAboveEdit = {
      type: "insertAbove";
      lineNumber: number;
      newCode: string[];
    };

    type InsertBelowEdit = {
      type: "insertBelow";
      lineNumber: number;
      newCode: string[];
    };

    type DeleteEdit = {
      type: "delete";
      startLine: number;
      endLine: number;
    };

    type Edit = ReplaceEdit | InsertAboveEdit | InsertBelowEdit | DeleteEdit;

    // Collect all edits first
    const edits: Edit[] = [];

    // Collect replacements
    const replaceMatches = responseText.matchAll(
      /<replace>[\s\S]*?<startLineInclusive>([\s\S]*?)<\/startLineInclusive>[\s\S]*?<endLineInclusive>([\s\S]*?)<\/endLineInclusive>[\s\S]*?<code>([\s\S]*?)<\/code>[\s\S]*?<\/replace>/gi
    );
    for (const match of Array.from(replaceMatches)) {
      const startLine = parseInt(match[1].trim());
      const endLine = parseInt(match[2].trim());
      const newCode = match[3].trim().split("\n");

      edits.push({
        type: "replace",
        startLine,
        endLine,
        newCode,
      });
    }

    // Collect insertions above
    const insertAboveMatches = responseText.matchAll(
      /<insertAbove>[\s\S]*?<linkNumber>([\s\S]*?)<\/linkNumber>[\s\S]*?<code>([\s\S]*?)<\/code>[\s\S]*?<\/insertAbove>/gi
    );
    for (const match of Array.from(insertAboveMatches)) {
      const lineNumber = parseInt(match[1].trim());
      const newCode = match[2].trim().split("\n");

      edits.push({
        type: "insertAbove",
        lineNumber,
        newCode,
      });
    }

    // Collect insertions below
    const insertBelowMatches = responseText.matchAll(
      /<insertBelow>[\s\S]*?<linkNumber>([\s\S]*?)<\/linkNumber>[\s\S]*?<code>([\s\S]*?)<\/code>[\s\S]*?<\/insertBelow>/gi
    );
    for (const match of Array.from(insertBelowMatches)) {
      const lineNumber = parseInt(match[1].trim());
      const newCode = match[2].trim().split("\n");

      edits.push({
        type: "insertBelow",
        lineNumber,
        newCode,
      });
    }

    // Collect deletions
    const deleteMatches = responseText.matchAll(
      /<delete>[\s\S]*?<startLineInclusive>([\s\S]*?)<\/startLineInclusive>[\s\S]*?<endLineInclusive>([\s\S]*?)<\/endLineInclusive>[\s\S]*?<\/delete>/gi
    );
    for (const match of Array.from(deleteMatches)) {
      const startLine = parseInt(match[1].trim());
      const endLine = parseInt(match[2].trim());

      edits.push({
        type: "delete",
        startLine,
        endLine,
      });
    }

    // Check for overlapping edits that could conflict
    const detectOverlappingEdits = (edits: Edit[]): Edit[] => {
      const ranges: Array<{ edit: Edit; start: number; end: number }> = [];

      // Convert all edits to ranges for comparison
      for (const edit of edits) {
        let start: number, end: number;

        if (edit.type === "insertAbove") {
          // InsertAbove affects the line it targets
          start = end = edit.lineNumber - 1;
        } else if (edit.type === "insertBelow") {
          // InsertBelow affects the line after the one it targets
          start = end = edit.lineNumber;
        } else {
          // Replace and delete have explicit ranges
          start = edit.startLine - 1;
          end = edit.endLine - 1;
        }

        ranges.push({ edit, start, end });
      }

      // Sort ranges by start position (top-down)
      ranges.sort((a, b) => a.start - b.start);

      // Find non-overlapping edits using a greedy algorithm
      const safeEdits: Edit[] = [];
      const reservedRanges: Array<{ start: number; end: number }> = [];

      // Process edits in order of start position
      for (const range of ranges) {
        // Check if this range overlaps with any previously reserved range
        let overlaps = false;

        for (const reserved of reservedRanges) {
          // Check for any kind of overlap: not (range ends before reserved starts OR range starts after reserved ends)
          if (!(range.end < reserved.start || range.start > reserved.end)) {
            console.warn(
              `Skipping overlapping edit: Lines ${range.start + 1}-${range.end + 1} overlaps with another edit at lines ${reserved.start + 1}-${reserved.end + 1}`
            );
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          // This edit is safe to apply
          safeEdits.push(range.edit);
          reservedRanges.push({ start: range.start, end: range.end });
        }
      }

      // Re-sort the safe edits into bottom-up order for application
      safeEdits.sort((a, b) => {
        let aLine: number, bLine: number;

        if (a.type === "insertAbove" || a.type === "insertBelow") {
          aLine = a.lineNumber;
        } else {
          aLine = a.startLine;
        }

        if (b.type === "insertAbove" || b.type === "insertBelow") {
          bLine = b.lineNumber;
        } else {
          bLine = b.startLine;
        }

        // If line numbers are the same, prioritize by operation type
        if (bLine === aLine) {
          // Order: delete > replace > insertAbove > insertBelow
          const typeOrder: Record<string, number> = {
            delete: 0,
            replace: 1,
            insertAbove: 2,
            insertBelow: 3,
          };
          return typeOrder[a.type] - typeOrder[b.type];
        }

        return bLine - aLine; // Bottom-up ordering
      });

      return safeEdits;
    };

    // Validate the line numbers before applying edits
    const lineCount = lines.length;
    const boundaryValidEdits = edits.filter((edit) => {
      if (edit.type === "insertAbove" || edit.type === "insertBelow") {
        // For inserts, we allow values from 1 up to lineCount+1 (append at the end)
        const valid = edit.lineNumber >= 1 && edit.lineNumber <= lineCount + 1;
        if (!valid) {
          console.warn(
            `Skipping ${edit.type} edit: Line ${edit.lineNumber} is out of bounds (file has ${lineCount} lines)`
          );
        }
        return valid;
      } else {
        // For replace and delete, startLine must exist in the file
        const validStart = edit.startLine >= 1 && edit.startLine <= lineCount;
        // For endLine, we need to check it's >= startLine and doesn't exceed lineCount
        const validEnd =
          edit.endLine >= edit.startLine && edit.endLine <= lineCount;
        const valid = validStart && validEnd;
        if (!valid) {
          if (!validStart) {
            console.warn(
              `Skipping ${edit.type} edit: Start line ${edit.startLine} is out of bounds (file has ${lineCount} lines)`
            );
          } else if (!validEnd) {
            console.warn(
              `Skipping ${edit.type} edit: End line ${edit.endLine} is out of bounds (file has ${lineCount} lines)`
            );
          }
        }
        return valid;
      }
    });

    // Check for overlapping edits among the boundary-valid ones
    const validEdits = detectOverlappingEdits(boundaryValidEdits);

    // Apply edits in reverse order
    for (const edit of validEdits) {
      switch (edit.type) {
        case "replace":
          updatedLines.splice(
            edit.startLine - 1,
            edit.endLine - edit.startLine + 1,
            ...edit.newCode
          );
          break;
        case "insertAbove":
          updatedLines.splice(edit.lineNumber - 1, 0, ...edit.newCode);
          break;
        case "insertBelow":
          updatedLines.splice(edit.lineNumber, 0, ...edit.newCode);
          break;
        case "delete":
          updatedLines.splice(
            edit.startLine - 1,
            edit.endLine - edit.startLine + 1
          );
          break;
      }
    }

    await writeFile(targetFile, updatedLines.join("\n"));
    await formatWithPrettier(targetFile);
    result = `File updated with incremental changes: ${targetFile}`;
  } else {
    result = "No valid edit instructions found in model response.";
  }

  return result;
}

export const bestEdit = async ({
  targetFile,
  chatHistory,
  emitEvent,
  threadId,
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
  emitEvent: (chunk: string, threadId: string | null) => void;
  threadId: string | null;
}) => {
  emitEvent("reading prompt", threadId);
  const prompt = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/best-prompt.md",
    "utf-8"
  );

  emitEvent("reading target file", threadId);
  
  let targetFileContent = "";
  let targetFileWithLineNumbers = "";
  
  try {
    targetFileContent = await readFile(targetFile, "utf-8");
    targetFileWithLineNumbers = addLineNumbers(targetFileContent);
  } catch (error) {
    // File doesn't exist, handle gracefully
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      emitEvent(`Target file does not exist, will create it: ${targetFile}`, threadId);
      // Create empty content with line numbers
      targetFileContent = "";
      targetFileWithLineNumbers = "1: ";
      
      // Create directory structure if needed
      const dir = path.dirname(targetFile);
      if (!existsSync(dir)) {
        emitEvent(`Creating directory: ${dir}`, threadId);
        await mkdir(dir, { recursive: true });
      }
    } else {
      // Some other error occurred
      throw error;
    }
  }

  emitEvent("streaming text", threadId);
  const { fullStream, text } = streamText({
    model: openai("gpt-4o"),
    // model: google("gemini-2.5-pro-exp-03-25"),
    maxTokens: 8000,
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
  ${await getCodebaseIndexPrompt()}
  </codebase>

  <chatHistory>
  ${chatMessagesToString(chatHistory)}
  </chatHistory>

  <fileToEdit>
  ${targetFileWithLineNumbers}
  </fileToEdit>
</data>
`,
      },
    ],
  });

  for await (const obj of fullStream) {
    switch (obj.type) {
      case "tool-call-delta": {
        emitEvent(obj.argsTextDelta, threadId);
        break;
      }
      case "error": {
        emitEvent(`Error: ${(obj.error as Error).message}`, threadId);
        break;
      }
      case "redacted-reasoning": {
        emitEvent(`Redacted reasoning: ${obj.data}`, threadId);
        break;
      }
      case "reasoning": {
        emitEvent(obj.textDelta, threadId);
        break;
      }
      case "tool-call": {
        emitEvent(`Tool call: ${obj.toolName}`, threadId);
        break;
      }
      case "finish": {
        emitEvent("Finished reason:" + obj.finishReason, threadId);
        break;
      }
      case "tool-call-streaming-start": {
        emitEvent(`Starting tool call: ${obj.toolName}`, threadId);
        break;
      }
      case "text-delta": {
        emitEvent(obj.textDelta, threadId);
        break;
      }
    }
  }

  // Process the model's response after the stream completes
  const result = await parseModelResponse(await text, targetFile);
  return result;
};

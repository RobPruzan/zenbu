// export const

import { streamText } from "ai";
import { ChatMessage } from "../../ws/utils.js";
import * as prettier from "prettier";
import { anthropic } from "@ai-sdk/anthropic";
import { readFile, writeFile } from "node:fs/promises";
import { chatMessagesToString } from "../message-runtime.js";

/**
 * The view command allows Claude to examine the contents of a file or list the contents of a directory. It can read the entire file or a specific range of lines.

Parameters:

command: Must be "view"
path: The path to the file or directory to view
view_range (optional): An array of two integers specifying the start and end line numbers to view. Line numbers are 1-indexed, and -1 for the end line means read to the end of the file. This parameter only applies when viewing files, not directories.



The str_replace command allows Claude to replace a specific string in a file with a new string. This is used for making precise edits.

Parameters:

command: Must be "str_replace"
path: The path to the file to modify
old_str: The text to replace (must match exactly, including whitespace and indentation)
new_str: The new text to insert in place of the old text


The create command allows Claude to create a new file with specified content.

Parameters:

command: Must be "create"
path: The path where the new file should be created
file_text: The content to write to the new file


The insert command allows Claude to insert text at a specific location in a file.

Parameters:

command: Must be "insert"
path: The path to the file to modify
insert_line: The line number after which to insert the text (0 for beginning of file)
new_str: The text to insert


The undo_edit command allows Claude to revert the last edit made to a file.

Parameters:

command: Must be "undo_edit"
path: The path to the file whose last edit should be undone


 */

/**
 *
 *
 * observation: they want this to be agentic and work generally
 *
 * they did not make this this for a one shot edit on a file
 *
 *
 * things I want:
 * - we already know the file we want to edit
 * - we already have the content of the file we want to edit
 * - if the file does not exist we tell claude it has to make it from scratch
 * - we definitely want insert + 0 for beginning of file (doing it both ways was silly)
 * - hm we don't really need undo edit since we will just ask the model if it looks right
 *
 *
 * it needs to be a textEditor model that does this since we need it to stream in
 *
 *
 * how do I want the text editor to reason? I suppose I can provide it the stringified chat history then allow it to act
 * normally
 *
 * this would allow a sensible system prompt, and i can avoid putting system prompt inside
 *
 * we may want fuzzy search + results when it messes up the search?
 */

export const textEditor = async ({
  fullChatHistory,
  filePath,
  emit,
  writeToPath,
  previousAttempt,
  failedMatch,
}: {
  fullChatHistory: Array<ChatMessage>;
  filePath: string;
  emit: (text: string) => void;
  writeToPath: string;
  previousAttempt?: string;
  failedMatch?: { oldStr: string; similarMatches: string[] };
}): Promise<string> => {
  const abortController = new AbortController();

  const fileContent = await readFile(filePath, "utf-8");
  const withLineNumbers = addLineNumbers(fileContent);

  const { textStream } = streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    maxTokens: 8000,
    onFinish: (reason) => {
      console.log("finished", reason.finishReason);
    },
    abortSignal: abortController.signal,
    messages: [
      {
        role: "system",
        content: textEditorSystemPrompt,
      },
      {
        role: "user",
        content: `\
<data>
  <chat_history>
  ${chatMessagesToString(fullChatHistory)}
  </chat_history>

  <file_content>
  ${withLineNumbers}
  </file_content>
  ${previousAttempt ? `
  <previous_attempt>
  ${previousAttempt}
  </previous_attempt>
  ` : ''}
  ${failedMatch ? `
  <error>
  No matches found for replacement: "${failedMatch.oldStr}".
  Closest matches were: ${JSON.stringify(failedMatch.similarMatches)}
  Please revise your edit to use one of the existing matches or a different approach.
  </error>
  ` : ''}
</data>\
`,
      },
    ],
  });
  let accResponse = "";

  try {
    for await (const txt of textStream) {
      accResponse += txt;

      emit(txt);

      const complete = isCommandsComplete(accResponse);

      if (complete) {
        abortController.abort();
      }
    }
  } catch {}

  const output = parseCommandOutput(accResponse);
  const { insertCommands, replaceCommands } = segmentCommands(output);

  // Start with the original file content
  let currentContent = fileContent;

  // Apply insert commands first
  if (insertCommands.length > 0) {
    for (const cmd of insertCommands) {
      currentContent = insertCodeAfterLine(
        currentContent,
        cmd.insert_line,
        cmd.new_str
      );
    }
  }

  // Then apply replace commands
  if (replaceCommands.length > 0) {
    for (const cmd of replaceCommands) {
      const result = await applyReplaceCommands([cmd], currentContent);
      switch (result.status) {
        case "no_match": {
          // Recursively retry with error feedback
          return textEditor({
            fullChatHistory,
            filePath,
            emit,
            writeToPath,
            previousAttempt: accResponse,
            failedMatch: {
              oldStr: cmd.old_str,
              similarMatches: result.similarMatches,
            },
          });
        }
        case "success": {
          currentContent = result.content;
          break;
        }
      }
    }
  }

  const syntaxResult = await checkSyntax(currentContent, filePath);

  if (!syntaxResult.valid) {
    throw new Error(`Syntax check failed: ${syntaxResult.error}`);
  }

  const formatted = await formatFileContent(currentContent, {
    filepath: filePath,
  });

  await writeFile(writeToPath, formatted);

  return formatted;
};

/**
 * Determines if the command output is complete by checking for both opening and closing tags.
 * @param output The raw output string to check
 * @returns True if the commands section is complete with opening and closing tags, false otherwise
 */
export const isCommandsComplete = (output: string): boolean => {
  return output.includes("<commands>") && output.includes("</commands>");
};

/**
 * Applies string_replace commands to a file.
 * Returns a discriminated union result based on success or specific error conditions.
 */
export const applyReplaceCommands = async (
  commands: StringReplaceCommand[],
  content: string
): Promise<
  | { status: "success"; content: string }
  | {
      status: "no_match";
      command: StringReplaceCommand;
      similarMatches: string[];
    }
> => {
  let fileContent = content;

  for (const command of commands) {
    const { old_str, new_str } = command;

    // Count occurrences of the string to replace
    const regex = new RegExp(escapeRegExp(old_str), "g");
    const matches = (fileContent.match(regex) || []).length;

    if (matches === 0) {
      // No matches found, find similar strings
      const similarMatches = findSimilarMatches(fileContent, old_str);
      return {
        status: "no_match",
        command,
        similarMatches,
      };
    } else if (matches > 1) {
      // Multiple matches found - replace all instances
      fileContent = fileContent.replace(regex, new_str);
    } else {
      // Exactly one match, perform the replacement
      fileContent = fileContent.replace(old_str, new_str);
    }
  }

  return {
    status: "success",
    content: fileContent,
  };
};

/**
 * Escapes special characters in a string for use in a regular expression.
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Finds similar matches to the provided string in the file content.
 * Returns the top 3 most similar matches.
 */
const findSimilarMatches = (
  fileContent: string,
  searchString: string
): string[] => {
  // Split the file content into lines and words for comparison
  const lines = fileContent.split("\n");
  const words = fileContent.split(/\s+/);
  const potentialMatches = [...lines, ...words];

  // Calculate similarity scores
  const scoredMatches = potentialMatches
    .filter((match) => match.length > 0)
    .map((match) => ({
      text: match,
      score: calculateSimilarity(match, searchString),
    }))
    .sort((a, b) => b.score - a.score);

  // Return top 3 unique matches
  const uniqueMatches = Array.from(
    new Set(scoredMatches.map((match) => match.text))
  ).slice(0, 3);

  return uniqueMatches;
};

/**
 * Calculates a similarity score between two strings.
 * Higher score means more similar.
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  // Count matching characters
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++;
    }
  }

  // Calculate Jaccard similarity
  return matches / longer.length;
};

/**
 * Segments an array of CommandResult into separate arrays of InsertAfterCommand and StringReplaceCommand.
 */
export const segmentCommands = (
  commands: CommandResult[]
): {
  insertCommands: InsertAfterCommand[];
  replaceCommands: StringReplaceCommand[];
} => {
  const insertCommands: InsertAfterCommand[] = [];
  const replaceCommands: StringReplaceCommand[] = [];

  for (const command of commands) {
    if (command.kind === "insert_after") {
      insertCommands.push(command);
    } else if (command.kind === "string_replace") {
      replaceCommands.push(command);
    }
  }

  return { insertCommands, replaceCommands };
};

/**
 * Applies insert_after commands to a file in bottom-up order (descending by line number).
 * This ensures that line numbers remain correct during multiple insertions.
 */
export const applyInsertCommands = async (
  commands: { kind: "insert_after"; insert_line: number; new_str: string }[],
  targetFilePath: string
): Promise<void> => {
  // Sort commands in descending order by line number (bottom-up)
  const sortedCommands = [...commands].sort(
    (a, b) => b.insert_line - a.insert_line
  );

  // Read the file content
  let fileContent = await readFile(targetFilePath, "utf-8");

  // Apply each command in bottom-up order
  for (const command of sortedCommands) {
    fileContent = insertCodeAfterLine(
      fileContent,
      command.insert_line,
      command.new_str
    );
  }

  // Write the modified content back to the file
  await writeFile(targetFilePath, fileContent, "utf-8");
};

const textEditorSystemPrompt = `\
[Instructions]
You are a powerful AI coding assistant, which will implement a text edit to a file provided based on the intent\
of another AI assistant- which is acting on behalf of a USER
You will be provided the chat history between a different AI assistant, and a USER. This will give\
you full context of what the user wanted and what the previous assistant wanted in the code edit\

[Data Format]
You will be provided with the chat history in the form of:
Assistant:...
User:...

This is what gives you context of what text edit you should be making.\

If the file has no content inside of it yet, the file provided will say "No content yet".\

The USER will be provide you the data in XML tags as follows:
<data>
  <chat_history>
  // chat history here
  </chat_history>
  <file_content>
  // file content with line numbers here
  </file_content>
</data>
[Rules]
- you must edit precisely what the intent was when you were brought into the conversation\
you may not make edits not related to what was intended. The user is poor, so if you make random changes\
they will not be able to feed their children.
- You will be provided with multiple was to edit the text in a file, you must pick the best tool for the job
- When the file is very large, you need to be extra careful that you do not introduce syntax errors,\
one way you can ensure this is being very explicit in the text edit you want

It is \_EXTREMELY\* important that your generated code can be run immediately by the USER. To ensure this, follow these instructions carefully:

1. Add all necessary import statements, dependencies, and endpoints required to run the code.
2. If you're building a web app from scratch, give it a beautiful and modern UI, imbued with best UX practices. 
3. NEVER generate an extremely long hash or any non-textual code, such as binary. These are not helpful to the USER and are very expensive.

[Text Edit Options]
## string_replace
- The string_replace command allows you to replace a specific string in a file with a new string. This is used for making precise edits.
Parameters:
  name: Must be string_replace
  old_str: The text to replace (must match exactly, including whitespace and indentation). If there are multiple results returned, all instances will be updated.
  new_str: The new text to insert in place of the old text

Both strings will be parsed directly out of the XML tags, so do not add extra indentation to format the XML, since that will be added to the search

Required response format:
<command>
  <name>
  string_replace
  </name>
  <old_str>// old text here (exactly what will be searched for)</old_str>
  <new_str>// new text here</new_str>
</command>

## insert_after
Parameters:
  name: Must be "insert"
  insert_line: The line number after which to insert the text (0 for beginning of file)
  new_str: The text to insert

Required response format:
<command>
  <name>
  insert_after
  </name>
  <insert_line>
  // line number here
  </insert_line>
  <new_str>// new text here</new_str>
</command>


You should send all the commands required to perform the full code edit in one response by using the commands xml tag.\
For example:
<commands>
  <command>
    <name>
    string_replace
    </name>
    <old_str>
    // old text here (exactly what will be searched for)
    </old_str>
    <new_str>
    // new text here
    </new_str>
  </command>

  <command>
    <name>
    insert_after
    </name>
    <insert_line>
    // line number here
    </insert_line>
    <new_str>// new text here</new_str>
  </command>
  // other commands as needed
</commands>\
`;

/**
 * Parses the string_replace command output from the model response.
 */
export const parseStringReplaceCommand = (
  commandContent: string
): { kind: "string_replace"; old_str: string; new_str: string } | null => {
  const oldStrMatch = commandContent.match(/<old_str>([\s\S]*?)<\/old_str>/);
  const newStrMatch = commandContent.match(/<new_str>([\s\S]*?)<\/new_str>/);

  if (!oldStrMatch || !newStrMatch) {
    return null;
  }

  // Normalize indentation and trim extra whitespace
  const normalizeString = (str: string) => {
    const lines = str.split("\n");
    const trimmedLines = lines.map((line) => line.trimEnd());
    // Remove empty lines at start and end
    while (trimmedLines[0]?.trim() === "") trimmedLines.shift();
    while (trimmedLines[trimmedLines.length - 1]?.trim() === "")
      trimmedLines.pop();
    return trimmedLines.join("\n");
  };

  return {
    kind: "string_replace",
    old_str: normalizeString(oldStrMatch[1]),
    new_str: normalizeString(newStrMatch[1]),
  };
};

/**
 * Parses the insert_after command output from the model response.
 */
export const parseInsertAfterCommand = (
  commandContent: string
): { kind: "insert_after"; insert_line: number; new_str: string } | null => {
  const insertLineMatch = commandContent.match(
    /<insert_line>([\s\S]*?)<\/insert_line>/
  );
  const newStrMatch = commandContent.match(/<new_str>([\s\S]*?)<\/new_str>/);

  if (!insertLineMatch || !newStrMatch) {
    return null;
  }

  const insertLine = parseInt(insertLineMatch[1].trim(), 10);
  if (isNaN(insertLine)) {
    return null;
  }

  // Normalize indentation and trim extra whitespace
  const normalizeString = (str: string) => {
    const lines = str.split("\n");
    const trimmedLines = lines.map((line) => line.trimEnd());
    // Remove empty lines at start and end
    while (trimmedLines[0]?.trim() === "") trimmedLines.shift();
    while (trimmedLines[trimmedLines.length - 1]?.trim() === "")
      trimmedLines.pop();
    return trimmedLines.join("\n");
  };

  return {
    kind: "insert_after",
    insert_line: insertLine,
    new_str: normalizeString(newStrMatch[1]),
  };
};

/**
 * Parses a single command from the command content.
 */
export const parseSingleCommand = (
  commandContent: string
): CommandResult | null => {
  const nameMatch = commandContent.match(/<name>([\s\S]*?)<\/name>/);
  if (!nameMatch) {
    return null;
  }

  const name = nameMatch[1].trim();

  if (name === "string_replace") {
    return parseStringReplaceCommand(commandContent);
  } else if (name === "insert_after") {
    return parseInsertAfterCommand(commandContent);
  }

  return null;
};

export type CommandResult = InsertAfterCommand | StringReplaceCommand;

type InsertAfterCommand = {
  kind: "insert_after";
  insert_line: number;
  new_str: string;
};

type StringReplaceCommand = {
  kind: "string_replace";
  old_str: string;
  new_str: string;
};

/**
 * Parses multiple commands from the model response.
 */
export const parseCommandOutput = (text: string): CommandResult[] => {
  const commandsMatch = text.match(/<commands>([\s\S]*?)<\/commands>/);
  if (!commandsMatch) {
    return [];
  }

  const commandsContent = commandsMatch[1];
  const commandMatches = commandsContent.matchAll(
    /<command>([\s\S]*?)<\/command>/g
  );

  const results: CommandResult[] = [];

  for (const match of commandMatches) {
    const commandContent = match[1];
    const parsedCommand = parseSingleCommand(commandContent);

    if (parsedCommand) {
      results.push(parsedCommand);
    }
  }

  return results;
};

/**
 * Adds line numbers to a file content string.
 * Each line is prefixed with its line number starting from 1.
 */
export const addLineNumbers = (fileContent: string): string => {
  if (!fileContent) return "";
  const lines = fileContent.split("\n");
  return lines.map((line, index) => `${index + 1}: ${line}`).join("\n");
};

/**
 * Inserts a code snippet after a specific line number in the file content.
 * Returns the modified file content with the new code inserted.
 */
export const insertCodeAfterLine = (
  fileContent: string,
  lineNumber: number,
  codeToInsert: string
): string => {
  const lines = fileContent.split("\n");

  if (lineNumber < 1 || lineNumber > lines.length) {
    throw new Error(
      `Line number ${lineNumber} is out of range (1-${lines.length})`
    );
  }

  const beforeInsertion = lines.slice(0, lineNumber);
  const afterInsertion = lines.slice(lineNumber);

  return [...beforeInsertion, codeToInsert, ...afterInsertion].join("\n");
};

/**
 * Formats file content using Prettier.
 *
 * @param fileContent - The content to format
 * @param options - Prettier options including parser type or filepath
 * @returns A promise that resolves to the formatted content
 */
export const formatFileContent = async (
  fileContent: string,
  options: prettier.Options
): Promise<string> => {
  try {
    if (!options.parser && !options.filepath) {
      throw new Error("Either parser or filepath must be specified in options");
    }

    // Base options that apply to all formats
    const baseOptions: prettier.Options = {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      endOfLine: "lf" as const,
    };

    // Determine parser based on file extension if not specified
    if (!options.parser && options.filepath) {
      const extension = options.filepath.split(".").pop()?.toLowerCase();
      switch (extension) {
        case "html":
          options = {
            ...baseOptions,
            ...options,
            parser: "html",
            htmlWhitespaceSensitivity: "css",
            bracketSameLine: false,
            bracketSpacing: true,
            singleQuote: false,
            proseWrap: "preserve",
          };
          break;
        case "css":
          options = {
            ...baseOptions,
            ...options,
            parser: "css",
          };
          break;
        case "json":
        case "jsonc":
          options = {
            ...baseOptions,
            ...options,
            parser: "json",
          };
          break;
        case "ts":
        case "tsx":
          options = {
            ...baseOptions,
            ...options,
            parser: "typescript",
          };
          break;
        case "js":
        case "jsx":
          options = {
            ...baseOptions,
            ...options,
            parser: "babel",
          };
          break;
      }
    }

    // For HTML specifically, we need to ensure proper newlines
    if (options.parser === "html") {
      const formatted = await prettier.format(fileContent, options);
      // Force newlines between tags if not present
      return formatted.replace(/><(?!\/)/g, ">\n<");
    }

    const formatted = await prettier.format(fileContent, options);
    return formatted;
  } catch (error) {
    console.error("Error formatting file content:", error);
    return fileContent;
  }
};

/**
 * Performs a syntax check on file content based on the file extension.
 *
 * @param fileContent - The content to check for syntax errors
 * @param filePath - The path of the file, used to determine the language
 * @returns A promise that resolves to an object with syntax validity and any errors
 */
export const checkSyntax = async (
  fileContent: string,
  filePath: string
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const extension = filePath.split(".").pop()?.toLowerCase();

    if (!extension) {
      return { valid: false, error: "Could not determine file extension" };
    }

    // JavaScript, TypeScript, JSX, TSX
    if (["js", "ts", "jsx", "tsx", "mjs", "cjs"].includes(extension)) {
      try {
        await prettier.format(fileContent, {
          parser:
            extension.includes("tsx") || extension.includes("jsx")
              ? "babel-ts"
              : extension.includes("ts")
                ? "typescript"
                : "babel",
          filepath: filePath,
        });
        return { valid: true };
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // CSS
    if (extension === "css") {
      try {
        await prettier.format(fileContent, { parser: "css" });

        // Remove comments and normalize whitespace
        const cssWithoutComments = fileContent
          .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
          .trim();

        // Basic CSS validation
        const errors = [];

        // Check for unclosed braces
        const openBraces = (cssWithoutComments.match(/{/g) || []).length;
        const closeBraces = (cssWithoutComments.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push("unclosed braces");
        }

        // Check for missing semicolons in declarations (but not for last property in rule)
        const missingTerminator =
          /[a-zA-Z0-9%'")\s](?!\s*}|;)\s*[a-zA-Z-]/g.test(cssWithoutComments);
        if (missingTerminator) {
          errors.push("missing semicolon");
        }

        // Check for empty declarations
        if (/{\s*}/g.test(cssWithoutComments)) {
          errors.push("empty rule");
        }

        // Check for invalid property values
        if (/:\s*;/.test(cssWithoutComments)) {
          errors.push("empty property value");
        }

        // Only return invalid if we found actual errors
        if (errors.length > 0) {
          return {
            valid: false,
            error: `Invalid CSS syntax: ${errors.join(", ")}`,
          };
        }

        // If prettier didn't throw and we found no errors, it's valid CSS
        return { valid: true };
      } catch (error) {
        // If prettier throws, it's invalid CSS
        return {
          valid: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // HTML
    if (extension === "html") {
      try {
        await prettier.format(fileContent, { parser: "html" });
        return { valid: true };
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // JSON and JSONC
    if (["json", "jsonc"].includes(extension)) {
      try {
        if (extension === "jsonc") {
          // Remove comments and trailing commas before parsing
          const withoutComments = fileContent
            .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
            .replace(/\/\/.*/g, "") // Remove single-line comments
            .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas
          try {
            JSON.parse(withoutComments);
            return { valid: true };
          } catch (error) {
            return {
              valid: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        } else {
          JSON.parse(fileContent);
          return { valid: true };
        }
      } catch (error) {
        return {
          valid: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Unsupported file type
    return {
      valid: true,
      error: `Syntax validation for .${extension} files is not supported`,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

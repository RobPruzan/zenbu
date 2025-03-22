import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { readFile, writeFile } from "node:fs/promises";
import { removeComments } from "../create-server.js";
import { ChatMessage } from "../ws/utils.js";

// Helper function to parse XML content
function parseXML<T>(xml: string, tagName: string): T | null {
  try {
    // Simple regex-based XML parsing for specific tag
    const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, "s");
    const match = xml.match(regex);
    return match ? (match[1].trim() as unknown as T) : null;
  } catch (error) {
    console.error("Error parsing XML:", error);
    return null;
  }
}

// Parse full edit decision XML
function parseEditDecision(
  xml: string
): { editType: string; explanation: string } | null {
  const editDecisionMatch = xml.match(
    /<editDecision>([\s\S]*?)<\/editDecision>/s
  );
  if (!editDecisionMatch) return null;

  const editDecisionXml = editDecisionMatch[1];
  const editType = parseXML<string>(editDecisionXml, "editType");
  const explanation = parseXML<string>(editDecisionXml, "explanation");

  if (!editType || !explanation) return null;

  return {
    editType,
    explanation,
  };
}

// Parse single edit XML
function parseSingleEdit(
  xml: string
): { startLine: number; endLine: number; replacementCode: string } | null {
  const editMatch = xml.match(/<edit>([\s\S]*?)<\/edit>/s);
  if (!editMatch) return null;

  const editXml = editMatch[1];
  const startLineStr = parseXML<string>(editXml, "startLine");
  const endLineStr = parseXML<string>(editXml, "endLine");
  const replacementCode = parseXML<string>(editXml, "replacementCode");

  if (!startLineStr || !endLineStr || !replacementCode) return null;

  return {
    startLine: parseInt(startLineStr, 10),
    endLine: parseInt(endLineStr, 10),
    replacementCode,
  };
}

// Parse multiple edits XML
function parseMultipleEdits(
  xml: string
): Array<{ startLine: number; endLine: number; replacementCode: string }> {
  const edits: Array<{
    startLine: number;
    endLine: number;
    replacementCode: string;
  }> = [];

  // Extract all <edit> blocks within <edits>
  const editsMatch = xml.match(/<edits>([\s\S]*?)<\/edits>/s);
  if (!editsMatch) return edits;

  const editsContent = editsMatch[1];
  const editMatches = editsContent.matchAll(/<edit>([\s\S]*?)<\/edit>/g);

  for (const match of editMatches) {
    const editXml = match[1];
    const startLineStr = parseXML<string>(editXml, "startLine");
    const endLineStr = parseXML<string>(editXml, "endLine");
    const replacementCode = parseXML<string>(editXml, "replacementCode");

    if (startLineStr && endLineStr && replacementCode) {
      edits.push({
        startLine: parseInt(startLineStr, 10),
        endLine: parseInt(endLineStr, 10),
        replacementCode,
      });
    }
  }

  return edits;
}

// Parse appended code XML
function parseAppendedCode(xml: string): string | null {
  return parseXML<string>(xml, "appendedCode");
}

// Parse rewritten file XML
function parseRewrittenFile(xml: string): string | null {
  return parseXML<string>(xml, "rewrittenFile");
}

export const smartEdit = ({
  targetFile,
  chatHistory,
  onChunk,
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
  onChunk: (chunk: string) => void;
}) => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      // 1. First, determine the edit type using the router model
      const routerPrompt = await getRouterPrompt({
        targetFile,
        chatHistory,
      });

      onChunk(`Analyzing file and determining optimal edit strategy...\n`);

      // Stream the router model's thinking process
      let accumulatedXml = "";

      const { textStream } = await streamText({
        model: anthropic("claude-3-7-sonnet-20250219"),
        prompt: routerPrompt,
        maxTokens: 8000,
        maxSteps: 100,
        // tools
      });

      for await (const text of textStream) {
        accumulatedXml += text;
        onChunk(text);
      }

      // Parse the XML response to get the edit type decision
      onChunk("parsing:" + accumulatedXml + "<-");
      const editTypeResult = parseEditDecision(accumulatedXml);

      if (!editTypeResult) {
        throw new Error(
          "Failed to determine edit type: couldn't parse XML response"
        );
      }

      onChunk(
        `\n\nDetermined edit type: ${editTypeResult.editType}\n${editTypeResult.explanation}\n\n`
      );

      // 2. Based on the edit type, use the appropriate prompt and execution strategy
      let result = "";

      if (editTypeResult.editType === "append") {
        // For append only
        const appendPrompt = await getAppendPrompt({
          targetFile,
          chatHistory,
        });

        result = await generateAppend({
          prompt: appendPrompt,
          targetFile,
          onChunk,
        });
      } else if (editTypeResult.editType === "single_contiguous_edit") {
        // For single contiguous edit
        const singleEditPrompt = await getSingleEditPrompt({
          targetFile,
          chatHistory,
        });

        result = await generateSingleEdit({
          prompt: singleEditPrompt,
          targetFile,
          onChunk,
        });
      } else if (editTypeResult.editType === "multiple_logical_edits") {
        // For multiple logical edits
        const multiEditPrompt = await getMultipleEditsPrompt({
          targetFile,
          chatHistory,
        });

        result = await generateMultipleEdits({
          prompt: multiEditPrompt,
          targetFile,
          onChunk,
        });
      } else if (editTypeResult.editType === "full_file_rewrite") {
        // For full file rewrite
        const rewritePrompt = await getFullRewritePrompt({
          targetFile,
          chatHistory,
        });

        result = await generateFullRewrite({
          prompt: rewritePrompt,
          targetFile,
          onChunk,
        });
      }

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

// Router prompt to determine the edit type
async function getRouterPrompt({
  targetFile,
  chatHistory,
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
}) {
  const fileContent = await readFile(targetFile, "utf-8");

  const routerPromptTemplate = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/router-prompt.md",
    "utf-8"
  ).then(removeComments);

  return routerPromptTemplate
    .replace("{fileContent}", fileContent)
    .replace("{chatHistory}", JSON.stringify(chatHistory));
}

// Single contiguous edit prompt
async function getSingleEditPrompt({
  targetFile,
  chatHistory,
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
}) {
  const fileContent = await readFile(targetFile, "utf-8");
  const fileContentWithLineNumbers = fileContent
    .split("\n")
    .map((line, i) => `${i + 1}: ${line}`)
    .join("\n");

  const singleEditPromptTemplate = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/single-edit-prompt.md",
    "utf-8"
  ).then(removeComments);

  return singleEditPromptTemplate
    .replace("{fileContentWithLineNumbers}", fileContentWithLineNumbers)
    .replace("{chatHistory}", JSON.stringify(chatHistory));
}

// Multiple logical edits prompt
async function getMultipleEditsPrompt({
  targetFile,
  chatHistory,
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
}) {
  const fileContent = await readFile(targetFile, "utf-8");
  const fileContentWithLineNumbers = fileContent
    .split("\n")
    .map((line, i) => `${i + 1}: ${line}`)
    .join("\n");

  const multipleEditsPromptTemplate = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/multiple-edits-prompt.md",
    "utf-8"
  ).then(removeComments);

  return multipleEditsPromptTemplate
    .replace("{fileContentWithLineNumbers}", fileContentWithLineNumbers)
    .replace("{chatHistory}", JSON.stringify(chatHistory));
}

// Full file rewrite prompt
async function getFullRewritePrompt({
  targetFile,
  chatHistory,
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
}) {
  const fileContent = await readFile(targetFile, "utf-8");

  const fullRewritePromptTemplate = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/full-rewrite-prompt.md",
    "utf-8"
  ).then(removeComments);

  return fullRewritePromptTemplate
    .replace("{fileContent}", fileContent)
    .replace("{chatHistory}", JSON.stringify(chatHistory));
}

// Append prompt to add code to the end of a file
async function getAppendPrompt({
  targetFile,
  chatHistory,
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
}) {
  const fileContent = await readFile(targetFile, "utf-8");

  const appendPromptTemplate = await readFile(
    "/Users/robby/zenbu/packages/zenbu-plugin/src/append-prompt.md",
    "utf-8"
  ).then(removeComments);

  return appendPromptTemplate
    .replace("{fileContent}", fileContent)
    .replace("{chatHistory}", JSON.stringify(chatHistory));
}

// Function to generate and apply a single contiguous edit
async function generateSingleEdit({
  prompt,
  targetFile,
  onChunk,
}: {
  prompt: string;
  targetFile: string;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  onChunk(`Generating single contiguous edit...\n`);

  let accumulatedXml = "";

  // Stream the model's response
  const { textStream } = await streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    prompt,
    maxTokens: 8000,
    maxSteps: 50,
  });

  for await (const text of textStream) {
    accumulatedXml += text;
    onChunk(text);
  }

  // Parse the XML to get the edit
  const editObject = parseSingleEdit(accumulatedXml);

  if (!editObject) {
    throw new Error("Failed to generate edit: couldn't parse XML response");
  }

  onChunk(
    `\n\nGenerated single edit from line ${editObject.startLine} to ${editObject.endLine}\n`
  );
  onChunk(`Replacement code:\n${editObject.replacementCode}\n\n`);

  // Read the file content
  const fileContent = await readFile(targetFile, "utf-8");
  const lines = fileContent.split("\n");

  // Apply the edit (note: array is 0-indexed, but the edit uses 1-indexed lines)
  const newLines = [
    ...lines.slice(0, editObject.startLine - 1),
    ...editObject.replacementCode.split("\n"),
    ...lines.slice(editObject.endLine),
  ];

  const result = newLines.join("\n");

  onChunk(`Applying edit to file...\n`);

  // Write the result back to the file
  await writeFile(targetFile, result);

  onChunk(`Edit successfully applied!\n`);

  return result;
}

// Function to generate and apply multiple logical edits
async function generateMultipleEdits({
  prompt,
  targetFile,
  onChunk,
}: {
  prompt: string;
  targetFile: string;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  onChunk(`Generating multiple logical edits...\n`);

  let accumulatedXml = "";

  // Stream the model's response
  const { textStream } = await streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    prompt,
    maxTokens: 5000,
    maxSteps: 50,
  });

  for await (const text of textStream) {
    accumulatedXml += text;
    onChunk(text);
  }

  // Parse the XML to get the edits
  const edits = parseMultipleEdits(accumulatedXml);

  if (edits.length === 0) {
    throw new Error(
      "Failed to generate edits: couldn't parse XML response or no edits found"
    );
  }

  onChunk(`\n\nGenerated ${edits.length} separate edits\n`);

  // Check for overlapping edits
  const sortedForOverlapCheck = [...edits].sort(
    (a, b) => a.startLine - b.startLine
  );
  for (let i = 0; i < sortedForOverlapCheck.length - 1; i++) {
    const currentEdit = sortedForOverlapCheck[i];
    const nextEdit = sortedForOverlapCheck[i + 1];

    if (currentEdit.endLine >= nextEdit.startLine) {
      throw new Error(
        `Overlapping edits detected: Edit at lines ${currentEdit.startLine}-${currentEdit.endLine} overlaps with edit at lines ${nextEdit.startLine}-${nextEdit.endLine}`
      );
    }
  }

  // Read the file content
  let fileContent = await readFile(targetFile, "utf-8");
  let lines = fileContent.split("\n");

  // Sort edits by line number in descending order (bottom to top)
  // This ensures line numbers remain valid as we apply edits
  const sortedEdits = [...edits].sort((a, b) => b.startLine - a.startLine);

  onChunk(
    `Applying edits in bottom-up order to maintain line number accuracy\n`
  );

  // Apply edits in reverse order (bottom-up) to avoid line number shifts
  for (const edit of sortedEdits) {
    onChunk(`Applying edit from line ${edit.startLine} to ${edit.endLine}\n`);
    onChunk(`Replacement code:\n${edit.replacementCode}\n\n`);

    // Apply the edit (note: array is 0-indexed, but the edit uses 1-indexed lines)
    lines = [
      ...lines.slice(0, edit.startLine - 1),
      ...edit.replacementCode.split("\n"),
      ...lines.slice(edit.endLine),
    ];
  }

  const result = lines.join("\n");

  onChunk(`Applying all edits to file...\n`);

  // Write the result back to the file
  await writeFile(targetFile, result);

  onChunk(`Edits successfully applied!\n`);

  return result;
}

// Function to generate and apply a full file rewrite
async function generateFullRewrite({
  prompt,
  targetFile,
  onChunk,
}: {
  prompt: string;
  targetFile: string;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  onChunk(`Generating full file rewrite...\n`);

  let accumulatedXml = "";

  // Stream the model's response
  const { textStream } = await streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    prompt,
    maxTokens: 8000,
    maxSteps: 50,
  });

  for await (const text of textStream) {
    accumulatedXml += text;
    onChunk(text);
  }

  // Parse the XML to get the rewritten file
  const rewrittenFile = parseRewrittenFile(accumulatedXml);

  if (!rewrittenFile) {
    throw new Error(
      "Failed to generate full file rewrite: couldn't parse XML response"
    );
  }

  onChunk(`\n\nApplying full file rewrite...\n`);

  // Write the result back to the file
  await writeFile(targetFile, rewrittenFile);

  onChunk(`Full file rewrite successfully applied!\n`);

  return rewrittenFile;
}

// Function to generate and append code to the end of a file
async function generateAppend({
  prompt,
  targetFile,
  onChunk,
}: {
  prompt: string;
  targetFile: string;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  onChunk(`Generating code to append to file...\n`);

  let accumulatedXml = "";

  // Stream the model's response
  const { textStream } = await streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    prompt,
    maxTokens: 4000,
    maxSteps: 50,
  });

  for await (const text of textStream) {
    accumulatedXml += text;
    onChunk(text);
  }

  // Parse the XML to get the appended code
  const appendedCode = parseAppendedCode(accumulatedXml);

  if (!appendedCode) {
    throw new Error(
      "Failed to generate append code: couldn't parse XML response"
    );
  }

  onChunk(`\n\nAppending code to file...\n`);

  // Read the existing file content
  const existingContent = await readFile(targetFile, "utf-8");

  // Determine if we need to add a newline before appending
  const needsNewline = !existingContent.endsWith("\n");
  const separator = needsNewline ? "\n\n" : "\n";

  // Combine the existing content with the new code
  const result = existingContent + separator + appendedCode;

  // Write the result back to the file
  await writeFile(targetFile, result);

  onChunk(`Code successfully appended!\n`);

  return result;
}

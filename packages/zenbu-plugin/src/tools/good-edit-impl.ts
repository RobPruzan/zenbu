import { ChatMessage } from "../ws/utils.js";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { readFile, writeFile } from "node:fs/promises";
import { generateObject, streamText } from "ai";
import { z } from "zod";
import { editFile } from "./edit.js";
import { removeComments } from "../create-server.js";

export const smartEdit = ({targetFile, chatHistory, onChunk}: {
  targetFile: string, 
  chatHistory: Array<ChatMessage>, 
  onChunk: (chunk: string) => void
}) => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      // 1. First, determine the edit type using the router model
      const routerPrompt = await getRouterPrompt({
        targetFile,
        chatHistory
      });

      // Call router model to determine edit type
      const { object: editType } = await generateObject({
        model: anthropic("claude-3-7-sonnet-20250219"),
        prompt: routerPrompt,
        schema: z.object({
          editType: z.enum([
            "append",
            "single_contiguous_edit", 
            "multiple_logical_edits", 
            "full_file_rewrite"
          ]),
          explanation: z.string()
        })
      });

      onChunk(`Determined edit type: ${editType.editType}\n${editType.explanation}\n\n`);

      // 2. Based on the edit type, use the appropriate prompt and execution strategy
      let result = "";
      
      if (editType.editType === "append") {
        // For append only
        const appendPrompt = await getAppendPrompt({
          targetFile,
          chatHistory
        });
        
        result = await generateAppend({
          prompt: appendPrompt,
          targetFile,
          onChunk
        });
      }
      else if (editType.editType === "single_contiguous_edit") {
        // For single contiguous edit
        const singleEditPrompt = await getSingleEditPrompt({
          targetFile,
          chatHistory
        });
        
        result = await generateSingleEdit({
          prompt: singleEditPrompt,
          targetFile,
          onChunk
        });
      } 
      else if (editType.editType === "multiple_logical_edits") {
        // For multiple logical edits
        const multiEditPrompt = await getMultipleEditsPrompt({
          targetFile,
          chatHistory
        });
        
        result = await generateMultipleEdits({
          prompt: multiEditPrompt,
          targetFile,
          onChunk
        });
      } 
      else if (editType.editType === "full_file_rewrite") {
        // For full file rewrite
        const rewritePrompt = await getFullRewritePrompt({
          targetFile,
          chatHistory
        });
        
        result = await generateFullRewrite({
          prompt: rewritePrompt,
          targetFile,
          onChunk
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
  chatHistory
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
  chatHistory
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
}) {
  const fileContent = await readFile(targetFile, "utf-8");
  const fileContentWithLineNumbers = fileContent
    .split('\n')
    .map((line, i) => `${i + 1}: ${line}`)
    .join('\n');
  
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
  chatHistory
}: {
  targetFile: string;
  chatHistory: Array<ChatMessage>;
}) {
  const fileContent = await readFile(targetFile, "utf-8");
  const fileContentWithLineNumbers = fileContent
    .split('\n')
    .map((line, i) => `${i + 1}: ${line}`)
    .join('\n');
  
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
  chatHistory
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
  chatHistory
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
  onChunk
}: {
  prompt: string;
  targetFile: string;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  const { object } = await generateObject({
    model: anthropic("claude-3-7-sonnet-20250219"),
    prompt,
    schema: z.object({
      startLine: z.number(),
      endLine: z.number(),
      replacementCode: z.string()
    })
  });

  onChunk(`Generating single edit from line ${object.startLine} to ${object.endLine}\n`);
  
  // Read the file content
  const fileContent = await readFile(targetFile, "utf-8");
  const lines = fileContent.split('\n');
  
  // Apply the edit (note: array is 0-indexed, but the edit uses 1-indexed lines)
  const newLines = [
    ...lines.slice(0, object.startLine - 1),
    ...object.replacementCode.split('\n'),
    ...lines.slice(object.endLine)
  ];
  
  const result = newLines.join('\n');
  
  // Write the result back to the file
  await writeFile(targetFile, result);
  
  return result;
}

// Function to generate and apply multiple logical edits
async function generateMultipleEdits({
  prompt,
  targetFile,
  onChunk
}: {
  prompt: string;
  targetFile: string;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  const { object } = await generateObject({
    model: anthropic("claude-3-7-sonnet-20250219"),
    prompt,
    schema: z.object({
      edits: z.array(z.object({
        startLine: z.number(),
        endLine: z.number(),
        replacementCode: z.string()
      }))
    })
  });

  onChunk(`Generating ${object.edits.length} separate edits\n`);
  
  // Read the file content
  let fileContent = await readFile(targetFile, "utf-8");
  let lines = fileContent.split('\n');
  
  // Apply edits in reverse order (bottom-up) to avoid line number shifts
  for (const edit of object.edits) {
    onChunk(`Applying edit from line ${edit.startLine} to ${edit.endLine}\n`);
    
    // Apply the edit (note: array is 0-indexed, but the edit uses 1-indexed lines)
    lines = [
      ...lines.slice(0, edit.startLine - 1),
      ...edit.replacementCode.split('\n'),
      ...lines.slice(edit.endLine)
    ];
  }
  
  const result = lines.join('\n');
  
  // Write the result back to the file
  await writeFile(targetFile, result);
  
  return result;
}

// Function to generate and apply a full file rewrite
async function generateFullRewrite({
  prompt,
  targetFile,
  onChunk
}: {
  prompt: string;
  targetFile: string;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  let accEdit = "";
  
  onChunk(`Generating full file rewrite\n`);
  
  const { textStream } = await streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    prompt
  });

  for await (const text of textStream) {
    accEdit += text;
    onChunk(text);
  }

  // Extract code from potential markdown code block
  const codeBlockMatch = accEdit.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  const cleanedCode = codeBlockMatch ? codeBlockMatch[1] : accEdit;
  
  // Write the result back to the file
  await writeFile(targetFile, cleanedCode);
  
  return cleanedCode;
}

// Function to generate and append code to the end of a file
async function generateAppend({
  prompt,
  targetFile,
  onChunk
}: {
  prompt: string;
  targetFile: string;
  onChunk: (chunk: string) => void;
}): Promise<string> {
  let appendedCode = "";
  
  onChunk(`Generating code to append to file\n`);
  
  const { textStream } = await streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    prompt
  });

  for await (const text of textStream) {
    appendedCode += text;
    onChunk(text);
  }

  // Extract code from potential markdown code block
  const codeBlockMatch = appendedCode.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  const cleanedCode = codeBlockMatch ? codeBlockMatch[1] : appendedCode;
  
  // Read the existing file content
  const existingContent = await readFile(targetFile, "utf-8");
  
  // Determine if we need to add a newline before appending
  const needsNewline = !existingContent.endsWith('\n');
  const separator = needsNewline ? '\n\n' : '\n';
  
  // Combine the existing content with the new code
  const result = existingContent + separator + cleanedCode;
  
  // Write the result back to the file
  await writeFile(targetFile, result);
  
  return result;
}
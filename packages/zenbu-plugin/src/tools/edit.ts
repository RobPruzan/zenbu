import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
/**
 * 
 * 
 * outline, the function takes:
    "target_file": "File to edit",
    "instructions": "Single sentence instruction",
    "code_edit": "The code edit to make",
    "blocking": "Whether to block further edits"


 * 
 *
 * not sure what blocking edit means, oh i get it, if you should edit and continue, or edit and wait for the result
 * 
 * gr that seems tough in the case it fails how do you handle it? Maybe you just async report it or something, or batch it? idk
 * 
 * 
 * okay target file is easy (i suppose that's just all the text of the file? Do you chunk it?)
 * 
 * the model will describe the edit
 * 
 * the model will provide the actual code edit
 */

export type EditFileParams = {
  targetFile: string;
  instructions: string;
  codeEdit: string;
  onChunk: (chunk: string) => void;
  // no blocking for now, don't see a ton of value and introduces a ton of complexity
};

import { generateText, streamText } from "ai";
import { readFile } from "fs/promises";

export const editFile = async ({
  codeEdit,
  instructions,
  targetFile,
  onChunk,
}: EditFileParams) => {
  // we need a prompt for the edit model
  /**
   * needs to know:
   *
   * the file to edit on
   *
   * what the goal of the edit is
   *
   * what the code edit
   */

  const prompt = `
You will be provided with a partial edit of a file which is a proposed code edit to implement a change. You will also\
be provided with the entire file that the proposed edit should be applied on. You need to rewrite this entire file with the proposed
change exactly. You must not omit any code since your code output will be written directly back to the file.

You may wrap the code in the \`\`\`language \`\`\` pattern, 

<code-edit>
${codeEdit}
</code-edit>

<target-file>
${await readFile(targetFile, "utf-8")}
</target-file>
  `;

  console.log("fast editing");

  const result = await fastEdit(prompt, onChunk);
  console.log("fast edit result", result);

  return result;
};

const fastEdit = async (prompt: string, onChunk: (chunk: string) => void) => {
  let accResult = "";
  const { textStream, finishReason } = streamText({
    // model: groq("llama-3.3-70b-versatile"),
    // @ts-expect-error
    model: groq("llama3-70b-8192"),
    prompt,
  });
  for await (const textPart of textStream) {
    console.log("we got a text chunk", textPart);

    onChunk(textPart);
    accResult += textPart;
  }

  console.log("reason", await finishReason);

  const codeBlockMatch = accResult.match(/```(\w+)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[2];
  }

  return accResult;
};

import { groq } from "@ai-sdk/groq";
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
You are a precise coding AI model that takes in entire files of code, and a requested edit to that file of code, and\
outputs the entire file back with the edit requested applied\
The edit requested will contain the special comment  "// ... existing code ..." to represent unchanged code in between edited lines.\
When you encounter this, you should write the exact code present in the file in that range. You must never omit ANY code\
as the result of your edit will be written directly to the file.\
The instructions of the edit will also be provided to you, so you have context on what the edit was trying to accomplish\


REMEMBER YOU MUST RETURN THE ENTIRE FILE NO MATTER WHAT, THIS WILL BE DIRECTLY WRITTEN BACK TO THE FILE

If there is no special content, just echo back the output and we will write the whole result back

<edit-instructions>
${instructions}
</edit-instructions>

<target-file>
${await readFile(targetFile, "utf-8")}
</target-file>


<code-edit>
${codeEdit}
</code-edit>
  `;

  const result = groqEdit(prompt, onChunk);

  return result;
};

const groqEdit = async (prompt: string, onChunk: (chunk: string) => void) => {
  let accResult = "";
  const { textStream } = streamText({
    // @ts-expect-error
    model: groq("llama-3.3-70b-versatile"),
    prompt,
  });
  for await (const textPart of textStream) {
    onChunk(textPart);
    accResult += textPart;
  }

  const codeBlockMatch = accResult.match(/```(\w+)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[2];
  }

  return accResult;
};

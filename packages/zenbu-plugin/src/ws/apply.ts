import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { ChatMessage } from "./utils.js";
import { anthropic } from "@ai-sdk/anthropic";
import { readFile, writeFile } from "node:fs/promises";

export const apply = ({
  edits,
  fileContent,
  instructions,
  model,
}: {
  model: "gpt-4o" | "gpt-4o-mini";
  fileContent: string;
  edits: string;
  instructions: string;
}) => {
  try {
    const maxTokens = model === "gpt-4o-mini" ? 8192 : 16384;
    const applySystemPrompt = `Apply code edits to the file and return the complete updated file.
Keep existing code unless instructed to remove it. Remove any comments about keeping code.
Return the complete file in a single code block.`;
    const applyPrompt = `<file>
\`\`\`
${fileContent}
\`\`\`
</file>

<edits>
\`\`\`
${edits}
\`\`\`
</edits>

<instructions>
${instructions}
</instructions>

Please apply the code edits to the file and return the COMPLETE new file content. Infer the <code_edits> as ALWAYS ADDING/CHANGING code, unless specifically instructed to remove code. Write a single \`\`\` code block of the entire file.`;
    // todo: context window check - prompt
    const result = streamText({
      model: openai(model),
      temperature: 0.5, // is this what we want, maybe?
      maxTokens,
      system: applySystemPrompt,
      prompt: applyPrompt,
      experimental_providerMetadata: {
        openai: {
          prediction: {
            type: "content",
            content: `\`\`\`
  ${fileContent}
  \`\`\``,
          },
        },
      },
    });
    return result;
  } catch (error) {
    throw new Error("Failed to apply code edits", { cause: error });
  }
};

export const editFileToolDescription = `\
<edit>
  <isOutputFullFile>
  // true or false if the output is the full file and can be directly written to the file
  </isOutputFullFile>
  <instructions>
  // A single sentence instruction describing what you are going to do for the sketched edit. Don't repeat what you have said previously in normal messages. And use it to disambiguate uncertainty in the edit.
  </instructions>
  <codeEdit>
  // Specify ONLY the precise lines of code that you wish to edit. **NEVER specify or write out unchanged code**. Instead, represent all unchanged code using the comment of the language you're editing in - example: \`// ...[existing code] <description of existing code> ...\`.
  </codeEdit>
  <reApply>
  // If the last edit was incorrect, set this to true to reapply the edit. Make sure to include the original edit in the code_edit argument.
  </reApply>
</edit>
`;

/**
 * Parses the edit result from the model output.
 * Extracts instructions, code edit, target file path, and reapply flag.
 */
export const parseEditResult = (
  text: string
): {
  instructions: string;
  code_edit: string;
  reapply: boolean;
  isOutputFullFile: boolean;
} => {
  const instructionsMatch = text.match(
    /<instructions>([\s\S]*?)<\/instructions>/
  );
  const instructions = instructionsMatch ? instructionsMatch[1].trim() : "";

  const codeEditMatch = text.match(/<codeEdit>([\s\S]*?)<\/codeEdit>/);
  const code_edit = codeEditMatch ? codeEditMatch[1].trim() : "";

  const reapplyMatch = text.match(/<reApply>([\s\S]*?)<\/reApply>/);
  const reapplyText = reapplyMatch
    ? reapplyMatch[1].trim().toLowerCase()
    : "false";
  const reapply = reapplyText === "true";

  const isOutputFullFileMatch = text.match(
    /<isOutputFullFile>([\s\S]*?)<\/isOutputFullFile>/
  );
  const isOutputFullFileText = isOutputFullFileMatch
    ? isOutputFullFileMatch[1].trim().toLowerCase()
    : "false";
  const isOutputFullFile = isOutputFullFileText === "true";

  return {
    instructions,
    code_edit,
    reapply,
    isOutputFullFile,
  };
};

export const editFileSpec = async ({
  chatHistory,
  emit,
  threadId,
  targetFilePath,
}: {
  chatHistory: Array<ChatMessage>;
  emit: (text: string, threadId: null | string) => void;
  threadId: null | string;
  targetFilePath: string;
}) => {
  const abortController = new AbortController();
  const { textStream } = streamText({
    abortSignal: abortController.signal,
    model: anthropic("claude-3-7-sonnet-20250219"),
    messages: [
      ...chatHistory,
      {
        role: "user",
        content:
          "Here is the latest content of the file you want to edit:\n" +
          (await readFile(targetFilePath)),
      },
      {
        role: "user",
        content:
          "Please provide the code edit using the following json output. Please do summarize the code you wrote after you have written it, after you provide the json the output should end:\n" +
          editFileToolDescription,
      },
    ],
  });

  let accumulatedText = "";
  for await (const txt of textStream) {
    emit(txt, threadId);
    accumulatedText += txt;

    try {
      parseEditResult(accumulatedText);
      abortController.abort();
      break;
    } catch (e) {}
  }

  const { code_edit, instructions, reapply, isOutputFullFile } =
    parseEditResult(accumulatedText);

  if (isOutputFullFile) {
    await writeFile(targetFilePath, code_edit);
    return code_edit;
  }

  const applyStream = apply({
    edits: code_edit,
    instructions,
    fileContent: await readFile(targetFilePath, "utf-8"),
    model: reapply ? "gpt-4o" : "gpt-4o-mini",
  });

  for await (const txt of applyStream.textStream) {
    emit(txt, threadId);
  }

  const applyText = await applyStream.text;

  const codeBlocks = extractCodeBlocks(applyText);

  if (codeBlocks.length !== 1) {
    return "Apply failed";
  }

  await writeFile(targetFilePath, codeBlocks[0]);

  return codeBlocks[0];
};

function extractCodeBlocks(text: string): string[] {
  const codeBlockRegex = /```(?:\w*\n)?([\s\S]*?)```/g;
  const blocks: string[] = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match[1]) {
      blocks.push(match[1].trim());
    }
  }

  return blocks;
}

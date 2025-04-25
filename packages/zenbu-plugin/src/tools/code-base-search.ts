import { execSync } from "child_process";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";

export const codeBaseSearch = async ({
  explanation,
  path,
  query,
}: {
  query: string;
  explanation: string;
  path: string;
  // not sure if we want target directories, maybe hint dirs? for now do nothing
}) => {
  // i basically just want to chunk and avoid massive files

  // maybe i can ask the model files/dirs to ignore? So it works generally? And then auto include things

  // todo: make this os idempotent
  const tree = execSync(`tree ${path}`, {
    encoding: "utf8",
  });

  // todo: ignore files with .gitignore like we did in million lint for the CLI should be easy to port

  const prompt = `\
We are performing a codebase search for relevant codeblocks given a provided query + an explanation of the query\
You will be provided the tree of the directory starting from the root of the project, and you are to determine\
all the paths of directories/files to DEFINITELY ignore, so that when we search over this subset we will 100%\
get the correct results. If you are not sure, include it.\
One massive goal is to remove useless files, especially those that are very large (like node_modules or build folders like .next or .vite)\


Please only remove definitely useless files, we are optimizing for speed, so if you try to be too exhaustive it will take too much time. Just filter definitely useless directories and never return more than 10-15

<user-query>
${query}
</user-query>

<query-explanation>
${explanation}
</query-explanation>


${tree}
`;

  const ignore = (
    await generateObject({
      // @ts-expect-error
      model: google("gemini-2.0-flash-lite-preview-02-05"),
      prompt,
      schema: z.array(z.string()),
    })
  ).object;

  // console.log("ignore result", ignore, "tree", tree);

  const codebase = await traverseCodebase(path, ignore);
  const stringCodebase = codeBaseToString(codebase);

  const codeSearchPrompt = `\
You will be provided the entire users codebase, a query, and an explanation of the query.\
Your goal will be to return all files to this query.

You should return the file if there's an a chance it helps inform the query

<user-query>
${query}
</user-query>

<query-explanation>
${explanation}
</query-explanation>

<codebase>
${stringCodebase}
</codebase>
`;

  console.log("codebase search prompt", codeSearchPrompt);

  const searchSpecifically = performance.now();
  const searchResult = await generateObject({
    // @ts-expect-error
    model: google("gemini-2.0-flash-lite-preview-02-05"),
    prompt: codeSearchPrompt,
    schema: z.array(
      z.object({
        path: z.string(),
        explanation: z.string(),
      })
    ),
  });

  console.log("the search result");

  return { searchResult, time: performance.now() - searchSpecifically };

  /**
   * 1. gen tree
   * 2. ask model what it wants to ignore for the provided query
   * 3. feed it to gemini
   *  - we either chunk or first determine if this is an expected result, for now we can just dump
   * 4. result is the function result, determine a useful structure if one exists later
   */
};

const codebaseCache = new Map<string, string>();

export const indexCodebase = async (
  path: string
) => {
  if (codebaseCache.has(path)) {
    return codebaseCache.get(path)!;
  }

  const codebase = await traverseCodebase(path, []);
  const stringCodebase = codeBaseToString(codebase);

  codebaseCache.set(path, stringCodebase);

  return stringCodebase;
};

const traverseCodebase = async (path: string, ignore: Array<string>) => {
  const files = await getAllFiles(path, ignore);
  // console.log("all files", files);

  const pathToContent: Array<{
    path: string;
    content: string;
  }> = [];

  await Promise.all(
    files.map(async (file) => {
      try {
        pathToContent.push({
          content: await readFile(file, "utf-8"),
          path: file,
        });
      } catch (error) {
        console.debug(`Skipping file ${file} due to encoding issues`);
      }
    })
  );

  // console.log("what we got", pathToContent);

  pathToContent.sort((a, b) =>
    a.path === b.path ? 0 : a.path < b.path ? -1 : 1
  );

  return pathToContent;
};

const codeBaseToString = (
  codebase: Array<{ path: string; content: string }>
) => {
  let acc = ``;

  codebase.forEach(({ content, path }) => {
    acc += `\
========================================
File: ${path}    
========================================    
${content}
`;
  });

  return acc;
};

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { HARD_CODED_USER_PROJECT_PATH } from "../ws/ws.js";

async function getAllFiles(
  dir: string,
  ignore: Array<string> = []
): Promise<Array<string>> {
  const defaultIgnore = [
    "node_modules",
    "dist",
    "build",
    ".next",
    ".vite",
    ".git",
    ".cache",
    "coverage",
    ".DS_Store",
    ".env",
    ".env.local",
    "bun.lock",
    "README.md"
  ];

  const ignorePatterns = [...defaultIgnore, ...ignore];

  let files = await readdir(dir, { withFileTypes: true });
  let filePaths = await Promise.all(
    files.map(async (file) => {
      let fullPath = join(dir, file.name);

      if (
        ignorePatterns.some(
          (pattern) => fullPath.includes(pattern) || file.name === pattern
        )
      ) {
        return null;
      }

      const path = file.isDirectory()
        ? await getAllFiles(fullPath, ignore)
        : fullPath;
      return path;
    })
  );

  return filePaths.filter((f) => f !== null).flat();
}

// console.log(
//   "search result:\n",
//   (
//     await codeBaseSearch({
//       path: "/Users/robby/zenbu",
//       query: "ai file edit implementation",
//       explanation:
//         "the user wants to know where the logic that handles file edits using a smaller and larger model happens",
//     })
//   ).searchResult
// );

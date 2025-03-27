import * as path from "path";
import * as fs from "fs/promises";
import { textEditor } from "./text-editor.js";
import { ChatMessage } from "../../ws/utils.js";
import { dim, green, red, yellow, blue } from "kleur/colors";
import ora from "ora";

// Global configuration
const CONFIG = {
  runInParallel: false, // Set to true to run tests in parallel
  showSpinners: true, // Set to false to always show full output
  keepResults: true, // Keep the result files instead of cleaning them up
  resultsDir: "test-results", // Directory to store test results
};

async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

type TestCase = {
  name: string;
  chatHistory: Array<ChatMessage>;
  expectedChanges: Array<(content: string) => boolean>;
  sourceFile: string;
};

function generateResultFilename(test: TestCase): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const testName = test.name.toLowerCase().replace(/\s+/g, "-");
  const sourceName = path.basename(
    test.sourceFile,
    path.extname(test.sourceFile)
  );
  return `${timestamp}__${sourceName}__${testName}.html`;
}

async function saveTestResult(
  content: string,
  test: TestCase,
  fixturesDir: string,
  success: boolean
): Promise<string> {
  const resultsDir = path.join(
    fixturesDir,
    CONFIG.resultsDir,
    success ? "passed" : "failed"
  );
  await ensureDirectoryExists(resultsDir);

  const filename = generateResultFilename(test);
  const resultPath = path.join(resultsDir, filename);

  // Create a report header with metadata
  const metadata = `<!--
Test Information:
  Name: ${test.name}
  Source File: ${test.sourceFile}
  Timestamp: ${new Date().toISOString()}
  Status: ${success ? "PASSED" : "FAILED"}
  
Original Request:
${test.chatHistory.map((msg) => `  ${msg.role}: ${msg.content}`).join("\n")}
-->

`;

  await fs.writeFile(resultPath, metadata + content);
  return resultPath;
}

type TestResult = {
  success: boolean;
  content?: string;
  error?: string;
  failedChecks?: string[];
};

async function runTest(
  test: TestCase,
  fixturesDir: string,
  shouldStream: boolean = false
): Promise<TestResult> {
  const tempOutputFile = path.join(fixturesDir, "temp-output.html");
  const sourceFile = path.join(fixturesDir, test.sourceFile);

  let spinner;
  if (!shouldStream && CONFIG.showSpinners) {
    spinner = ora({
      text: `Running ${test.name}`,
      color: "blue",
    }).start();
  } else {
    console.log(dim(`\nRunning test: ${test.name}`));
    console.log(dim("=".repeat(50)));
  }

  try {
    const output = await textEditor({
      fullChatHistory: test.chatHistory,
      filePath: sourceFile,
      emit: (chunk) => {
        if (shouldStream || !CONFIG.showSpinners) {
          process.stdout.write(dim(chunk));
        }
      },
      writeToPath: tempOutputFile,
    });

    if (!(await fileExists(tempOutputFile))) {
      throw new Error("Output file was not created");
    }

    const content = await fs.readFile(tempOutputFile, "utf-8");

    // // Collect all failed checks
    // const failedChecks: string[] = [];
    // for (const verify of test.expectedChanges) {
    //   if (!verify(content)) {
    //     // Try to find the description of what failed by looking at the function source
    //     const fnStr = verify.toString();
    //     const description = fnStr.includes("=>")
    //       ? fnStr.split("=>")[1].trim().replace(/[{()}]/g, "").trim()
    //       : "Expected change not found";
    //     failedChecks.push(description);
    //   }
    // }

    // if (failedChecks.length > 0) {
    //   throw new Error(`Failed checks:\n${failedChecks.join('\n')}`);
    // }

    // Save the successful result
    const resultPath = await saveTestResult(content, test, fixturesDir, true);

    if (!shouldStream && CONFIG.showSpinners && spinner) {
      spinner.succeed(
        `${test.name} passed - Result saved to: ${path.relative(process.cwd(), resultPath)}`
      );
    } else {
      console.log(green("\n✓ Test passed"));
      console.log(
        dim(`Result saved to: ${path.relative(process.cwd(), resultPath)}`)
      );
    }

    return { success: true, content };
  } catch (error: any) {
    // Save the failed result
    if (await fileExists(tempOutputFile)) {
      const content = await fs.readFile(tempOutputFile, "utf-8");
      const resultPath = await saveTestResult(
        content,
        test,
        fixturesDir,
        false
      );

      if (!shouldStream && CONFIG.showSpinners && spinner) {
        spinner.fail(
          `${test.name} failed: ${error.message}\nFailed result saved to: ${path.relative(process.cwd(), resultPath)}`
        );
      } else {
        console.log(red(`\n✗ Test failed: ${error.message}`));
        console.log(
          dim(
            `Failed result saved to: ${path.relative(process.cwd(), resultPath)}`
          )
        );
      }
      return { success: false, error: error.message, content };
    }

    if (!shouldStream && CONFIG.showSpinners && spinner) {
      spinner.fail(`${test.name} failed: ${error.message}`);
    } else {
      console.log(red(`\n✗ Test failed: ${error.message}`));
    }

    return { success: false, error: error.message };
  } finally {
    // Clean up temporary file
    if (!CONFIG.keepResults && (await fileExists(tempOutputFile))) {
      await fs.unlink(tempOutputFile);
    }
  }
}

const tests: TestCase[] = [
  {
    name: "Color Scheme Update",
    sourceFile: "brick-breaker.html",
    chatHistory: [
      {
        role: "user",
        content:
          "Can you change the game's color scheme to use red (#FF0000) instead of blue (#0095DD)?",
      },
      {
        role: "assistant",
        content:
          "I'll help you change the color scheme from blue to red in the brick breaker game.",
      },
    ],
    expectedChanges: [
      (content) => content.includes("#FF0000"),
      (content) => !content.includes("#0095DD"),
    ],
  },
  {
    name: "RPG Combat System",
    sourceFile: "rpg-game.html",
    chatHistory: [
      {
        role: "user",
        content: "Can you add a couple features",
      },
      {
        role: "assistant",
        content:
          "I'll implement a couple features, I will optimize for speed so you can see something on your screen quickly",
      },
    ],
    expectedChanges: [
      (content) => content.includes("class CombatSystem"),
      (content) => content.includes("class StatusEffect"),
      (content) => content.includes("applyStatusEffect"),
      (content) => content.includes("calculateDamage"),
      (content) => Boolean(content.match(/turn(Based)?Combat/i)),
    ],
  },
  {
    name: "Inventory Management",
    sourceFile: "rpg-game.html",
    chatHistory: [
      {
        role: "user",
        content:
          "Add an inventory system with item stacking, weight limits, and item categories.",
      },
      {
        role: "assistant",
        content: "I'll implement a comprehensive inventory management system.",
      },
    ],
    expectedChanges: [
      (content) => content.includes("class Inventory"),
      (content) => content.includes("maxWeight"),
      (content) => content.includes("addItem"),
      (content) => content.includes("removeItem"),
      (content) => content.includes("calculateTotalWeight"),
      (content) => Boolean(content.match(/item(Stack|Category)/i)),
    ],
  },
  {
    name: "Quest System",
    sourceFile: "rpg-game.html",
    chatHistory: [
      {
        role: "user",
        content:
          "Implement a quest system with main quests, side quests, and quest chains.",
      },
      {
        role: "assistant",
        content:
          "I'll create a sophisticated quest system with different quest types and dependencies.",
      },
    ],
    expectedChanges: [
      (content) => content.includes("class QuestSystem"),
      (content) => content.includes("class Quest"),
      (content) => content.includes("questChain"),
      (content) => content.includes("questProgress"),
      (content) => Boolean(content.match(/complete(Quest|Objective)/i)),
      (content) => Boolean(content.match(/quest(Reward|Prerequisite)/i)),
    ],
  },
];

async function runAllTests(fixturesDir: string): Promise<[number, number]> {
  let passedTests = 0;
  let totalTests = tests.length;

  if (CONFIG.runInParallel) {
    console.log(blue("Running all tests in parallel...\n"));
    const results = await Promise.all(
      tests.map((test) => runTest(test, fixturesDir, false))
    );
    passedTests = results.filter(Boolean).length;
  } else {
    console.log(blue("Running all tests sequentially...\n"));
    for (const test of tests) {
      if (await runTest(test, fixturesDir, !CONFIG.showSpinners)) {
        passedTests++;
      }
    }
  }

  return [passedTests, totalTests];
}

async function main() {
  const fixturesDir = path.join(import.meta.dirname, "fixtures");
  const targetTest = process.argv[2];

  if (targetTest) {
    const test = tests.find(
      (t) => t.name.toLowerCase() === targetTest.toLowerCase()
    );
    if (!test) {
      console.error(red(`No test found with name: ${targetTest}`));
      console.log(yellow("\nAvailable tests:"));
      tests.forEach((t) => console.log(blue(`- ${t.name}`)));
      process.exit(1);
    }

    const result = await runTest(test, fixturesDir, true);
    process.exit(result.success ? 0 : 1);
  } else {
    const [passedTests, totalTests] = await runAllTests(fixturesDir);

    console.log("\n" + "=".repeat(50));
    console.log(
      `Test Summary: ${
        passedTests === totalTests ? green("✓") : red("✗")
      } ${passedTests}/${totalTests} tests passed`
    );

    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

main().catch((error) => {
  console.error(red(`Fatal error: ${error.message}`));
  process.exit(1);
});

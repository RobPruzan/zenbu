import * as path from "path";
import * as fs from "fs/promises";
import { textEditor } from "./text-editor.js";
import { ChatMessage } from "../../ws/utils.js";
import { dim, green, red, yellow, blue } from "kleur/colors";
import ora from "ora";

// Global configuration
const CONFIG = {
  runInParallel: false, // Set to true to run tests in parallel
  showSpinners: true,   // Set to false to always show full output
};

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

async function runTest(
  test: TestCase,
  fixturesDir: string,
  shouldStream: boolean = false
): Promise<boolean> {
  const targetFile = path.join(fixturesDir, `${test.name.toLowerCase().replace(/\s+/g, "-")}.test-output.html`);
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

  // Clean up any existing output file
  if (await fileExists(targetFile)) {
    await fs.unlink(targetFile);
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
      writeToPath: targetFile,
    });

    if (!(await fileExists(targetFile))) {
      throw new Error("Output file was not created");
    }

    const content = await fs.readFile(targetFile, "utf-8");

    for (const verify of test.expectedChanges) {
      if (!verify(content)) {
        throw new Error("Expected changes were not found in the output");
      }
    }

    if (!shouldStream && CONFIG.showSpinners && spinner) {
      spinner.succeed(`${test.name} passed`);
    } else {
      console.log(green("\n✓ Test passed"));
    }
    return true;
  } catch (error: any) {
    if (!shouldStream && CONFIG.showSpinners && spinner) {
      spinner.fail(`${test.name} failed: ${error.message}`);
    } else {
      console.log(red(`\n✗ Test failed: ${error.message}`));
    }
    return false;
  } finally {
    if (await fileExists(targetFile)) {
      await fs.unlink(targetFile);
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
        content: "Can you change the game's color scheme to use red (#FF0000) instead of blue (#0095DD)?",
      },
      {
        role: "assistant",
        content: "I'll help you change the color scheme from blue to red in the brick breaker game.",
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
        content: "Can you implement a turn-based combat system with different attack types and status effects?",
      },
      {
        role: "assistant",
        content: "I'll implement a complex turn-based combat system with various attack types and status effects.",
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
        content: "Add an inventory system with item stacking, weight limits, and item categories.",
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
        content: "Implement a quest system with main quests, side quests, and quest chains.",
      },
      {
        role: "assistant",
        content: "I'll create a sophisticated quest system with different quest types and dependencies.",
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
    const test = tests.find((t) => t.name.toLowerCase() === targetTest.toLowerCase());
    if (!test) {
      console.error(red(`No test found with name: ${targetTest}`));
      console.log(yellow("\nAvailable tests:"));
      tests.forEach((t) => console.log(blue(`- ${t.name}`)));
      process.exit(1);
    }

    const passed = await runTest(test, fixturesDir, true);
    process.exit(passed ? 0 : 1);
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

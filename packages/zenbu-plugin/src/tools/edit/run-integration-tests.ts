import * as path from "path";
import * as fs from "fs/promises";
import { textEditor } from "./text-editor.js";
import { ChatMessage } from "../../ws/utils.js";
import { dim, green, red, yellow } from "kleur/colors";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runTest(
  name: string,
  chatHistory: Array<ChatMessage>,
  expectedChanges: Array<(content: string) => boolean>,
  fixturesDir: string
): Promise<boolean> {
  const sourceFile = path.join(fixturesDir, "brick-breaker.html");
  const targetFile = path.join(fixturesDir, "brick-breaker.test-output.html");

  console.log(dim(`\nRunning test: ${name}`));
  console.log(dim("=".repeat(50)));

  // Clean up any existing output file
  if (await fileExists(targetFile)) {
    await fs.unlink(targetFile);
  }

  try {
    // Run the text editor with streaming output
    await textEditor({
      fullChatHistory: chatHistory,
      filePath: sourceFile,
      emit: (chunk) => {
        process.stdout.write(dim(chunk));
      },
      writeToPath: targetFile,
    });

    // Verify the file was created
    if (!(await fileExists(targetFile))) {
      throw new Error("Output file was not created");
    }

    // Read the content and verify changes
    const content = await fs.readFile(targetFile, "utf-8");

    // Verify HTML syntax
    if (!content.match(/^<!DOCTYPE html>/)) {
      throw new Error("Invalid HTML: Missing DOCTYPE");
    }
    if (!content.match(/<\/html>$/)) {
      throw new Error("Invalid HTML: Missing closing HTML tag");
    }

    // Run all the expected change verifications
    for (const verify of expectedChanges) {
      if (!verify(content)) {
        throw new Error("Expected changes were not found in the output");
      }
    }

    console.log(green("\n✓ Test passed"));
    return true;
  } catch (error: any) {
    console.log(red(`\n✗ Test failed: ${error.message}`));
    return false;
  } finally {
    // Clean up test output file
    if (await fileExists(targetFile)) {
      await fs.unlink(targetFile);
    }
  }
}

async function main() {
  const fixturesDir = path.join(import.meta.dirname, "fixtures");
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Color Change
  totalTests++;
  if (
    await runTest(
      "Color Change Test",
      [
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
      [
        (content) => content.includes("#FF0000"),
        (content) => !content.includes("#0095DD"),
      ],
      fixturesDir
    )
  ) {
    passedTests++;
  }

  // Test 2: Lives Counter
  totalTests++;
  if (
    await runTest(
      "Lives Counter Test",
      [
        {
          role: "user",
          content:
            "Can you add a lives counter to the game? The player should start with 3 lives.",
        },
        {
          role: "assistant",
          content:
            "I'll add a lives counter to the game, initializing with 3 lives and updating the UI accordingly.",
        },
      ],
      [
        (content) => content.includes("Lives:"),
        (content) => content.includes("this.lives = 3"),
        (content) => Boolean(content.match(/lives.*span/i)),
        (content) => Boolean(content.match(/this\.lives/)),
        (content) => Boolean(content.match(/this\.lives\s*--/)),
      ],
      fixturesDir
    )
  ) {
    passedTests++;
  }

  // Test 3: Ball Speed
  totalTests++;
  if (
    await runTest(
      "Ball Speed Test",
      [
        {
          role: "user",
          content:
            "Can you make the ball speed increase gradually as more bricks are destroyed?",
        },
        {
          role: "assistant",
          content:
            "I'll modify the game mechanics to increase the ball speed gradually as the player destroys more bricks.",
        },
      ],
      [
        (content) => content.includes("speedMultiplier"),
        (content) => Boolean(content.match(/speed.*increase/i)),
        (content) => Boolean(content.match(/this\.ball\.dx.*=.*speed/i)),
        (content) => Boolean(content.match(/this\.ball\.dy.*=.*speed/i)),
      ],
      fixturesDir
    )
  ) {
    passedTests++;
  }

  // Print summary
  console.log("\n" + "=".repeat(50));
  console.log(
    `Test Summary: ${
      passedTests === totalTests ? green("✓") : red("✗")
    } ${passedTests}/${totalTests} tests passed`
  );

  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

main().catch((error) => {
  console.error(red(`Fatal error: ${error.message}`));
  process.exit(1);
});

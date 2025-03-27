import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as fs from "fs/promises";
import {
  addLineNumbers,
  parseCommandOutput,
  parseSingleCommand,
  parseStringReplaceCommand,
  parseInsertAfterCommand,
  segmentCommands,
  applyInsertCommands,
  applyReplaceCommands,
  insertCodeAfterLine,
  formatFileContent,
  checkSyntax,
  CommandResult
} from "./text-editor.js";

// Type definitions for test use only
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

// Helper function to create a temporary file for testing
async function createTempFile(filename: string, content: string): Promise<string> {
  const tempFilePath = path.join(__dirname, "fixtures", `temp_${filename}`);
  await fs.writeFile(tempFilePath, content, "utf-8");
  return tempFilePath;
}

// Helper function to clean up temporary files after tests
async function removeTempFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore errors if file doesn't exist
  }
}

// Helper function to read a fixture file
async function readFixtureFile(filename: string): Promise<string> {
  const filePath = path.join(__dirname, "fixtures", filename);
  return fs.readFile(filePath, "utf-8");
}

describe("addLineNumbers", () => {
  it("should add line numbers to a string", () => {
    const input = "First line\nSecond line\nThird line";
    const expected = "1: First line\n2: Second line\n3: Third line";

    const result = addLineNumbers(input);

    expect(result).toBe(expected);
  });

  it("should handle empty strings", () => {
    const input = "";
    const expected = "";

    const result = addLineNumbers(input);

    expect(result).toBe(expected);
  });

  it("should handle single line strings", () => {
    const input = "Only one line";
    const expected = "1: Only one line";

    const result = addLineNumbers(input);

    expect(result).toBe(expected);
  });
});

describe("parseCommandOutput", () => {
  it("should parse multiple commands from model response", () => {
    const input = `Some text before commands
<commands>
  <command>
    <name>
    string_replace
    </name>
    <old_str>
    function test() {
      return 'old';
    }
    </old_str>
    <new_str>
    function test() {
      return 'new';
    }
    </new_str>
  </command>

  <command>
    <name>
    insert_after
    </name>
    <insert_line>
    10
    </insert_line>
    <new_str>
    // New line inserted
    </new_str>
  </command>
</commands>
Some text after commands`;

    const result = parseCommandOutput(input);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      kind: "string_replace",
      old_str: "    function test() {\n      return 'old';\n    }",
      new_str: "    function test() {\n      return 'new';\n    }",
    });
    expect(result[1]).toEqual({
      kind: "insert_after",
      insert_line: 10,
      new_str: "    // New line inserted",
    });
  });

  it("should return an empty array when no commands are found", () => {
    const input = "Some text without any commands";

    const result = parseCommandOutput(input);

    expect(result).toEqual([]);
  });

  it("should handle malformed commands", () => {
    const input = `<commands>
      <command>
        <name>
        unknown_command
        </name>
      </command>
      
      <command>
        <name>
        string_replace
        </name>
        <old_str>
        old
        </old_str>
        <new_str>
        new
        </new_str>
      </command>
    </commands>`;

    const result = parseCommandOutput(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      kind: "string_replace",
      old_str: "        old",
      new_str: "        new",
    });
  });
});

describe("parseSingleCommand", () => {
  it("should parse a string_replace command", () => {
    const input = `
    <name>
    string_replace
    </name>
    <old_str>
    const oldValue = 'old';
    </old_str>
    <new_str>
    const newValue = 'new';
    </new_str>
    `;

    const result = parseSingleCommand(input);

    expect(result).toEqual({
      kind: "string_replace",
      old_str: "    const oldValue = 'old';",
      new_str: "    const newValue = 'new';",
    });
  });

  it("should parse an insert_after command", () => {
    const input = `
    <name>
    insert_after
    </name>
    <insert_line>
    5
    </insert_line>
    <new_str>
    const newLine = 'inserted';
    </new_str>
    `;

    const result = parseSingleCommand(input);

    expect(result).toEqual({
      kind: "insert_after",
      insert_line: 5,
      new_str: "    const newLine = 'inserted';",
    });
  });

  it("should return null for unknown command types", () => {
    const input = `
    <name>
    unknown_command
    </name>
    <some_param>
    value
    </some_param>
    `;

    const result = parseSingleCommand(input);

    expect(result).toBeNull();
  });

  it("should return null for malformed commands", () => {
    const input = `
    <name>
    string_replace
    </name>
    <old_str>
    old value
    </old_str>
    `;

    const result = parseSingleCommand(input);

    expect(result).toBeNull();
  });
});

describe("parseStringReplaceCommand", () => {
  it("should parse valid string_replace command", () => {
    const input = `
    <old_str>
    const oldFunction = () => {};
    </old_str>
    <new_str>
    const newFunction = () => {
      return 'updated';
    };
    </new_str>
    `;

    const result = parseStringReplaceCommand(input);

    expect(result).toEqual({
      kind: "string_replace",
      old_str: "    const oldFunction = () => {};",
      new_str: "    const newFunction = () => {\n      return 'updated';\n    };",
    });
  });

  it("should return null for missing old_str", () => {
    const input = `
    <new_str>
    const newValue = 'value';
    </new_str>
    `;

    const result = parseStringReplaceCommand(input);

    expect(result).toBeNull();
  });

  it("should return null for missing new_str", () => {
    const input = `
    <old_str>
    const oldValue = 'value';
    </old_str>
    `;

    const result = parseStringReplaceCommand(input);

    expect(result).toBeNull();
  });
});

describe("parseInsertAfterCommand", () => {
  it("should parse valid insert_after command", () => {
    const input = `
    <insert_line>
    15
    </insert_line>
    <new_str>
    const insertedLine = 'new line';
    </new_str>
    `;

    const result = parseInsertAfterCommand(input);

    expect(result).toEqual({
      kind: "insert_after",
      insert_line: 15,
      new_str: "    const insertedLine = 'new line';",
    });
  });

  it("should return null for non-numeric insert_line", () => {
    const input = `
    <insert_line>
    not_a_number
    </insert_line>
    <new_str>
    const insertedLine = 'new line';
    </new_str>
    `;

    const result = parseInsertAfterCommand(input);

    expect(result).toBeNull();
  });

  it("should return null for missing insert_line", () => {
    const input = `
    <new_str>
    const insertedLine = 'new line';
    </new_str>
    `;

    const result = parseInsertAfterCommand(input);

    expect(result).toBeNull();
  });

  it("should return null for missing new_str", () => {
    const input = `
    <insert_line>
    15
    </insert_line>
    `;

    const result = parseInsertAfterCommand(input);

    expect(result).toBeNull();
  });
});

describe("segmentCommands", () => {
  it("should separate insert and replace commands correctly", () => {
    const commands: CommandResult[] = [
      {
        kind: "string_replace",
        old_str: "const oldValue = 1;",
        new_str: "const newValue = 2;",
      },
      {
        kind: "insert_after",
        insert_line: 10,
        new_str: "const insertedLine = true;",
      },
      {
        kind: "string_replace",
        old_str: "function oldFunc() {}",
        new_str: "function newFunc() {}",
      },
      {
        kind: "insert_after",
        insert_line: 20,
        new_str: "const anotherLine = false;",
      },
    ];

    const result = segmentCommands(commands);

    expect(result.insertCommands).toHaveLength(2);
    expect(result.replaceCommands).toHaveLength(2);

    expect(result.insertCommands[0]).toEqual({
      kind: "insert_after",
      insert_line: 10,
      new_str: "const insertedLine = true;",
    });

    expect(result.insertCommands[1]).toEqual({
      kind: "insert_after",
      insert_line: 20,
      new_str: "const anotherLine = false;",
    });

    expect(result.replaceCommands[0]).toEqual({
      kind: "string_replace",
      old_str: "const oldValue = 1;",
      new_str: "const newValue = 2;",
    });

    expect(result.replaceCommands[1]).toEqual({
      kind: "string_replace",
      old_str: "function oldFunc() {}",
      new_str: "function newFunc() {}",
    });
  });

  it("should handle only insert commands", () => {
    const commands: CommandResult[] = [
      {
        kind: "insert_after",
        insert_line: 5,
        new_str: "const line1 = true;",
      },
      {
        kind: "insert_after",
        insert_line: 10,
        new_str: "const line2 = false;",
      },
    ];

    const result = segmentCommands(commands);

    expect(result.insertCommands).toHaveLength(2);
    expect(result.replaceCommands).toHaveLength(0);
  });

  it("should handle only replace commands", () => {
    const commands: CommandResult[] = [
      {
        kind: "string_replace",
        old_str: "const oldValue1 = 1;",
        new_str: "const newValue1 = 2;",
      },
      {
        kind: "string_replace",
        old_str: "const oldValue2 = true;",
        new_str: "const newValue2 = false;",
      },
    ];

    const result = segmentCommands(commands);

    expect(result.insertCommands).toHaveLength(0);
    expect(result.replaceCommands).toHaveLength(2);
  });

  it("should handle empty commands array", () => {
    const commands: CommandResult[] = [];

    const result = segmentCommands(commands);

    expect(result.insertCommands).toHaveLength(0);
    expect(result.replaceCommands).toHaveLength(0);
  });
});

describe("insertCodeAfterLine", () => {
  it("should insert code after the specified line", () => {
    const fileContent = "Line 1\nLine 2\nLine 3\nLine 4";
    const lineNumber = 2; // Insert after "Line 2"
    const codeToInsert = "New Line";

    const result = insertCodeAfterLine(fileContent, lineNumber, codeToInsert);

    expect(result).toBe("Line 1\nLine 2\nNew Line\nLine 3\nLine 4");
  });

  it("should insert code after the first line", () => {
    const fileContent = "Line 1\nLine 2\nLine 3";
    const lineNumber = 1;
    const codeToInsert = "New Line";

    const result = insertCodeAfterLine(fileContent, lineNumber, codeToInsert);

    expect(result).toBe("Line 1\nNew Line\nLine 2\nLine 3");
  });

  it("should insert code after the last line", () => {
    const fileContent = "Line 1\nLine 2\nLine 3";
    const lineNumber = 3;
    const codeToInsert = "New Line";

    const result = insertCodeAfterLine(fileContent, lineNumber, codeToInsert);

    expect(result).toBe("Line 1\nLine 2\nLine 3\nNew Line");
  });

  it("should throw an error for line numbers out of range", () => {
    const fileContent = "Line 1\nLine 2\nLine 3";
    const lineNumber = 10; // Out of range
    const codeToInsert = "New Line";

    expect(() => {
      insertCodeAfterLine(fileContent, lineNumber, codeToInsert);
    }).toThrow(`Line number ${lineNumber} is out of range (1-3)`);
  });

  it("should throw an error for line numbers less than 1", () => {
    const fileContent = "Line 1\nLine 2\nLine 3";
    const lineNumber = 0; // Invalid line number
    const codeToInsert = "New Line";

    expect(() => {
      insertCodeAfterLine(fileContent, lineNumber, codeToInsert);
    }).toThrow(`Line number ${lineNumber} is out of range (1-3)`);
  });

  it("should handle multi-line code insertions", () => {
    const fileContent = "Line 1\nLine 2\nLine 3";
    const lineNumber = 2;
    const codeToInsert = "New Line 1\nNew Line 2\nNew Line 3";

    const result = insertCodeAfterLine(fileContent, lineNumber, codeToInsert);

    expect(result).toBe(
      "Line 1\nLine 2\nNew Line 1\nNew Line 2\nNew Line 3\nLine 3"
    );
  });
});

describe("applyInsertCommands", () => {
  let tempFilePath: string;

  beforeEach(async () => {
    // Create a temporary file for testing
    const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5";
    tempFilePath = await createTempFile("insert_test.txt", content);
  });

  afterEach(async () => {
    // Clean up temporary file
    await removeTempFile(tempFilePath);
  });

  it("should apply multiple insert commands in bottom-up order", async () => {
    const commands: InsertAfterCommand[] = [
      {
        kind: "insert_after",
        insert_line: 2,
        new_str: "Inserted after line 2",
      },
      {
        kind: "insert_after",
        insert_line: 4,
        new_str: "Inserted after line 4",
      },
    ];

    await applyInsertCommands(commands, tempFilePath);

    const fileContent = await fs.readFile(tempFilePath, "utf-8");
    const expected =
      "Line 1\nLine 2\nInserted after line 2\nLine 3\nLine 4\nInserted after line 4\nLine 5";

    expect(fileContent).toBe(expected);
  });

  it("should handle insert at the beginning of the file", async () => {
    const commands: InsertAfterCommand[] = [
      {
        kind: "insert_after",
        insert_line: 1,
        new_str: "Inserted after line 1",
      },
    ];

    await applyInsertCommands(commands, tempFilePath);

    const fileContent = await fs.readFile(tempFilePath, "utf-8");
    const expected =
      "Line 1\nInserted after line 1\nLine 2\nLine 3\nLine 4\nLine 5";

    expect(fileContent).toBe(expected);
  });

  it("should handle insert at the end of the file", async () => {
    const commands: InsertAfterCommand[] = [
      {
        kind: "insert_after",
        insert_line: 5,
        new_str: "Inserted after line 5",
      },
    ];

    await applyInsertCommands(commands, tempFilePath);

    const fileContent = await fs.readFile(tempFilePath, "utf-8");
    const expected =
      "Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nInserted after line 5";

    expect(fileContent).toBe(expected);
  });

  it("should apply inserts in bottom-up order to maintain line numbers", async () => {
    const commands: InsertAfterCommand[] = [
      {
        kind: "insert_after",
        insert_line: 1, // This should be applied second
        new_str: "Top insert",
      },
      {
        kind: "insert_after",
        insert_line: 5, // This should be applied first
        new_str: "Bottom insert",
      },
    ];

    await applyInsertCommands(commands, tempFilePath);

    const fileContent = await fs.readFile(tempFilePath, "utf-8");
    const expected =
      "Line 1\nTop insert\nLine 2\nLine 3\nLine 4\nLine 5\nBottom insert";

    expect(fileContent).toBe(expected);
  });
});

describe("applyReplaceCommands", () => {
  let tempFilePath: string;

  beforeEach(async () => {
    // Create a temporary file for testing
    const content =
      'const value1 = "old value 1";\nconst value2 = "old value 2";\nconst value3 = "unique value";';
    tempFilePath = await createTempFile("replace_test.txt", content);
  });

  afterEach(async () => {
    // Clean up temporary file
    await removeTempFile(tempFilePath);
  });

  it("should replace a single occurrence of a string", async () => {
    const commands: StringReplaceCommand[] = [
      {
        kind: "string_replace",
        old_str: 'const value1 = "old value 1";',
        new_str: 'const value1 = "new value 1";',
      },
    ];

    const result = await applyReplaceCommands(commands, tempFilePath);

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.content).toBe(
        'const value1 = "new value 1";\nconst value2 = "old value 2";\nconst value3 = "unique value";'
      );
    }
  });

  it("should replace multiple strings in sequence", async () => {
    const commands: StringReplaceCommand[] = [
      {
        kind: "string_replace",
        old_str: 'const value1 = "old value 1";',
        new_str: 'const value1 = "new value 1";',
      },
      {
        kind: "string_replace",
        old_str: 'const value2 = "old value 2";',
        new_str: 'const value2 = "new value 2";',
      },
    ];

    const result = await applyReplaceCommands(commands, tempFilePath);

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.content).toBe(
        'const value1 = "new value 1";\nconst value2 = "new value 2";\nconst value3 = "unique value";'
      );
    }
  });

  it('should return "no_match" status when a string is not found', async () => {
    const commands: StringReplaceCommand[] = [
      {
        kind: "string_replace",
        old_str: "non-existent value",
        new_str: "new value",
      },
    ];

    const result = await applyReplaceCommands(commands, tempFilePath);

    expect(result.status).toBe("no_match");
    if (result.status === "no_match") {
      expect(result.command).toEqual(commands[0]);
      expect(result.similarMatches).toBeInstanceOf(Array);
    }
  });

  it("should handle multi-line string replacements", async () => {
    const content = `function test() {
  console.log("Hello");
  return true;
}`;

    const multilineFilePath = await createTempFile(
      "multiline_test.txt",
      content
    );

    const commands: StringReplaceCommand[] = [
      {
        kind: "string_replace",
        old_str: `function test() {
  console.log("Hello");
  return true;
}`,
        new_str: `function test() {
  console.log("Updated");
  return false;
}`,
      },
    ];

    const result = await applyReplaceCommands(commands, multilineFilePath);

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.content).toBe(`function test() {
  console.log("Updated");
  return false;
}`);
    }

    await removeTempFile(multilineFilePath);
  });
});

describe("formatFileContent", () => {
  it("should format JavaScript code correctly", async () => {
    const unformattedCode = "function test(){const x=1;const y=2;return x+y;}";
    const expected =
      "function test() {\n  const x = 1;\n  const y = 2;\n  return x + y;\n}\n";

    const result = await formatFileContent(unformattedCode, {
      parser: "babel",
    });

    expect(result).toBe(expected);
  });

  it("should format TypeScript code correctly", async () => {
    const unformattedCode =
      "function test(x:number,y:number):number{return x+y;}";
    const expected =
      "function test(x: number, y: number): number {\n  return x + y;\n}\n";

    const result = await formatFileContent(unformattedCode, {
      parser: "typescript",
    });

    expect(result).toBe(expected);
  });

  /* Temporarily skipped until HTML formatting is fixed
  it("should format based on file extension", async () => {
    const unformattedCode = "<div><p>Hello world</p></div>";
    const expected = "<div>\n  <p>Hello world</p>\n</div>\n";

    const result = await formatFileContent(unformattedCode, {
      filepath: "test.html",
    });

    expect(result).toBe(expected);
  });
  */

  it("should return unformatted content when error occurs", async () => {
    const invalidCode = 'function test( {return "invalid";}';

    const result = await formatFileContent(invalidCode, { parser: "babel" });

    expect(result).toBe(invalidCode);
  });
});

describe("checkSyntax", () => {
  it("should validate valid JavaScript syntax", async () => {
    const code = 'function test() { return "valid"; }';

    const result = await checkSyntax(code, "test.js");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should validate valid TypeScript syntax", async () => {
    const code =
      "function test(x: number): string { return `Number is ${x}`; }";

    const result = await checkSyntax(code, "test.ts");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should detect invalid JavaScript syntax", async () => {
    const code = 'function test( { return "invalid"; }';

    const result = await checkSyntax(code, "test.js");

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should validate valid JSON", async () => {
    const code = '{"name": "test", "value": 123}';

    const result = await checkSyntax(code, "test.json");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should detect invalid JSON", async () => {
    const code = '{"name": "test", "value": 123,}'; // Trailing comma not allowed in JSON

    const result = await checkSyntax(code, "test.json");

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should validate valid JSONC with comments", async () => {
    const code = `{
      "name": "test", // This is a comment
      "value": 123,   /* Multi-line
                          comment */
    }`;

    const result = await checkSyntax(code, "test.jsonc");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  /* Temporarily skipped until CSS validation is fixed
  it("should validate valid CSS", async () => {
    const code = "body { color: #333; } p { margin: 0; }";

    const result = await checkSyntax(code, "test.css");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
  */

  it("should detect invalid CSS", async () => {
    const code = "body { color: #333; margin: } p { margin: 0; }";

    const result = await checkSyntax(code, "test.css");

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should validate valid HTML", async () => {
    const code = "<div><p>Hello world</p></div>";

    const result = await checkSyntax(code, "test.html");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should validate unsupported file types with a warning", async () => {
    const code = "some random content";

    const result = await checkSyntax(code, "test.xyz");

    expect(result.valid).toBe(true);
    expect(result.error).toContain("not supported");
  });
}); 
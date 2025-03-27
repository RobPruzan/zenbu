import { parsePlanFromXml, parseResponseFromXml, parseModelOutput } from './planner.js';

// Test the XML parser with various inputs
function runTests() {
  console.log("Running planner XML parser tests...");
  
  // Test 1: Valid XML plan
  const validXml = `
<plan>
<goal>
Create a responsive todo list application with the ability to add, edit, and remove tasks.
</goal>

<task>
  <priority>
  1
  </priority>
  <description>
  Create the Todo component that will display individual todo items with functionality for marking as complete and deleting
  </description>
</task>

<task>
  <priority>
  3
  </priority>
  <description>
  Implement TodoList component to render and manage the collection of todo items
  </description>
</task>

<task>
  <priority>
  2
  </priority>
  <description>
  Create AddTodo component with a form to add new todo items
  </description>
</task>

</plan>
`;

  console.log("\nTest 1: Valid XML plan");
  const result = parsePlanFromXml(validXml);
  console.log(JSON.stringify(result, null, 2));
  
  // Test 2: No plan
  console.log("\nTest 2: No plan");
  const noPlanResult = parsePlanFromXml("This is just a regular response with no plan");
  console.log(noPlanResult);
  
  // Test 3: Malformed XML
  console.log("\nTest 3: Malformed XML");
  const malformedXml = `
<plan>
<goal>Malformed plan</goal>
<task>
  <priority>invalid</priority>
  <description>This task has an invalid priority</description>
</task>
</plan>
`;
  const malformedResult = parsePlanFromXml(malformedXml);
  console.log(JSON.stringify(malformedResult, null, 2));

  // Test 4: Nested XML with other content
  console.log("\nTest 4: Nested XML with other content");
  const nestedXml = `
I'll help you implement this feature.

<plan>
<goal>
Add dark mode toggle to the website
</goal>

<task>
  <priority>
  1
  </priority>
  <description>
  Create ThemeContext to manage the theme state
  </description>
</task>

<task>
  <priority>
  2
  </priority>
  <description>
  Implement ThemeToggle component
  </description>
</task>
</plan>

I'll start by creating the context and then implement the toggle.
`;
  const nestedResult = parsePlanFromXml(nestedXml);
  console.log(JSON.stringify(nestedResult, null, 2));
  
  // Test 5: Response format
  console.log("\nTest 5: Response format");
  const responseXml = `
<response>
This is a direct response to the user's question without creating a plan.
The todo feature is already implemented in TodoList.tsx.
</response>
`;
  const responseResult = parseResponseFromXml(responseXml);
  console.log(responseResult);
  
  // Test 6: Complete parse test (Plan)
  console.log("\nTest 6: Complete parse test (Plan)");
  const completeParsePlanResult = parseModelOutput(validXml);
  console.log(JSON.stringify(completeParsePlanResult, null, 2));
  
  // Test 7: Complete parse test (Response)
  console.log("\nTest 7: Complete parse test (Response)");
  const completeParseResponseResult = parseModelOutput(responseXml);
  console.log(JSON.stringify(completeParseResponseResult, null, 2));
  
  // Test 8: Mixed content
  console.log("\nTest 8: Mixed content (should prioritize plan)");
  const mixedXml = `
<plan>
<goal>Main goal</goal>
<task>
  <priority>1</priority>
  <description>Main task</description>
</task>
</plan>

<response>
This should be ignored when a plan is present
</response>
`;
  const mixedResult = parseModelOutput(mixedXml);
  console.log(JSON.stringify(mixedResult, null, 2));
}

runTests(); 
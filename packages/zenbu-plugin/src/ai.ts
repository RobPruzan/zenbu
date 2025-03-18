import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const { text, reasoning, reasoningDetails } = await generateText({
  model: anthropic('claude-3-7-sonnet-20250219'),
  prompt: 'How many people will live in the world in 2040?',
  // providerOptions: {
  //   anthropic: {
  //     thinking: { type: 'enabled', budgetTokens: 12000 },
  //   },
  // },
});

console.log(reasoning); // reasoning text
console.log(reasoningDetails); // reasoning details including redacted reasoning
console.log(text); // text response
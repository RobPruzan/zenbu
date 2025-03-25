import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.countTokens({
  model: "claude-3-7-sonnet-20250219",
  system: "You are a scientist",
  messages: [
    {
      role: "user",
      content: "Hello, Claude how are you doing, im blabbering about things, just blabbering a lot",
    },
  ],
});

console.log(response);

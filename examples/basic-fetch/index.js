/**
 * Basic Fetch Example
 *
 * This example shows how to use the Claude Code Gateway with plain fetch.
 * No SDK required - works from any language that supports HTTP.
 *
 * Prerequisites:
 * 1. Start the gateway: cd packages/gateway && pnpm dev
 * 2. Set CLAUDE_CODE_GATEWAY_API_KEY environment variable
 */

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3100";
const API_KEY = process.env.CLAUDE_CODE_GATEWAY_API_KEY;

if (!API_KEY) {
  console.error("Error: CLAUDE_CODE_GATEWAY_API_KEY environment variable is required");
  process.exit(1);
}

/**
 * Example 1: Generate plain text
 */
async function generateText() {
  console.log("\n=== Generate Text Example ===\n");

  const response = await fetch(`${GATEWAY_URL}/generate-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      prompt: "Explain the concept of recursion in programming in 2-3 sentences.",
      system: "You are a helpful programming tutor. Be concise.",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error:", error);
    return;
  }

  const result = await response.json();
  console.log("Response:", result.text);
  console.log("\nUsage:", result.usage);
  console.log("Session ID:", result.sessionId);
}

/**
 * Example 2: Generate structured JSON object
 */
async function generateObject() {
  console.log("\n=== Generate Object Example ===\n");

  const response = await fetch(`${GATEWAY_URL}/generate-object`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      prompt: "Extract the meeting details from: 'Let's meet with Sarah at 3pm tomorrow at the coffee shop on Main Street'",
      schema: {
        type: "object",
        properties: {
          person: { type: "string", description: "Name of the person to meet" },
          time: { type: "string", description: "Meeting time" },
          date: { type: "string", description: "Meeting date" },
          location: { type: "string", description: "Meeting location" },
        },
        required: ["person", "time", "date", "location"],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Error:", error);
    return;
  }

  const result = await response.json();
  console.log("Extracted object:", JSON.stringify(result.object, null, 2));
  console.log("\nUsage:", result.usage);
}

/**
 * Example 3: Multi-turn conversation using session ID
 */
async function multiTurnConversation() {
  console.log("\n=== Multi-turn Conversation Example ===\n");

  // First message
  const response1 = await fetch(`${GATEWAY_URL}/generate-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      prompt: "My name is Alex and I'm learning TypeScript. Remember my name.",
      system: "You are a friendly programming assistant.",
    }),
  });

  const result1 = await response1.json();
  console.log("Turn 1:", result1.text);
  console.log("Session ID:", result1.sessionId);

  // Second message - continues the conversation
  const response2 = await fetch(`${GATEWAY_URL}/generate-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      prompt: "What's my name and what am I learning?",
      sessionId: result1.sessionId, // Continue the session
    }),
  });

  const result2 = await response2.json();
  console.log("\nTurn 2:", result2.text);
}

// Run all examples
async function main() {
  try {
    await generateText();
    await generateObject();
    await multiTurnConversation();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

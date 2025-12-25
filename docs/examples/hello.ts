/**
 * hello.ts - Basic generateText example
 *
 * Demonstrates the simplest use case: asking a question and getting a text response.
 *
 * Run from project root:
 *   bun run docs/examples/hello.ts
 */

import { type KoineConfig, generateText } from "@patternzones/koine-sdk";

// Bun automatically loads .env from current working directory
const authKey = process.env.CLAUDE_CODE_GATEWAY_API_KEY;
if (!authKey) {
	throw new Error("CLAUDE_CODE_GATEWAY_API_KEY is required in .env");
}

const config: KoineConfig = {
	baseUrl: `http://localhost:${process.env.GATEWAY_PORT || "3100"}`,
	authKey,
	timeout: 300000,
};

async function main() {
	console.log("Sending request to Koine gateway...\n");

	const result = await generateText(config, {
		prompt: "What are the three primary colors? Answer in one sentence.",
	});

	console.log(`Response: ${result.text}`);
	console.log(
		`\nTokens used: ${result.usage.totalTokens} (input: ${result.usage.inputTokens}, output: ${result.usage.outputTokens})`,
	);
	console.log(`Session ID: ${result.sessionId}`);
}

main().catch(console.error);

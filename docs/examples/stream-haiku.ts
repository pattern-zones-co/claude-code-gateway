/**
 * stream-haiku.ts - streamText example with real-time output
 *
 * Demonstrates streaming responses, showing text as it arrives.
 *
 * Run from project root:
 *   bun run docs/examples/stream-haiku.ts
 */

import { type KoineConfig, streamText } from "@patternzones/koine-sdk";

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
	console.log("Streaming response:\n");

	const result = await streamText(config, {
		prompt: "Write a haiku about programming. Just the haiku, no explanation.",
	});

	// Stream chunks as they arrive
	for await (const chunk of result.textStream) {
		process.stdout.write(chunk);
	}

	// Wait for final stats
	const usage = await result.usage;
	console.log(
		`\n\nUsage: ${usage.totalTokens} tokens (input: ${usage.inputTokens}, output: ${usage.outputTokens})`,
	);
}

main().catch(console.error);

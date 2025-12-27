/**
 * Tests for stream route argument builders.
 *
 * Tests the buildStreamArgs and buildStreamObjectArgs functions that
 * construct CLI arguments for streaming endpoints.
 */

import { describe, expect, it } from "vitest";
import { buildStreamObjectArgs } from "../../src/routes/stream-object.js";
import { buildStreamArgs } from "../../src/routes/stream.js";

describe("Stream Route Argument Builders", () => {
	describe("buildStreamArgs", () => {
		it("includes base flags for streaming", () => {
			const args = buildStreamArgs({ prompt: "test" });

			expect(args).toContain("--print");
			expect(args).toContain("--verbose");
			expect(args).toContain("--output-format");
			expect(args).toContain("stream-json");
			expect(args).toContain("--include-partial-messages");
		});

		it("includes prompt as last argument", () => {
			const args = buildStreamArgs({ prompt: "my prompt" });

			expect(args[args.length - 1]).toBe("my prompt");
		});

		it("includes model when specified", () => {
			const args = buildStreamArgs({ prompt: "test", model: "sonnet" });

			expect(args).toContain("--model");
			expect(args[args.indexOf("--model") + 1]).toBe("sonnet");
		});

		it("includes system prompt when specified", () => {
			const args = buildStreamArgs({
				prompt: "test",
				system: "You are helpful",
			});

			expect(args).toContain("--system-prompt");
			expect(args[args.indexOf("--system-prompt") + 1]).toBe("You are helpful");
		});

		it("includes resume flag with session ID", () => {
			const args = buildStreamArgs({
				prompt: "test",
				sessionId: "session-123",
			});

			expect(args).toContain("--resume");
			expect(args[args.indexOf("--resume") + 1]).toBe("session-123");
		});

		describe("allowedTools", () => {
			it("includes --allowedTools flag when tools specified", () => {
				const args = buildStreamArgs({
					prompt: "test",
					allowedTools: ["Read", "Glob"],
				});

				expect(args).toContain("--allowedTools");
				const flagIndex = args.indexOf("--allowedTools");
				expect(args[flagIndex + 1]).toBe("Read");
				expect(args[flagIndex + 2]).toBe("Glob");
			});

			it("handles tools with special characters", () => {
				const args = buildStreamArgs({
					prompt: "test",
					allowedTools: ["Bash(git log:*)", "Bash(git diff:*)"],
				});

				expect(args).toContain("--allowedTools");
				expect(args).toContain("Bash(git log:*)");
				expect(args).toContain("Bash(git diff:*)");
			});

			it("omits --allowedTools flag for empty array", () => {
				const args = buildStreamArgs({
					prompt: "test",
					allowedTools: [],
				});

				expect(args).not.toContain("--allowedTools");
			});

			it("omits --allowedTools flag when undefined", () => {
				const args = buildStreamArgs({
					prompt: "test",
					allowedTools: undefined,
				});

				expect(args).not.toContain("--allowedTools");
			});
		});
	});

	describe("buildStreamObjectArgs", () => {
		const testSchema = {
			type: "object",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
		};

		it("includes base flags for streaming", () => {
			const args = buildStreamObjectArgs({
				prompt: "test",
				schema: testSchema,
			});

			expect(args).toContain("--print");
			expect(args).toContain("--verbose");
			expect(args).toContain("--output-format");
			expect(args).toContain("stream-json");
			expect(args).toContain("--include-partial-messages");
		});

		it("enhances prompt with schema", () => {
			const args = buildStreamObjectArgs({
				prompt: "Generate a name",
				schema: testSchema,
			});

			const lastArg = args[args.length - 1];
			expect(lastArg).toContain("Generate a name");
			expect(lastArg).toContain("JSON Schema:");
			expect(lastArg).toContain('"type": "object"');
		});

		it("adds JSON generator system prompt", () => {
			const args = buildStreamObjectArgs({
				prompt: "test",
				schema: testSchema,
			});

			expect(args).toContain("--system-prompt");
			const systemIndex = args.indexOf("--system-prompt");
			const systemPrompt = args[systemIndex + 1];
			expect(systemPrompt).toContain("JSON generator");
		});

		it("enhances existing system prompt", () => {
			const args = buildStreamObjectArgs({
				prompt: "test",
				schema: testSchema,
				system: "Be concise",
			});

			const systemIndex = args.indexOf("--system-prompt");
			const systemPrompt = args[systemIndex + 1];
			expect(systemPrompt).toContain("Be concise");
			expect(systemPrompt).toContain("JSON generator");
		});

		it("includes model when specified", () => {
			const args = buildStreamObjectArgs({
				prompt: "test",
				schema: testSchema,
				model: "opus",
			});

			expect(args).toContain("--model");
			expect(args[args.indexOf("--model") + 1]).toBe("opus");
		});

		it("includes resume flag with session ID", () => {
			const args = buildStreamObjectArgs({
				prompt: "test",
				schema: testSchema,
				sessionId: "session-456",
			});

			expect(args).toContain("--resume");
			expect(args[args.indexOf("--resume") + 1]).toBe("session-456");
		});

		describe("allowedTools", () => {
			it("includes --allowedTools flag when tools specified", () => {
				const args = buildStreamObjectArgs({
					prompt: "test",
					schema: testSchema,
					allowedTools: ["Read", "Write"],
				});

				expect(args).toContain("--allowedTools");
				const flagIndex = args.indexOf("--allowedTools");
				expect(args[flagIndex + 1]).toBe("Read");
				expect(args[flagIndex + 2]).toBe("Write");
			});

			it("handles tools with special characters", () => {
				const args = buildStreamObjectArgs({
					prompt: "test",
					schema: testSchema,
					allowedTools: ["Bash(git log:*)", "Read"],
				});

				expect(args).toContain("--allowedTools");
				expect(args).toContain("Bash(git log:*)");
				expect(args).toContain("Read");
			});

			it("omits --allowedTools flag for empty array", () => {
				const args = buildStreamObjectArgs({
					prompt: "test",
					schema: testSchema,
					allowedTools: [],
				});

				expect(args).not.toContain("--allowedTools");
			});

			it("omits --allowedTools flag when undefined", () => {
				const args = buildStreamObjectArgs({
					prompt: "test",
					schema: testSchema,
					allowedTools: undefined,
				});

				expect(args).not.toContain("--allowedTools");
			});
		});
	});
});

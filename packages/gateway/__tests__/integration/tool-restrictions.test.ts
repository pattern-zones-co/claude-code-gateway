/**
 * Integration tests for tool restriction functionality.
 *
 * Tests the allowedTools/disallowedTools behavior across all endpoints,
 * including the NO_TOOLS_AVAILABLE error when all requested tools are blocked.
 */

import { spawn } from "node:child_process";
import request from "supertest";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	afterSpawnCalled,
	createCliResultJson,
	createMockChildProcess,
} from "../helpers.js";

// Set required environment variables BEFORE any imports
const TEST_API_KEY = vi.hoisted(() => {
	const key = "test-api-key-tools";
	process.env.CLAUDE_CODE_GATEWAY_API_KEY = key;
	process.env.PORT = "0";
	return key;
});

// Mock node:child_process for CLI subprocess
vi.mock("node:child_process", () => ({
	spawn: vi.fn(),
}));

// Mock the config module to control gateway tool restrictions
vi.mock("../../src/config.js", () => ({
	gatewayConfig: {
		allowedTools: undefined,
		disallowedTools: ["Write", "Edit", "Bash(rm:*)"],
	},
}));

const mockSpawn = vi.mocked(spawn);

// Import app after mocks are set
import app, { server } from "../../src/index.js";

describe("Tool Restrictions (Integration)", () => {
	const validAuthHeader = `Bearer ${TEST_API_KEY}`;

	afterAll(async () => {
		await new Promise<void>((resolve, reject) => {
			server.close((err: Error | undefined) => {
				if (err) reject(err);
				else resolve();
			});
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("NO_TOOLS_AVAILABLE error", () => {
		describe("POST /generate-text", () => {
			it("returns 400 when all requested tools are disallowed", async () => {
				const response = await request(app)
					.post("/generate-text")
					.set("Authorization", validAuthHeader)
					.send({
						prompt: "test",
						allowedTools: ["Write", "Edit"], // Both are in disallowedTools
					});

				expect(response.status).toBe(400);
				expect(response.body.code).toBe("NO_TOOLS_AVAILABLE");
				expect(response.body.error).toContain(
					"all requested tools are disallowed",
				);
			});

			it("succeeds when some requested tools are allowed", async () => {
				const mockProc = createMockChildProcess();
				mockSpawn.mockReturnValue(mockProc as never);

				const responsePromise = request(app)
					.post("/generate-text")
					.set("Authorization", validAuthHeader)
					.send({
						prompt: "test",
						allowedTools: ["Read", "Write"], // Read is allowed, Write is blocked
					});

				afterSpawnCalled(mockSpawn, () => {
					mockProc.stdout.emit(
						"data",
						Buffer.from(createCliResultJson({ result: "Hello" })),
					);
					mockProc.emit("close", 0, null);
				});

				const response = await responsePromise;

				expect(response.status).toBe(200);
				// Verify only Read was passed to CLI (Write was filtered out)
				expect(mockSpawn).toHaveBeenCalledWith(
					"claude",
					expect.arrayContaining(["--allowedTools", "Read"]),
					expect.any(Object),
				);
				// Write should NOT be in the args
				const args = mockSpawn.mock.calls[0][1] as string[];
				expect(args).not.toContain("Write");
			});
		});

		describe("POST /generate-object", () => {
			it("returns 400 when all requested tools are disallowed", async () => {
				const response = await request(app)
					.post("/generate-object")
					.set("Authorization", validAuthHeader)
					.send({
						prompt: "test",
						schema: { type: "object", properties: {} },
						allowedTools: ["Edit"], // Edit is in disallowedTools
					});

				expect(response.status).toBe(400);
				expect(response.body.code).toBe("NO_TOOLS_AVAILABLE");
			});
		});

		describe("POST /stream", () => {
			it("returns 400 when all requested tools are disallowed", async () => {
				const response = await request(app)
					.post("/stream")
					.set("Authorization", validAuthHeader)
					.send({
						prompt: "test",
						allowedTools: ["Write", "Bash(rm:*)"], // Both are disallowed
					});

				expect(response.status).toBe(400);
				expect(response.body.code).toBe("NO_TOOLS_AVAILABLE");
			});
		});

		describe("POST /stream-object", () => {
			it("returns 400 when all requested tools are disallowed", async () => {
				const response = await request(app)
					.post("/stream-object")
					.set("Authorization", validAuthHeader)
					.send({
						prompt: "test",
						schema: { type: "object", properties: {} },
						allowedTools: ["Edit", "Write"], // Both are disallowed
					});

				expect(response.status).toBe(400);
				expect(response.body.code).toBe("NO_TOOLS_AVAILABLE");
			});
		});
	});

	describe("allowedTools filtering", () => {
		it("filters disallowed tools from request and passes remaining to CLI", async () => {
			const mockProc = createMockChildProcess();
			mockSpawn.mockReturnValue(mockProc as never);

			const responsePromise = request(app)
				.post("/generate-text")
				.set("Authorization", validAuthHeader)
				.send({
					prompt: "test",
					allowedTools: ["Read", "Glob", "Write", "Edit"], // Read, Glob allowed; Write, Edit blocked
				});

			afterSpawnCalled(mockSpawn, () => {
				mockProc.stdout.emit(
					"data",
					Buffer.from(createCliResultJson({ result: "Response" })),
				);
				mockProc.emit("close", 0, null);
			});

			await responsePromise;

			const args = mockSpawn.mock.calls[0][1] as string[];
			const allowedToolsIndex = args.indexOf("--allowedTools");
			expect(allowedToolsIndex).toBeGreaterThan(-1);

			// Only Read and Glob should be passed
			expect(args[allowedToolsIndex + 1]).toBe("Read");
			expect(args[allowedToolsIndex + 2]).toBe("Glob");
			// Write and Edit should NOT be in args
			expect(args).not.toContain("Write");
			expect(args).not.toContain("Edit");
		});
	});
});

/**
 * Tests for concurrency limiting module (concurrency.ts).
 *
 * Tests the acquire/release semaphore logic and the withConcurrencyLimit wrapper.
 */

import { spawn } from "node:child_process";
import express, { type Request, type Response } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	acquireSlot,
	getConfig,
	getStatus,
	releaseSlot,
	resetState,
	setConfig,
	withConcurrencyLimit,
} from "../src/concurrency.js";
import generateRouter from "../src/routes/generate.js";
import {
	afterSpawnCalled,
	createCliResultJson,
	createMockChildProcess,
	simulateCliSuccess,
} from "./helpers.js";

// Mock node:child_process
vi.mock("node:child_process", () => ({
	spawn: vi.fn(),
}));

const mockSpawn = vi.mocked(spawn);

describe("Concurrency Module", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetState();
		// Reset to default limits
		setConfig({ maxStreamingConcurrent: 3, maxNonStreamingConcurrent: 5 });
	});

	describe("acquireSlot / releaseSlot", () => {
		it("acquires slot when under limit", () => {
			expect(acquireSlot("streaming")).toBe(true);
			expect(acquireSlot("nonStreaming")).toBe(true);
		});

		it("returns false when at streaming limit", () => {
			setConfig({ maxStreamingConcurrent: 2, maxNonStreamingConcurrent: 5 });

			expect(acquireSlot("streaming")).toBe(true);
			expect(acquireSlot("streaming")).toBe(true);
			expect(acquireSlot("streaming")).toBe(false);
		});

		it("returns false when at non-streaming limit", () => {
			setConfig({ maxStreamingConcurrent: 3, maxNonStreamingConcurrent: 2 });

			expect(acquireSlot("nonStreaming")).toBe(true);
			expect(acquireSlot("nonStreaming")).toBe(true);
			expect(acquireSlot("nonStreaming")).toBe(false);
		});

		it("releases slot allowing subsequent acquire", () => {
			setConfig({ maxStreamingConcurrent: 1, maxNonStreamingConcurrent: 5 });

			expect(acquireSlot("streaming")).toBe(true);
			expect(acquireSlot("streaming")).toBe(false);

			releaseSlot("streaming");

			expect(acquireSlot("streaming")).toBe(true);
		});

		it("streaming and non-streaming have independent limits", () => {
			setConfig({ maxStreamingConcurrent: 1, maxNonStreamingConcurrent: 1 });

			expect(acquireSlot("streaming")).toBe(true);
			expect(acquireSlot("nonStreaming")).toBe(true);

			// Both at limit now
			expect(acquireSlot("streaming")).toBe(false);
			expect(acquireSlot("nonStreaming")).toBe(false);

			// Release streaming, non-streaming still at limit
			releaseSlot("streaming");
			expect(acquireSlot("streaming")).toBe(true);
			expect(acquireSlot("nonStreaming")).toBe(false);
		});

		it("release does not go below zero", () => {
			releaseSlot("streaming");
			releaseSlot("streaming");
			releaseSlot("streaming");

			const status = getStatus();
			expect(status.streaming.active).toBe(0);
		});
	});

	describe("getStatus", () => {
		it("returns current active counts and limits", () => {
			setConfig({ maxStreamingConcurrent: 3, maxNonStreamingConcurrent: 5 });

			acquireSlot("streaming");
			acquireSlot("streaming");
			acquireSlot("nonStreaming");

			const status = getStatus();
			expect(status).toEqual({
				streaming: { active: 2, limit: 3 },
				nonStreaming: { active: 1, limit: 5 },
			});
		});
	});

	describe("getConfig / setConfig", () => {
		it("returns current configuration", () => {
			setConfig({ maxStreamingConcurrent: 10, maxNonStreamingConcurrent: 20 });

			const config = getConfig();
			expect(config.maxStreamingConcurrent).toBe(10);
			expect(config.maxNonStreamingConcurrent).toBe(20);
		});

		it("allows partial config updates", () => {
			setConfig({ maxStreamingConcurrent: 10, maxNonStreamingConcurrent: 20 });
			setConfig({ maxStreamingConcurrent: 5 });

			const config = getConfig();
			expect(config.maxStreamingConcurrent).toBe(5);
			expect(config.maxNonStreamingConcurrent).toBe(20);
		});
	});

	describe("withConcurrencyLimit", () => {
		function createTestApp() {
			const app = express();
			app.use(express.json());

			app.post(
				"/test",
				withConcurrencyLimit(
					"nonStreaming",
					async (_req: Request, res: Response) => {
						res.json({ success: true });
					},
				),
			);

			return app;
		}

		it("allows request when under limit", async () => {
			setConfig({ maxStreamingConcurrent: 3, maxNonStreamingConcurrent: 5 });
			const app = createTestApp();

			const res = await request(app).post("/test").send({});

			expect(res.status).toBe(200);
			expect(res.body).toEqual({ success: true });
		});

		it("returns 429 when at limit", async () => {
			setConfig({ maxStreamingConcurrent: 3, maxNonStreamingConcurrent: 0 });
			const app = createTestApp();

			const res = await request(app).post("/test").send({});

			expect(res.status).toBe(429);
			expect(res.body).toMatchObject({
				error: "Concurrency limit exceeded",
				code: "CONCURRENCY_LIMIT_ERROR",
			});
			expect(res.headers["retry-after"]).toBe("5");
		});

		it("releases slot after response completes", async () => {
			setConfig({ maxStreamingConcurrent: 3, maxNonStreamingConcurrent: 1 });
			const app = createTestApp();

			// First request should succeed
			const res1 = await request(app).post("/test").send({});
			expect(res1.status).toBe(200);

			// Slot should be released, second request should also succeed
			const res2 = await request(app).post("/test").send({});
			expect(res2.status).toBe(200);
		});
	});

	describe("Integration with generate routes", () => {
		function createTestApp() {
			const app = express();
			app.use(express.json());
			app.use(generateRouter);
			return app;
		}

		it("returns 429 when limit is zero (verifies wrapper is applied)", async () => {
			// Set limit to 0 - any request should be rejected immediately
			setConfig({ maxStreamingConcurrent: 3, maxNonStreamingConcurrent: 0 });

			const app = createTestApp();

			const res = await request(app)
				.post("/generate-text")
				.send({ prompt: "Hello" });

			expect(res.status).toBe(429);
			expect(res.body.code).toBe("CONCURRENCY_LIMIT_ERROR");
			expect(res.headers["retry-after"]).toBe("5");
		});

		it("allows request when under limit (verifies wrapper is applied)", async () => {
			setConfig({ maxStreamingConcurrent: 3, maxNonStreamingConcurrent: 5 });

			const mockProc = createMockChildProcess();
			mockSpawn.mockReturnValue(mockProc as never);

			const app = createTestApp();

			const p = request(app).post("/generate-text").send({ prompt: "Hello" });
			afterSpawnCalled(mockSpawn, () => {
				simulateCliSuccess(mockProc, createCliResultJson());
			});
			const res = await p;

			expect(res.status).toBe(200);
		});
	});
});

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		testTimeout: 10000,
		setupFiles: ["./__tests__/setup.ts"],
		include: ["__tests__/**/*.test.ts"],
		exclude: ["__tests__/e2e/**/*.test.ts"],
		// Use forks pool for tests with shared state (concurrency module, server ports)
		// to isolate them from parallel execution. Other tests run in threads pool.
		// This fixes flaky tests from #70 and #72.
		pool: "threads",
		poolMatchGlobs: [
			// Integration tests start actual servers and need isolation
			["**/__tests__/integration/**", "forks"],
			// Concurrency tests modify shared module state
			["**/__tests__/concurrency.test.ts", "forks"],
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			include: ["src/**/*.ts"],
			exclude: ["src/index.ts"], // Entry point tested via integration
		},
	},
});

import type { NextFunction, Request, RequestHandler, Response } from "express";

// Configuration from environment
export interface ConcurrencyConfig {
	maxStreamingConcurrent: number;
	maxNonStreamingConcurrent: number;
}

export type RequestType = "streaming" | "nonStreaming";

// Load configuration from environment
const config: ConcurrencyConfig = {
	maxStreamingConcurrent: Number.parseInt(
		process.env.KOINE_MAX_STREAMING_CONCURRENT || "3",
		10,
	),
	maxNonStreamingConcurrent: Number.parseInt(
		process.env.KOINE_MAX_NONSTREAMING_CONCURRENT || "5",
		10,
	),
};

// State (module-scoped - safe because Bun is single-threaded for JS execution)
let streamingCount = 0;
let nonStreamingCount = 0;

/**
 * Attempt to acquire a concurrency slot.
 * Returns true if slot acquired, false if at limit.
 */
export function acquireSlot(type: RequestType): boolean {
	if (type === "streaming") {
		if (streamingCount >= config.maxStreamingConcurrent) {
			return false;
		}
		streamingCount++;
		return true;
	}
	if (nonStreamingCount >= config.maxNonStreamingConcurrent) {
		return false;
	}
	nonStreamingCount++;
	return true;
}

/**
 * Release a concurrency slot.
 */
export function releaseSlot(type: RequestType): void {
	if (type === "streaming") {
		streamingCount = Math.max(0, streamingCount - 1);
	} else {
		nonStreamingCount = Math.max(0, nonStreamingCount - 1);
	}
}

/**
 * Get current concurrency status for health endpoint.
 */
export function getStatus(): {
	streaming: { active: number; limit: number };
	nonStreaming: { active: number; limit: number };
} {
	return {
		streaming: {
			active: streamingCount,
			limit: config.maxStreamingConcurrent,
		},
		nonStreaming: {
			active: nonStreamingCount,
			limit: config.maxNonStreamingConcurrent,
		},
	};
}

/**
 * Reset state for testing.
 */
export function resetState(): void {
	streamingCount = 0;
	nonStreamingCount = 0;
}

/**
 * Get current configuration (useful for testing).
 */
export function getConfig(): ConcurrencyConfig {
	return { ...config };
}

/**
 * Set configuration (useful for testing).
 */
export function setConfig(newConfig: Partial<ConcurrencyConfig>): void {
	if (newConfig.maxStreamingConcurrent !== undefined) {
		config.maxStreamingConcurrent = newConfig.maxStreamingConcurrent;
	}
	if (newConfig.maxNonStreamingConcurrent !== undefined) {
		config.maxNonStreamingConcurrent = newConfig.maxNonStreamingConcurrent;
	}
}

/**
 * Wrap an Express request handler with concurrency limiting.
 * Returns 429 if at limit, otherwise executes handler and releases slot on completion.
 */
export function withConcurrencyLimit(
	type: RequestType,
	handler: RequestHandler,
): RequestHandler {
	return async (req: Request, res: Response, next: NextFunction) => {
		const acquired = acquireSlot(type);
		if (!acquired) {
			res.setHeader("Retry-After", "5");
			return res.status(429).json({
				error: "Concurrency limit exceeded",
				code: "CONCURRENCY_LIMIT_ERROR",
			});
		}

		// Track whether we've released to prevent double-release
		let released = false;
		const release = () => {
			if (!released) {
				released = true;
				releaseSlot(type);
			}
		};

		// Release on any response completion
		res.on("finish", release);
		res.on("close", release);

		try {
			await handler(req, res, next);
		} catch (error) {
			release();
			throw error;
		}
	};
}

/**
 * Gateway configuration from environment variables
 */

import { logger } from "./logger.js";

/**
 * Parse a JSON array environment variable into a string array.
 * Expected format: '["Read","Glob","Bash(git log:*)"]'
 *
 * @param envVar - The environment variable value to parse
 * @returns The parsed string array, or undefined if not set or invalid
 */
export function parseToolList(
	envVar: string | undefined,
): string[] | undefined {
	if (!envVar) return undefined;
	try {
		const parsed: unknown = JSON.parse(envVar);
		if (!Array.isArray(parsed)) {
			logger.error("Invalid tool list format (expected array)", {
				value: envVar,
			});
			return undefined;
		}
		const tools = parsed.filter((t): t is string => typeof t === "string");
		const filtered = parsed.length - tools.length;
		if (filtered > 0) {
			logger.warn("Tool list contained non-string values that were ignored", {
				totalItems: parsed.length,
				filteredCount: filtered,
			});
		}
		if (tools.length === 0) {
			return undefined;
		}
		return tools;
	} catch {
		logger.error("Failed to parse tool list as JSON", { value: envVar });
		return undefined;
	}
}

/**
 * Gateway-level tool restrictions loaded from environment variables.
 * Frozen to prevent accidental mutation at runtime.
 */
export const gatewayConfig = Object.freeze({
	allowedTools: parseToolList(process.env.KOINE_ALLOWED_TOOLS),
	disallowedTools: parseToolList(process.env.KOINE_DISALLOWED_TOOLS),
});

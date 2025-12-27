/**
 * Tool resolution logic for combining gateway and request tool restrictions.
 */

export interface ResolveToolsOptions {
	/** Tools allowed at gateway level (undefined = all tools allowed) */
	gatewayAllowed?: string[];
	/** Tools disallowed at gateway level (always enforced, SDK cannot bypass) */
	gatewayDisallowed?: string[];
	/** Tools requested by the client (can only further restrict, never expand) */
	requestAllowed?: string[];
}

/**
 * Result of tool resolution.
 * - undefined: No restrictions, all tools allowed
 * - string[]: Only these specific tools are allowed (may be empty)
 */
export type ResolvedTools = string[] | undefined;

/**
 * Resolve the effective allowed tools list by combining gateway-level
 * and request-level restrictions.
 *
 * Behavior:
 * - Gateway allowedTools sets the base set (undefined = all tools allowed)
 * - Gateway disallowedTools removes tools from the allowed set
 * - Request allowedTools can only further restrict (intersection with gateway set)
 * - Request CANNOT bypass gateway disallowedTools
 *
 * Return values:
 * - undefined: No restrictions configured, CLI uses default tool access
 * - string[]: Explicit list of allowed tools (empty array = no tools allowed)
 *
 * @returns The effective allowed tools list, or undefined if no restrictions
 */
export function resolveAllowedTools(
	options: ResolveToolsOptions,
): ResolvedTools {
	const { gatewayAllowed, gatewayDisallowed, requestAllowed } = options;

	// Step 1: Start with gateway allowed (undefined = all)
	let effective: string[] | undefined = gatewayAllowed
		? [...gatewayAllowed]
		: undefined;

	// Step 2: Remove gateway disallowed from the effective set
	if (effective && gatewayDisallowed) {
		effective = effective.filter((t) => !gatewayDisallowed.includes(t));
	}

	// Step 3: Intersect with request allowed (if specified)
	if (requestAllowed) {
		if (effective) {
			// Intersection: only tools in both lists
			effective = effective.filter((t) => requestAllowed.includes(t));
		} else {
			// Gateway allows all, so use request list as base
			effective = [...requestAllowed];
		}
	}

	// Step 4: Apply gateway disallowed to final result (ensures request can't bypass)
	if (effective && gatewayDisallowed) {
		effective = effective.filter((t) => !gatewayDisallowed.includes(t));
	}

	// Return the effective list:
	// - undefined if no restrictions were applied (gateway allows all, no request restriction)
	// - array (possibly empty) if any restrictions were applied
	return effective;
}

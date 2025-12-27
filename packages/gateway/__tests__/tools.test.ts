/**
 * Tests for tools module (tools.ts).
 *
 * Tests the resolveAllowedTools function that combines gateway-level
 * and request-level tool restrictions.
 */

import { describe, expect, it } from "vitest";
import { resolveAllowedTools } from "../src/tools.js";

describe("Tools Module", () => {
	describe("resolveAllowedTools", () => {
		describe("gateway allowed only", () => {
			it("returns gateway allowed when no request tools", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob", "Grep"],
				});
				expect(result).toEqual(["Read", "Glob", "Grep"]);
			});

			it("returns undefined when gateway allows all (undefined)", () => {
				const result = resolveAllowedTools({});
				expect(result).toBeUndefined();
			});
		});

		describe("gateway disallowed only", () => {
			it("returns undefined when gateway allows all but disallows some", () => {
				// When gateway allows all (undefined) and has disallowed,
				// without request, we can't create a meaningful allowed list
				const result = resolveAllowedTools({
					gatewayDisallowed: ["Write"],
				});
				expect(result).toBeUndefined();
			});

			it("removes disallowed from allowed list", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob", "Grep", "Write"],
					gatewayDisallowed: ["Write"],
				});
				expect(result).toEqual(["Read", "Glob", "Grep"]);
			});

			it("removes multiple disallowed tools", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob", "Grep", "Write", "Edit"],
					gatewayDisallowed: ["Write", "Edit"],
				});
				expect(result).toEqual(["Read", "Glob", "Grep"]);
			});
		});

		describe("request allowed only", () => {
			it("uses request allowed when gateway allows all", () => {
				const result = resolveAllowedTools({
					requestAllowed: ["Read", "Glob"],
				});
				expect(result).toEqual(["Read", "Glob"]);
			});

			it("respects gateway disallowed even with request", () => {
				const result = resolveAllowedTools({
					gatewayDisallowed: ["Write"],
					requestAllowed: ["Read", "Write", "Glob"],
				});
				expect(result).toEqual(["Read", "Glob"]);
			});

			it("returns empty array when request only asks for disallowed tools", () => {
				// Gateway allows all (undefined), but disallows Write
				// Request asks for ONLY Write - should result in empty array (no valid tools)
				const result = resolveAllowedTools({
					gatewayDisallowed: ["Write"],
					requestAllowed: ["Write"],
				});
				// Empty array means "no tools allowed" (distinct from undefined = "no restrictions")
				expect(result).toEqual([]);
			});
		});

		describe("intersection behavior", () => {
			it("returns intersection of gateway and request allowed", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob", "Grep"],
					requestAllowed: ["Read", "Write", "Glob"],
				});
				expect(result).toEqual(["Read", "Glob"]);
			});

			it("request cannot expand beyond gateway allowed", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob"],
					requestAllowed: ["Read", "Glob", "Grep", "Write"],
				});
				expect(result).toEqual(["Read", "Glob"]);
			});

			it("returns empty array when no intersection", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob"],
					requestAllowed: ["Write", "Edit"],
				});
				// Empty array means "no tools allowed" (gateway has restrictions, but intersection is empty)
				expect(result).toEqual([]);
			});
		});

		describe("combined gateway allowed, disallowed, and request", () => {
			it("applies full resolution chain", () => {
				// Gateway allows: Read, Glob, Grep, Write
				// Gateway disallows: Write
				// Request allows: Read, Glob, Write
				// Step 1: effective = [Read, Glob, Grep, Write]
				// Step 2: remove disallowed = [Read, Glob, Grep]
				// Step 3: intersect with request = [Read, Glob]
				// Step 4: apply disallowed again = [Read, Glob]
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob", "Grep", "Write"],
					gatewayDisallowed: ["Write"],
					requestAllowed: ["Read", "Glob", "Write"],
				});
				expect(result).toEqual(["Read", "Glob"]);
			});

			it("request cannot bypass gateway disallowed", () => {
				// Even if request explicitly asks for Write, it's blocked at gateway
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob", "Write"],
					gatewayDisallowed: ["Write"],
					requestAllowed: ["Write"],
				});
				// Request only asked for Write, which is disallowed - returns empty array
				expect(result).toEqual([]);
			});

			it("handles complex tool patterns", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: [
						"Read",
						"Glob",
						"Bash(git log:*)",
						"Bash(git diff:*)",
					],
					gatewayDisallowed: ["Bash(rm:*)"],
					requestAllowed: ["Read", "Bash(git log:*)", "Bash(rm:*)"],
				});
				expect(result).toEqual(["Read", "Bash(git log:*)"]);
			});
		});

		describe("edge cases", () => {
			it("handles empty gateway allowed array", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: [],
					requestAllowed: ["Read"],
				});
				// Empty gateway allowed means nothing is allowed
				expect(result).toEqual([]);
			});

			it("handles empty request allowed array", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob"],
					requestAllowed: [],
				});
				// Empty request means no tools
				expect(result).toEqual([]);
			});

			it("handles empty gateway disallowed array", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Read", "Glob"],
					gatewayDisallowed: [],
				});
				expect(result).toEqual(["Read", "Glob"]);
			});

			it("preserves order from gateway allowed", () => {
				const result = resolveAllowedTools({
					gatewayAllowed: ["Glob", "Read", "Grep"],
					requestAllowed: ["Read", "Grep", "Glob"],
				});
				// Order should match gateway allowed
				expect(result).toEqual(["Glob", "Read", "Grep"]);
			});
		});
	});
});

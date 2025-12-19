/**
 * Error codes returned by the Claude Code Gateway.
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "UNKNOWN_ERROR"
  | "TIMEOUT_ERROR"
  | "CLI_EXIT_ERROR"
  | "SPAWN_ERROR"
  | "PARSE_ERROR"
  | "HTTP_ERROR"
  | "INVALID_RESPONSE"
  | "STREAM_ERROR"
  | "SSE_PARSE_ERROR"
  | "NO_SESSION"
  | "NO_USAGE"
  | "NO_RESPONSE_BODY";

/**
 * Custom error class for Claude Code Gateway SDK errors.
 * Includes error code for programmatic handling and optional raw text for debugging.
 */
export class ClaudeCodeError extends Error {
  code: ErrorCode;
  rawText?: string;

  constructor(message: string, code: ErrorCode, rawText?: string) {
    super(message);
    this.name = "ClaudeCodeError";
    this.code = code;
    this.rawText = rawText;
  }
}

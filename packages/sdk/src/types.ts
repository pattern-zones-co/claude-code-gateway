/**
 * Configuration for the Claude Code Gateway client.
 */
export interface ClaudeCodeClientConfig {
  /** Base URL of the gateway server (e.g., "http://localhost:3100") */
  baseUrl: string;
  /** API key for authentication (Bearer token) */
  authKey: string;
  /** Request timeout in milliseconds (default: 120000) */
  timeout?: number;
  /** Default model to use (e.g., "sonnet", "haiku") */
  model?: string;
}

/**
 * Usage information from Claude Code Gateway.
 */
export interface Usage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Response from text generation.
 */
export interface GenerateTextResult {
  text: string;
  usage: Usage;
  sessionId: string;
}

/**
 * Response from object generation.
 */
export interface GenerateObjectResult<T> {
  object: T;
  rawText: string;
  usage: Usage;
  sessionId: string;
}

/**
 * Result from streaming text generation.
 */
export interface StreamResult {
  /** ReadableStream of text chunks as they arrive */
  textStream: ReadableStream<string>;
  /** Session ID for conversation continuity (resolves early in stream) */
  sessionId: Promise<string>;
  /** Usage stats (resolves when stream completes) */
  usage: Promise<Usage>;
  /** Full accumulated text (resolves when stream completes) */
  text: Promise<string>;
}

/**
 * Options for text generation.
 */
export interface GenerateTextOptions {
  prompt: string;
  system?: string;
  sessionId?: string;
  model?: string;
}

/**
 * Options for object generation with Zod schema.
 */
export interface GenerateObjectOptions<T> {
  prompt: string;
  schema: import("zod").ZodSchema<T>;
  system?: string;
  sessionId?: string;
  model?: string;
}

/**
 * Options for streaming text generation.
 */
export interface StreamTextOptions {
  prompt: string;
  system?: string;
  sessionId?: string;
  model?: string;
}

/**
 * Error response from the gateway.
 */
export interface ErrorResponse {
  error: string;
  code: string;
  rawText?: string;
}

/**
 * Text response from the gateway.
 */
export interface TextResponse {
  text: string;
  usage: Usage;
  sessionId: string;
}

/**
 * Object response from the gateway.
 */
export interface ObjectResponse {
  object: unknown;
  rawText: string;
  usage: Usage;
  sessionId: string;
}

import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ClaudeCodeError } from "./errors.js";
import type {
  ClaudeCodeClientConfig,
  Usage,
  GenerateTextResult,
  GenerateObjectResult,
  StreamResult,
  GenerateTextOptions,
  GenerateObjectOptions,
  StreamTextOptions,
  ErrorResponse,
  TextResponse,
  ObjectResponse,
} from "./types.js";

// Re-export types and errors
export { ClaudeCodeError } from "./errors.js";
export type { ErrorCode } from "./errors.js";
export type {
  ClaudeCodeClientConfig,
  Usage,
  GenerateTextResult,
  GenerateObjectResult,
  StreamResult,
  GenerateTextOptions,
  GenerateObjectOptions,
  StreamTextOptions,
} from "./types.js";

const DEFAULT_TIMEOUT = 120000; // 2 minutes

/**
 * Claude Code Gateway SDK client.
 *
 * Provides type-safe access to Claude Code via HTTP gateway.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { ClaudeCodeClient } from '@pattern-zones-co/claude-code-gateway-sdk';
 *
 * const client = new ClaudeCodeClient({
 *   baseUrl: 'http://localhost:3100',
 *   authKey: 'your-api-key'
 * });
 *
 * // Generate text
 * const { text } = await client.generateText({
 *   prompt: 'Explain quantum computing'
 * });
 *
 * // Generate typed object
 * const UserSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * const { object } = await client.generateObject({
 *   prompt: 'Extract: John at john@example.com',
 *   schema: UserSchema
 * });
 * // object is typed as { name: string; email: string }
 * ```
 */
export class ClaudeCodeClient {
  private config: ClaudeCodeClientConfig;

  constructor(config: ClaudeCodeClientConfig) {
    this.config = {
      timeout: DEFAULT_TIMEOUT,
      ...config,
    };
  }

  /**
   * Generates plain text response from Claude.
   */
  async generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
    const response = await this.fetch("/generate-text", {
      system: options.system,
      prompt: options.prompt,
      sessionId: options.sessionId,
      model: options.model ?? this.config.model,
    });

    if (!response.ok) {
      const errorBody = await this.safeJsonParse<ErrorResponse>(response);
      throw new ClaudeCodeError(
        errorBody?.error || `HTTP ${response.status} ${response.statusText}`,
        (errorBody?.code as any) || "HTTP_ERROR",
        errorBody?.rawText,
      );
    }

    const result = await this.safeJsonParse<TextResponse>(response);
    if (!result) {
      throw new ClaudeCodeError(
        "Invalid response from gateway: expected JSON",
        "INVALID_RESPONSE",
      );
    }

    return {
      text: result.text,
      usage: result.usage,
      sessionId: result.sessionId,
    };
  }

  /**
   * Generates a structured object matching the provided Zod schema.
   * The response is validated against the schema for type safety.
   */
  async generateObject<T>(
    options: GenerateObjectOptions<T>,
  ): Promise<GenerateObjectResult<T>> {
    // Convert Zod schema to JSON Schema
    const jsonSchema = zodToJsonSchema(options.schema, {
      $refStrategy: "none",
      target: "jsonSchema7",
    });

    const response = await this.fetch("/generate-object", {
      system: options.system,
      prompt: options.prompt,
      schema: jsonSchema,
      sessionId: options.sessionId,
      model: options.model ?? this.config.model,
    });

    if (!response.ok) {
      const errorBody = await this.safeJsonParse<ErrorResponse>(response);
      throw new ClaudeCodeError(
        errorBody?.error || `HTTP ${response.status} ${response.statusText}`,
        (errorBody?.code as any) || "HTTP_ERROR",
        errorBody?.rawText,
      );
    }

    const result = await this.safeJsonParse<ObjectResponse>(response);
    if (!result) {
      throw new ClaudeCodeError(
        "Invalid response from gateway: expected JSON",
        "INVALID_RESPONSE",
      );
    }

    // Validate response against Zod schema for type safety
    const parseResult = options.schema.safeParse(result.object);
    if (!parseResult.success) {
      throw new ClaudeCodeError(
        `Response validation failed: ${parseResult.error.message}`,
        "VALIDATION_ERROR",
        result.rawText,
      );
    }

    return {
      object: parseResult.data,
      rawText: result.rawText,
      usage: result.usage,
      sessionId: result.sessionId,
    };
  }

  /**
   * Streams text response from Claude via Server-Sent Events.
   * Returns a ReadableStream of text chunks plus promises for metadata.
   */
  async streamText(options: StreamTextOptions): Promise<StreamResult> {
    const response = await this.fetch("/stream", {
      system: options.system,
      prompt: options.prompt,
      sessionId: options.sessionId,
      model: options.model ?? this.config.model,
    });

    if (!response.ok) {
      const errorBody = await this.safeJsonParse<ErrorResponse>(response);
      throw new ClaudeCodeError(
        errorBody?.error || `HTTP ${response.status} ${response.statusText}`,
        (errorBody?.code as any) || "HTTP_ERROR",
        errorBody?.rawText,
      );
    }

    if (!response.body) {
      throw new ClaudeCodeError(
        "No response body from gateway",
        "NO_RESPONSE_BODY",
      );
    }

    // Set up promises for session, usage, and accumulated text
    let resolveSessionId: (value: string) => void;
    let rejectSessionId: (error: Error) => void;
    const sessionIdPromise = new Promise<string>((resolve, reject) => {
      resolveSessionId = resolve;
      rejectSessionId = reject;
    });

    let resolveUsage: (value: Usage) => void;
    let rejectUsage: (error: Error) => void;
    const usagePromise = new Promise<Usage>((resolve, reject) => {
      resolveUsage = resolve;
      rejectUsage = reject;
    });

    let resolveText: (value: string) => void;
    let rejectText: (error: Error) => void;
    const textPromise = new Promise<string>((resolve, reject) => {
      resolveText = resolve;
      rejectText = reject;
    });

    let accumulatedText = "";
    let sessionIdReceived = false;
    let usageReceived = false;

    // Transform SSE events into text chunks
    const textStream = response.body
      .pipeThrough(this.createSSEParser())
      .pipeThrough(
        new TransformStream<{ event: string; data: string }, string>({
          transform(sseEvent, controller) {
            const isCriticalEvent = ["session", "result", "error", "done"].includes(
              sseEvent.event,
            );

            try {
              switch (sseEvent.event) {
                case "session": {
                  const parsed = JSON.parse(sseEvent.data) as { sessionId: string };
                  if (!sessionIdReceived) {
                    sessionIdReceived = true;
                    resolveSessionId(parsed.sessionId);
                  }
                  break;
                }
                case "text": {
                  const parsed = JSON.parse(sseEvent.data) as { text: string };
                  accumulatedText += parsed.text;
                  controller.enqueue(parsed.text);
                  break;
                }
                case "result": {
                  const parsed = JSON.parse(sseEvent.data) as {
                    sessionId: string;
                    usage: Usage;
                  };
                  usageReceived = true;
                  resolveUsage(parsed.usage);
                  if (!sessionIdReceived) {
                    sessionIdReceived = true;
                    resolveSessionId(parsed.sessionId);
                  }
                  break;
                }
                case "error": {
                  const parsed = JSON.parse(sseEvent.data) as {
                    error: string;
                    code?: string;
                  };
                  const error = new ClaudeCodeError(
                    parsed.error,
                    (parsed.code as any) || "STREAM_ERROR",
                  );
                  usageReceived = true;
                  rejectUsage(error);
                  rejectText(error);
                  if (!sessionIdReceived) {
                    rejectSessionId(error);
                  }
                  controller.error(error);
                  break;
                }
                case "done": {
                  resolveText(accumulatedText);
                  break;
                }
              }
            } catch (parseError) {
              if (isCriticalEvent) {
                const error = new ClaudeCodeError(
                  `Failed to parse critical SSE event: ${sseEvent.event}`,
                  "SSE_PARSE_ERROR",
                );
                if (!usageReceived) {
                  usageReceived = true;
                  rejectUsage(error);
                }
                rejectText(error);
                if (!sessionIdReceived) {
                  rejectSessionId(error);
                }
                controller.error(error);
              }
              // Non-critical events: log silently, continue stream
            }
          },
          flush() {
            if (!sessionIdReceived) {
              rejectSessionId(
                new ClaudeCodeError("Stream ended without session ID", "NO_SESSION"),
              );
            }
            if (!usageReceived) {
              rejectUsage(
                new ClaudeCodeError(
                  "Stream ended without usage information",
                  "NO_USAGE",
                ),
              );
            }
            resolveText(accumulatedText);
          },
        }),
      );

    return {
      textStream,
      sessionId: sessionIdPromise,
      usage: usagePromise,
      text: textPromise,
    };
  }

  /**
   * Makes an authenticated fetch request to the gateway.
   */
  private async fetch(path: string, body: Record<string, unknown>): Promise<Response> {
    return fetch(`${this.config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.authKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout!),
    });
  }

  /**
   * Safely parses JSON from response, returning null on failure.
   */
  private async safeJsonParse<T>(response: Response): Promise<T | null> {
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  /**
   * Creates a TransformStream that parses SSE format.
   */
  private createSSEParser(): TransformStream<Uint8Array, { event: string; data: string }> {
    let buffer = "";
    const decoder = new TextDecoder();

    return new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          const lines = eventStr.split("\n");
          let eventType = "";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              data = line.slice(6);
            }
          }

          if (eventType && data) {
            controller.enqueue({ event: eventType, data });
          }
        }
      },
      flush(controller) {
        if (buffer.trim()) {
          const lines = buffer.split("\n");
          let eventType = "";
          let data = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              data = line.slice(6);
            }
          }

          if (eventType && data) {
            controller.enqueue({ event: eventType, data });
          }
        }
      },
    });
  }
}

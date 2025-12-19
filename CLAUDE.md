# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (uses pnpm workspaces)
pnpm install

# Start gateway in dev mode (hot reload)
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint (TypeScript type checking)
pnpm lint
```

### Package-specific commands

```bash
# Gateway package
pnpm --filter @pattern-zones-co/claude-code-gateway dev
pnpm --filter @pattern-zones-co/claude-code-gateway test
pnpm --filter @pattern-zones-co/claude-code-gateway test:run  # Single run (no watch)

# SDK package
pnpm --filter @pattern-zones-co/claude-code-gateway-sdk build
pnpm --filter @pattern-zones-co/claude-code-gateway-sdk test
```

### Required environment variables

```bash
CLAUDE_CODE_GATEWAY_API_KEY="..."  # Required: API key for authenticating requests
# Optional: Authentication method (one of these)
CLAUDE_CODE_OAUTH_TOKEN="..."      # OAuth token for Claude Max subscribers
ANTHROPIC_API_KEY="..."            # API key (used if OAuth token not set)
```

## Architecture

This is a pnpm monorepo with two packages:

```
packages/
├── gateway/     # Express HTTP server wrapping Claude CLI
└── sdk/         # TypeScript client with Zod schema support
examples/
├── basic-fetch/       # Plain JavaScript usage
└── typescript-zod/    # TypeScript SDK with Zod schemas
```

### Gateway (`packages/gateway`)

HTTP server that spawns Claude CLI as a subprocess for each request:

- **`src/index.ts`**: Express app setup, auth middleware (timing-safe comparison), route mounting
- **`src/cli.ts`**: Core CLI execution logic via `spawn()`, timeout handling, output parsing
- **`src/routes/generate.ts`**: `/generate-text` and `/generate-object` endpoints
- **`src/routes/stream.ts`**: `/stream` endpoint using SSE with line buffering for TCP chunks
- **`src/types.ts`**: Zod schemas for request validation and TypeScript types

Key patterns:
- Uses `claude --print --output-format json` for non-streaming
- Uses `claude --print --verbose --output-format stream-json` for streaming
- Session continuity via `--resume <sessionId>` flag
- OAuth token takes precedence over API key when both present (`buildClaudeEnv()`)
- Environment variables prefixed with `CLAUDE_CODE_GATEWAY_*` pass through to CLI subprocess

### SDK (`packages/sdk`)

Type-safe client for the gateway:

- **`src/index.ts`**: `ClaudeCodeClient` class with `generateText()`, `generateObject()`, `streamText()` methods
- **`src/types.ts`**: Client configuration and response types
- **`src/errors.ts`**: Custom `ClaudeCodeError` class

Key patterns:
- Zod schemas converted to JSON Schema via `zod-to-json-schema`
- Response validation against provided Zod schema for type safety
- SSE parsing with custom `TransformStream` for streaming
- Promises for session ID and usage resolve at different stream stages

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check (no auth) |
| `POST /generate-text` | Plain text generation |
| `POST /generate-object` | Structured JSON matching a schema |
| `POST /stream` | Server-Sent Events streaming |

## Error Codes

Defined in `packages/gateway/src/types.ts`:
- `VALIDATION_ERROR`, `PARSE_ERROR`, `TIMEOUT_ERROR`, `CLI_EXIT_ERROR`, `SPAWN_ERROR`, `INTERNAL_ERROR`, `UNKNOWN_ERROR`

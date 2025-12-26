# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Koine is an HTTP gateway that exposes Claude Code CLI as a REST API, with TypeScript and Python SDKs. It enables applications to programmatically interact with Claude Code's agentic coding capabilities.

## Build & Development Commands

```bash
# Install dependencies
bun install

# Start gateway with hot reload (port 3100)
bun run dev

# Build all packages
bun run build

# Start production gateway
bun run start

# Run all tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage

# Lint all packages
bun run lint

# Format code
bun run format

# Regenerate OpenAPI spec
bun run openapi:generate

# Verify OpenAPI spec is current
bun run openapi:check
```

### Package-Specific Commands

```bash
# Gateway E2E tests (requires running gateway)
cd packages/gateway && RUN_E2E_TESTS=true bun run test:e2e

# TypeScript SDK examples (requires running gateway)
cd packages/sdks/typescript
bun run example:hello
bun run example:stream
bun run example:conversation

# Python SDK tests
cd packages/sdks/python
uv run pytest tests/
```

## Architecture

**Monorepo structure using Bun workspaces:**
- `packages/gateway` - Express HTTP service wrapping Claude Code CLI
- `packages/sdks/typescript` - TypeScript SDK client
- `packages/sdks/python` - Python SDK client (async httpx + Pydantic)

**Request flow:**
1. Client → Gateway HTTP endpoint (`/generate-text`, `/generate-object`, `/stream`)
2. Gateway validates request (Zod schemas), authenticates via Bearer token
3. Gateway spawns `claude --print --output-format json` subprocess
4. CLI output parsed → structured response returned to client

**Key files:**
- `packages/gateway/src/cli.ts` - Claude CLI subprocess execution and output parsing
- `packages/gateway/src/index.ts` - Express app setup, auth middleware
- `packages/gateway/src/routes/` - API endpoint handlers
- `packages/gateway/src/types.ts` - Zod schemas for request/response validation

**Session management:** Pass `sessionId` to maintain conversation context across requests. The gateway uses `--resume <id>` to continue existing sessions.

## Environment Variables

Required in `.env` at project root:
```bash
CLAUDE_CODE_GATEWAY_API_KEY=your-secret  # Gateway auth
ANTHROPIC_API_KEY=your-api-key           # Claude API auth (preferred)
```

## Testing

- **Framework:** Vitest for TypeScript, pytest for Python
- **Test setup:** Console output suppressed by default; enable with `DEBUG_TESTS=true`
- **Mocking:** Tests use `packages/gateway/__tests__/helpers.ts` for CLI subprocess mocks

## Code Quality

- **Linter/Formatter:** Biome (TypeScript/JSON), Ruff (Python)
- **Type checking:** `tsc --noEmit` (strict mode), pyright (strict mode)
- **Pre-commit hooks:** Auto-run Biome, Ruff, shellcheck, hadolint, ripsecrets

**Commit format:** Conventional commits enforced (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, etc.)

## Python SDK Notes

Uses `uv` for package management. Key files:
- `packages/sdks/python/src/koine_sdk/` - SDK implementation
- Async-first design using `httpx` and `asyncio`
- Pydantic models for type validation

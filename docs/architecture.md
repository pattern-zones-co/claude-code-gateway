# Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Your Application (SDK or HTTP client)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTP REST API
┌─────────────────────────────────────────────────────────────────────────┐
│  Koine Gateway (Express)                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ /generate-text    → Text generation                                 ││
│  │ /generate-object  → Structured JSON extraction                      ││
│  │ /stream           → Server-Sent Events                              ││
│  │ /health           → Health check                                    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                           │ Subprocess                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Claude Code CLI + Skills                                            ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
koine/
├── packages/
│   ├── gateway/                     # HTTP gateway server
│   │   └── src/
│   │       ├── index.ts             # Express app, auth middleware
│   │       ├── cli.ts               # Claude CLI subprocess
│   │       ├── types.ts             # Request/response types
│   │       └── routes/
│   │           ├── generate.ts      # /generate-text, /generate-object
│   │           ├── stream.ts        # /stream (SSE)
│   │           └── health.ts        # /health
│   └── sdks/
│       ├── typescript/              # TypeScript SDK
│       │   └── src/
│       │       ├── index.ts         # Public exports
│       │       ├── client.ts        # createKoine factory, KoineClient
│       │       ├── text.ts          # generateText implementation
│       │       ├── object.ts        # generateObject implementation
│       │       ├── stream/          # streamText implementation (SSE)
│       │       ├── types.ts         # Type definitions
│       │       └── errors.ts        # KoineError
│       └── python/                  # Python SDK
│           └── src/koine_sdk/
│               ├── __init__.py      # Public exports
│               ├── client.py        # create_koine factory, KoineClient
│               ├── text.py          # generate_text implementation
│               ├── object.py        # generate_object implementation
│               ├── stream/          # stream_text implementation (SSE)
│               ├── types.py         # Type definitions
│               └── errors.py        # KoineError
├── claude-assets/                   # Skills and commands
├── docs/
├── Dockerfile
└── docker-compose.yml
```

# Documentation

| Guide | Description |
|-------|-------------|
| [API Reference](api-reference.md) | REST endpoints |
| [SDK Guide](sdk-guide.md) | TypeScript & Python SDKs |
| [Examples](examples/) | Runnable SDK examples |
| [Docker Deployment](docker-deployment.md) | Production deployment |
| [Skills & Commands](skills-and-commands.md) | Extending Claude Code |
| [Environment Variables](environment-variables.md) | Configuration |
| [Architecture](architecture.md) | System design |

## Getting Started

```bash
docker run -d -p 3100:3100 \
  -e CLAUDE_CODE_GATEWAY_API_KEY=your-key \
  -e ANTHROPIC_API_KEY=your-anthropic-api-key \
  ghcr.io/pattern-zones-co/koine:latest

curl http://localhost:3100/health
```

See [Docker Deployment](docker-deployment.md) for docker-compose setup, version pinning, and production configuration.

### From Source

Alternatively, clone and build from source:

```bash
git clone https://github.com/pattern-zones-co/koine.git
cd koine

cp .env.example .env
# Edit .env with your keys

docker compose up -d
```

### Usage

#### curl

```bash
curl -X POST http://localhost:3100/generate-text \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLAUDE_CODE_GATEWAY_API_KEY" \
  -d '{"prompt": "Hello!"}'
```

#### TypeScript SDK

```bash
bun add @patternzones/koine-sdk
# or: npm install @patternzones/koine-sdk
```

```typescript
import { createKoine } from '@patternzones/koine-sdk';

const koine = createKoine({
  baseUrl: 'http://localhost:3100',
  authKey: 'your-api-key',
});

const result = await koine.generateText({ prompt: 'Hello!' });
console.log(result.text);
```

#### Python SDK

```bash
uv pip install koine-sdk
# or: pip install koine-sdk
```

```python
from koine_sdk import create_koine

koine = create_koine(
    base_url="http://localhost:3100",
    auth_key="your-api-key",
)

result = await koine.generate_text(prompt="Hello!")
print(result.text)
```

See the [SDK Guide](sdk-guide.md) for streaming and structured output.

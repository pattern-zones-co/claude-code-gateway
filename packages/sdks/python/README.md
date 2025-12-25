# Koine Python SDK

Async Python client for [Koine](https://github.com/pattern-zones-co/koine) gateway services.

## Installation

```bash
pip install koine-sdk
```

## Quick Start

```python
import asyncio
from koine_sdk import KoineConfig, generate_text

config = KoineConfig(
    base_url="http://localhost:3100",
    timeout=300.0,
    auth_key="your-api-key",
)

async def main():
    result = await generate_text(config, prompt="What is 2 + 2?")
    print(result.text)

asyncio.run(main())
```

## Features

### Text Generation

```python
from koine_sdk import generate_text

result = await generate_text(
    config,
    prompt="Explain quantum computing",
    system="You are a helpful assistant",
)
print(result.text)
print(f"Tokens: {result.usage.total_tokens}")
```

### Streaming

```python
from koine_sdk import stream_text

result = await stream_text(config, prompt="Write a story")

async for chunk in result.text_stream:
    print(chunk, end="", flush=True)

usage = await result.usage()
print(f"\nTokens: {usage.total_tokens}")
```

### Structured Output

```python
from pydantic import BaseModel
from koine_sdk import generate_object

class Recipe(BaseModel):
    name: str
    ingredients: list[str]
    steps: list[str]

result = await generate_object(
    config,
    prompt="Give me a recipe for chocolate chip cookies",
    schema=Recipe,
)
print(result.object.name)
print(result.object.ingredients)
```

### Multi-turn Conversations

```python
# First message
result1 = await generate_text(config, prompt="My name is Alice")

# Continue conversation
result2 = await generate_text(
    config,
    prompt="What's my name?",
    session_id=result1.session_id,
)
```

## Error Handling

```python
from koine_sdk import KoineError

try:
    result = await generate_text(config, prompt="Hello")
except KoineError as e:
    print(f"Error [{e.code}]: {e}")
    if e.raw_text:
        print(f"Raw response: {e.raw_text}")
```

Error codes: `HTTP_ERROR`, `INVALID_RESPONSE`, `VALIDATION_ERROR`, `STREAM_ERROR`, `SSE_PARSE_ERROR`, `NO_SESSION`, `NO_USAGE`

## API Reference

### Configuration

```python
@dataclass
class KoineConfig:
    base_url: str        # Gateway URL (e.g., "http://localhost:3100")
    timeout: float       # Request timeout in seconds
    auth_key: str        # Authentication key
    model: str | None    # Optional model alias (e.g., "sonnet", "haiku")
```

### Functions

- `generate_text(config, *, prompt, system?, session_id?)` - Text generation
- `stream_text(config, *, prompt, system?, session_id?)` - Streaming text
- `generate_object(config, *, prompt, schema, system?, session_id?)` - Structured output

## License

MIT

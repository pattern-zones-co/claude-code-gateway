"""
Koine SDK

An async Python client for interacting with Koine gateway services.

Example:
    from koine_sdk import generate_text, KoineConfig

    config = KoineConfig(
        base_url="http://localhost:3100",
        timeout=300.0,
        auth_key="your-api-key",
        model="sonnet",
    )

    result = await generate_text(config, prompt="Hello!")
    print(result.text)
"""

__version__ = "1.1.5"

# Types
# Client functions
from .client import generate_object, generate_text, stream_text

# Errors
from .errors import KoineError
from .types import (
    GenerateObjectResult,
    GenerateTextResult,
    KoineConfig,
    KoineUsage,
    StreamTextResult,
)

__all__ = [
    "GenerateObjectResult",
    "GenerateTextResult",
    "KoineConfig",
    "KoineError",
    "KoineUsage",
    "StreamTextResult",
    "generate_object",
    "generate_text",
    "stream_text",
]

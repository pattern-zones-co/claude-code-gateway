"""Client functions for Koine gateway service."""

from typing import TypeVar

from pydantic import BaseModel

from .types import (
    GenerateObjectResult,
    GenerateTextResult,
    KoineConfig,
    StreamTextResult,
)

T = TypeVar("T", bound=BaseModel)


async def generate_text(
    config: KoineConfig,
    *,
    prompt: str,
    system: str | None = None,
    session_id: str | None = None,
) -> GenerateTextResult:
    """Generate plain text response from Koine gateway service."""
    raise NotImplementedError("Will be implemented in next commit")


async def generate_object(
    config: KoineConfig,
    *,
    prompt: str,
    schema: type[T],
    system: str | None = None,
    session_id: str | None = None,
) -> GenerateObjectResult[T]:
    """Generate structured JSON response from Koine gateway service."""
    raise NotImplementedError("Will be implemented in next commit")


async def stream_text(
    config: KoineConfig,
    *,
    prompt: str,
    system: str | None = None,
    session_id: str | None = None,
) -> StreamTextResult:
    """Stream text response from Koine gateway service."""
    raise NotImplementedError("Will be implemented in next commit")

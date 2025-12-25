"""Type definitions for Koine SDK."""

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


@dataclass(frozen=True)
class KoineConfig:
    """Configuration for connecting to a Koine gateway service."""

    base_url: str
    """Base URL of the gateway service (e.g., "http://localhost:3100")"""

    timeout: float
    """Request timeout in seconds"""

    auth_key: str
    """Authentication key for the gateway service (required)"""

    model: str | None = None
    """Model alias (e.g., 'sonnet', 'haiku') or full model name"""


class KoineUsage(BaseModel):
    """Usage information from Koine gateway service."""

    input_tokens: int
    output_tokens: int
    total_tokens: int


class GenerateTextResult(BaseModel):
    """Result from text generation."""

    text: str
    usage: KoineUsage
    session_id: str


class GenerateObjectResult(BaseModel, Generic[T]):
    """Result from object generation."""

    object: T
    raw_text: str
    usage: KoineUsage
    session_id: str


@dataclass
class StreamTextResult:
    """Result from streaming text generation.

    The text_stream yields text chunks as they arrive.
    session_id(), usage(), and text() are async methods that resolve
    at different times during the stream.
    """

    text_stream: AsyncIterator[str]
    """Async iterator of text chunks as they arrive"""

    _session_id: str | None = None
    _usage: KoineUsage | None = None
    _text: str | None = None

    async def session_id(self) -> str:
        """Session ID for conversation continuity.

        Resolves early in stream, after session event.
        """
        if self._session_id is None:
            raise RuntimeError("Session ID not yet available")
        return self._session_id

    async def usage(self) -> KoineUsage:
        """Usage stats. Resolves when stream completes."""
        if self._usage is None:
            raise RuntimeError("Usage not yet available")
        return self._usage

    async def text(self) -> str:
        """Full accumulated text. Resolves when stream completes."""
        if self._text is None:
            raise RuntimeError("Text not yet available")
        return self._text


# Internal response types for parsing gateway responses
# These are not exported in __init__.py but are used across package modules


class GatewayTextResponse(BaseModel):
    """Response from generate-text endpoint (internal)."""

    text: str
    usage: KoineUsage
    sessionId: str


class GatewayObjectResponse(BaseModel):
    """Response from generate-object endpoint (internal)."""

    object: object
    rawText: str
    usage: KoineUsage
    sessionId: str


class GatewayErrorResponse(BaseModel):
    """Error response from Koine gateway service (internal)."""

    error: str
    code: str
    rawText: str | None = None


class SSETextEvent(BaseModel):
    """SSE text event from stream endpoint (internal)."""

    text: str


class SSESessionEvent(BaseModel):
    """SSE session event from stream endpoint (internal)."""

    sessionId: str


class SSEResultEvent(BaseModel):
    """SSE result event from stream endpoint (internal)."""

    sessionId: str
    usage: KoineUsage


class SSEErrorEvent(BaseModel):
    """SSE error event from stream endpoint (internal)."""

    error: str
    code: str | None = None

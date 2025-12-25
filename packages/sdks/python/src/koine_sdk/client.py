"""Client functions for Koine gateway service."""

from typing import Any, TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from .errors import KoineError
from .types import (
    GatewayErrorResponse,
    GatewayObjectResponse,
    GatewayTextResponse,
    GenerateObjectResult,
    GenerateTextResult,
    KoineConfig,
    StreamTextResult,
)

T = TypeVar("T", bound=BaseModel)


def _parse_error_response(response: httpx.Response) -> KoineError:
    """Parse error response from gateway, handling non-JSON gracefully."""
    try:
        data = response.json()
        error_resp = GatewayErrorResponse.model_validate(data)
        return KoineError(
            error_resp.error,
            error_resp.code,
            error_resp.rawText,
        )
    except Exception:
        return KoineError(
            f"HTTP {response.status_code} {response.reason_phrase}",
            "HTTP_ERROR",
        )


async def generate_text(
    config: KoineConfig,
    *,
    prompt: str,
    system: str | None = None,
    session_id: str | None = None,
) -> GenerateTextResult:
    """Generate plain text response from Koine gateway service.

    Args:
        config: Gateway configuration
        prompt: The user prompt to send
        system: Optional system prompt
        session_id: Optional session ID for conversation continuity

    Returns:
        GenerateTextResult with text, usage, and session_id

    Raises:
        KoineError: On HTTP errors or invalid responses
    """
    async with httpx.AsyncClient(timeout=config.timeout) as client:
        response = await client.post(
            f"{config.base_url}/generate-text",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {config.auth_key}",
            },
            json={
                "system": system,
                "prompt": prompt,
                "sessionId": session_id,
                "model": config.model,
            },
        )

        if not response.is_success:
            raise _parse_error_response(response)

        try:
            data = response.json()
            result = GatewayTextResponse.model_validate(data)
        except (ValueError, ValidationError) as e:
            raise KoineError(
                f"Invalid response from Koine gateway: {e}",
                "INVALID_RESPONSE",
            ) from e

        return GenerateTextResult(
            text=result.text,
            usage=result.usage,
            session_id=result.sessionId,
        )


async def generate_object(
    config: KoineConfig,
    *,
    prompt: str,
    schema: type[T],
    system: str | None = None,
    session_id: str | None = None,
) -> GenerateObjectResult[T]:
    """Generate structured JSON response from Koine gateway service.

    Converts the Pydantic schema to JSON Schema for the gateway service,
    then validates the response against the original schema.

    Args:
        config: Gateway configuration
        prompt: The user prompt to send
        schema: Pydantic model class for response validation
        system: Optional system prompt
        session_id: Optional session ID for conversation continuity

    Returns:
        GenerateObjectResult with validated object, rawText, usage, and session_id

    Raises:
        KoineError: On HTTP errors, invalid responses, or validation failures
    """
    # Convert Pydantic model to JSON Schema
    json_schema: dict[str, Any] = schema.model_json_schema()

    async with httpx.AsyncClient(timeout=config.timeout) as client:
        response = await client.post(
            f"{config.base_url}/generate-object",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {config.auth_key}",
            },
            json={
                "system": system,
                "prompt": prompt,
                "schema": json_schema,
                "sessionId": session_id,
                "model": config.model,
            },
        )

        if not response.is_success:
            raise _parse_error_response(response)

        try:
            data = response.json()
            result = GatewayObjectResponse.model_validate(data)
        except (ValueError, ValidationError) as e:
            raise KoineError(
                f"Invalid response from Koine gateway: {e}",
                "INVALID_RESPONSE",
            ) from e

        # Validate response object against the Pydantic schema
        try:
            validated_object = schema.model_validate(result.object)
        except ValidationError as e:
            raise KoineError(
                f"Response validation failed: {e}",
                "VALIDATION_ERROR",
                result.rawText,
            ) from e

        return GenerateObjectResult[T](
            object=validated_object,
            raw_text=result.rawText,
            usage=result.usage,
            session_id=result.sessionId,
        )


async def stream_text(
    config: KoineConfig,
    *,
    prompt: str,
    system: str | None = None,
    session_id: str | None = None,
) -> StreamTextResult:
    """Stream text response from Koine gateway service.

    Returns a StreamTextResult with:
    - text_stream: AsyncIterator of text chunks as they arrive
    - session_id(): Resolves early in stream
    - usage(): Resolves when stream completes
    - text(): Full accumulated text, resolves when stream completes

    Args:
        config: Gateway configuration
        prompt: The user prompt to send
        system: Optional system prompt
        session_id: Optional session ID for conversation continuity

    Returns:
        StreamTextResult for streaming consumption

    Raises:
        KoineError: On HTTP errors or stream errors
    """
    raise NotImplementedError("Will be implemented in next commit")

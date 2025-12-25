"""Custom error class for Koine client errors."""


class KoineError(Exception):
    """Custom error class for Koine client errors.

    Error codes:
        HTTP_ERROR: HTTP request failed
        INVALID_RESPONSE: Response not valid JSON
        VALIDATION_ERROR: Schema validation failed
        STREAM_ERROR: Error during streaming
        SSE_PARSE_ERROR: Failed to parse SSE event
        NO_SESSION: Stream ended without session ID
        NO_USAGE: Stream ended without usage info
    """

    def __init__(self, message: str, code: str, raw_text: str | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.raw_text = raw_text

    def __repr__(self) -> str:
        return f"KoineError({self.code!r}, {str(self)!r})"

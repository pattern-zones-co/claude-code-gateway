# Environment Variables

## Required

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_GATEWAY_API_KEY` | Bearer token for gateway API requests |

## Claude Authentication (one required)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (recommended for automation) |
| `CLAUDE_CODE_OAUTH_TOKEN` | OAuth token (Claude Pro/Max). See [Terms Considerations](#terms-considerations). |

## Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `GATEWAY_PORT` | `3100` | HTTP server port |

## Example

```bash
# .env
CLAUDE_CODE_GATEWAY_API_KEY=your-secure-api-key
ANTHROPIC_API_KEY=sk-ant-...
GATEWAY_PORT=3100
```

## Terms Considerations

**API keys** are the recommended authentication method for Koine and automation use cases. They operate under [Anthropic's Commercial Terms](https://www.anthropic.com/legal/commercial-terms) which explicitly permit programmatic access.

**OAuth tokens** (Claude Pro/Max subscriptions) are appropriate for personal testing and development only. For production or shared deployments, use an API key.

If both are set, the OAuth token takes precedence. For automation, set only `ANTHROPIC_API_KEY`.

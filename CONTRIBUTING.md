# Contributing

We're eager for collaborators! This project is in early stages and there's plenty of opportunity to shape its direction.

## Getting Started

```bash
pnpm install
pnpm dev      # Start gateway with hot reload
pnpm test     # Run tests
pnpm lint     # Type check
```

## How to Contribute

1. Fork the repo and create a branch
2. Make your changes
3. Run `pnpm test && pnpm lint`
4. Open a pull request

That's it. We'll figure out the details together.

## Roadmap

Looking for ideas? Here are improvements we'd love help with:

- **Concurrency limits** - Limit concurrent CLI subprocesses to prevent resource exhaustion
- **Request queuing** - Queue requests when concurrency limit is reached instead of rejecting
- **Rate limiting** - Per-key request throttling
- **Response caching** - Cache identical prompts
- **Python SDK** - Port the TypeScript SDK to Python ([#2](https://github.com/pattern-zones-co/koine/issues/2))
- **Docker Hardened Images** - Migrate to zero-CVE base images ([#1](https://github.com/pattern-zones-co/koine/issues/1))

Have a different idea? Open an issue and let's discuss.

## Questions?

Open an issue or start a discussion. We're happy to help.

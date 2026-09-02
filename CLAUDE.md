# Claude guidance

This repository’s authoritative project instructions live in [AGENTS.md](AGENTS.md). Read that file first for repo conventions, architecture, and task-specific guidance.

- Use the same Next.js 16 app-router conventions described in [AGENTS.md](AGENTS.md).
- Prefer existing `src/lib/firebase` and `src/lib/services` abstractions over direct Firebase SDK calls.
- Preserve the route groups and demo-mode fallbacks used in this project when Firebase is unavailable.

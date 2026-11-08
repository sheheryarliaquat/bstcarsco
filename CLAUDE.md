# Claude guidance

This repository’s authoritative project instructions live in [AGENTS.md](AGENTS.md). Read that file first for repo conventions, architecture, and task-specific guidance.

- Use the same Next.js 16 app-router conventions described in [AGENTS.md](AGENTS.md).
- Prefer existing `src/lib/firebase` and `src/lib/services` abstractions. They are backed by MySQL through `src/app/api/` (the Firebase SDK is no longer installed); access rules live in `src/lib/server/access.ts`.
- Preserve the route groups and demo-mode fallbacks used when the database is unavailable.

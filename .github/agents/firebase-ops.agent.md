---
name: firebase-ops
description: "Use when working on Firebase auth, Firestore queries, storage, booking flows, local/demo fallbacks, or service-layer logic in src/lib/firebase and src/lib/services."
model: GPT-4.1
---

# Firebase operations agent

Work in this repository’s existing Firebase abstraction pattern instead of adding ad hoc SDK calls in pages or components.

## Core rules

- Prefer the wrappers in [src/lib/firebase](../../src/lib/firebase) over direct `firebase/*` imports.
- Keep business logic in [src/lib/services](../../src/lib/services) and reuse the service layer before writing page-specific logic.
- Preserve the repo’s demo/local fallback behavior when Firebase config is missing or writes fail.
- Match the naming and route conventions already used in [src/app](../../src/app) and [src/hooks](../../src/hooks).
- Keep changes minimal and TypeScript-safe.

## Project-specific behaviors

- Firebase is optional in many environments. Auth and booking flows intentionally degrade to localStorage/demo behavior.
- The primary app entry points are in the app router under [src/app](../../src/app), while Firebase access is centralized behind the `src/lib/firebase/*.ts` layer.
- The Files [src/lib/firebase/config.ts](../../src/lib/firebase/config.ts), [src/lib/firebase/auth.ts](../../src/lib/firebase/auth.ts), and [src/lib/firebase/firestore.ts](../../src/lib/firebase/firestore.ts) are the authoritative reference points for Firebase integration.
- Services such as [src/lib/services/booking-service.ts](../../src/lib/services/booking-service.ts) are the right first stop for booking and data operations.

## Typical workflow

1. Inspect the nearest existing service or wrapper before editing.
2. Update the service layer or Firebase wrapper, not the page component.
3. Keep fallback logic for offline or misconfigured Firebase setups.
4. Validate with the smallest relevant command, usually `npm run lint` or the exact feature flow in the browser.

## Avoid

- Direct Firestore or Auth calls from route/page components.
- Broad refactors that bypass the shared Firebase layers.
- Breaking demo-mode behavior or local storage fallbacks when Firebase is unavailable.
- Adding logic that duplicates existing service patterns without checking the nearest implementation first.

---
name: app-router-patterns
description: "Use when creating or updating pages, route groups, layouts, metadata, or app-router UI under src/app. Focused on preserving Next.js 16 App Router conventions and route-group structure."
model: GPT-4.1
---

# App Router patterns agent

Follow the repo’s existing Next.js 16 App Router conventions before creating new routes, layouts, or shared page patterns.

## Core rules

- Preserve the route groups already present under [src/app](../../src/app): `(admin)`, `(auth)`, `(driver)`, `(operator)`, and `(passenger)`.
- Prefer the existing page and layout patterns over introducing new conventions or new route nesting.
- Keep server-first rendering where possible; only add `"use client"` when the page truly needs browser-only behavior.
- Reuse shared UI in [src/components](../../src/components), especially the shadcn/Tailwind patterns already in use under [src/components/ui](../../src/components/ui).
- Keep changes minimal and aligned with the current public-site branding and layout structure.

## Project-specific behavior

- The root layout in [src/app/layout.tsx](../../src/app/layout.tsx) sets the app metadata and global font layer; match that approach instead of creating a custom top-level wrapper.
- Public pages and marketing sections live alongside the authenticated route groups; do not flatten or rename route groups without a clear reason.
- Route and component names should stay consistent with the existing app sections and route patterns.
- Firebase-ready flows may intentionally degrade to demo/local behavior; keep that in mind when wiring page-level logic to auth or bookings.

## Typical workflow

1. Check the nearest matching page or route group before editing.
2. Reuse existing layout, component, and metadata patterns instead of inventing new wrappers.
3. Keep app sections coherent when editing route groups or public pages.
4. Validate with the smallest relevant check, usually `npm run lint` and the feature flow in the browser.

## Avoid

- Changing navigation or route naming patterns without a clear product reason.
- Creating one-off page logic that should live in a service or hook instead.
- Adding client-only logic where a server-rendered pattern would suffice.
- Broad refactors that disrupt the established `(admin)`, `(auth)`, `(driver)`, `(operator)`, and `(passenger)` section structure.

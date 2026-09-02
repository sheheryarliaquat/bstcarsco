<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository guide for AI coding agents

This repo is a Next.js 16 app using the App Router and TypeScript. Use the existing project conventions before introducing new patterns.

## Quick start

- Install dependencies: `npm install`
- Start app: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Seed demo data: `npm run seed`
- Create admin user: `npm run create-admin`

The app is configured with the `@/*` alias to `src/*` and the root project is intentionally split between app routes, reusable UI, and Firebase/service layers.

## Architecture and boundaries

- `src/app/`: route structure and page-level UI. Route groups such as `(admin)`, `(auth)`, `(driver)`, `(operator)`, and `(passenger)` are intentional and should be preserved.
- `src/components/`: shared UI. Reuse existing components in `src/components/ui/` and other feature folders before creating one-off solutions.
- `src/lib/firebase/`: the Firebase integration layer. Prefer these wrappers over direct SDK imports in page or component code.
- `src/lib/services/`: business logic and collection-specific accessors such as booking and user service methods.
- `src/hooks/`: client-side composable hooks such as `useAuth` and `useFirestore`.
- `src/types/`: shared domain types.
- `functions/src/index.ts`: Firebase Cloud Functions backend; keep server-side logic there instead of scattering backend code into the Next app.

## Conventions to follow

- Prefer TypeScript types and keep code aligned to the existing `@/types` domain model.
- Client components should opt in with `"use client"` only when needed. Keep server-first rendering where possible.
- Route and component names should stay consistent with the existing app sections and route groups.
- When working with Firebase, use the abstraction in `src/lib/firebase/*.ts` and `src/lib/services/*.ts` instead of adding ad hoc `firebase/*` imports across the app.
- Use `localStorage` demo fallbacks intentionally; the project includes a graceful fallback path when Firebase config is absent or writes fail, especially in auth and booking flows.
- Preserve the current app branding and public-site structure; avoid broad refactors that change navigation or route conventions without explicit need.
- Keep changes minimal and aligned with the existing shadcn/Tailwind patterns used throughout the UI.

## Important project-specific behavior

- Firebase is optional in some environments. Auth and booking flows are designed to degrade to demo/local behavior when Firebase is not configured or when writes fail.
- The project uses app-router metadata and global styles from `src/app/layout.tsx` and `src/app/globals.css`.
- `next dev` may add the Next.js warning block at the top of this file; keep it intact so the repo stays consistent with the installed Next version.

## Working effectively in this repo

- Read the nearest existing pattern before making a change. Prefer matching the style in similar pages, service wrappers, and UI components.
- When implementing a new feature, update the most relevant service wrapper or hook instead of embedding logic directly inside the page.
- Validate with the smallest relevant command; typical checks are `npm run lint` and the app-specific feature flow in the browser.
- If you add pages or route groups, keep the existing `(admin)`, `(auth)`, `(driver)`, `(operator)`, and `(passenger)` sections coherent.

## References

- [README.md](README.md)
- [package.json](package.json)
- [src/app/layout.tsx](src/app/layout.tsx)
- [src/lib/firebase/config.ts](src/lib/firebase/config.ts)
- [src/lib/services/booking-service.ts](src/lib/services/booking-service.ts)
- [src/hooks/useAuth.ts](src/hooks/useAuth.ts)

This file is intended to reduce setup friction for agents working in this repository. Keep it concise and practical.

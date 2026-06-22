# PitchProps — Agent Team

This project's ongoing build-out is managed by a small team of specialized agents,
defined as Cursor Skills in `.cursor/skills/`. Invoke one by name (e.g. "use the
roadmap agent") or let them auto-trigger from the cues below.

## The team

| Agent | Skill | Owns | Trigger it when… |
|-------|-------|------|------------------|
| 🗺️ Roadmap Agent | `roadmap-agent` | `ROADMAP.md` | "what's next", "update the roadmap", "status", adding an idea, after a merge |
| 🔨 Feature Builder | `feature-builder` | feature code | implementing a feature / market / page / component |
| 🧪 QA Verifier | `qa-verifier` | quality gate | after a change, before release, "verify / smoke test / regressions" |
| 🚀 Release Manager | `release-manager` | versioning + deploy | "release", "ship", "deploy to prod", "cut a version" |

## How they work together (the loop)

```
Roadmap Agent  ──picks top priority──▶  Feature Builder
      ▲                                       │
      │ marks ✅ + changelog                  ▼
Release Manager ◀──ship verdict──  QA Verifier (lint, build, smoke)
```

1. **Roadmap Agent** reconciles `ROADMAP.md` with the code and names the top P1 item.
2. **Feature Builder** implements it following the stack conventions.
3. **QA Verifier** runs lint + build + regression/smoke checks and gives a verdict.
4. **Roadmap Agent** marks it ✅ and records the changelog entry.
5. **Release Manager** bumps the version and ships to GitHub + Vercel.

## Project conventions (all agents follow)

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind + Zustand.
- Source under `src/`; `@/` import alias; domain types in `src/lib/types.ts`.
- All play-money state + settlement live in `src/lib/store.ts`; money/odds math in
  `src/lib/format.ts`. Don't duplicate these.
- Data sources go through the provider adapter (`src/lib/providers/`); secrets stay
  in server API routes (`src/app/api/**`).
- Entertainment only — **no real money**. Keep that framing in all copy.
- `ROADMAP.md` is the single source of truth for status; keep it current.

## Quick commands

```bash
npm run dev     # local dev
npm run lint    # eslint
npm run build   # production build (release gate)
```

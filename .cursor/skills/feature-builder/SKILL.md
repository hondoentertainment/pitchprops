---
name: feature-builder
description: Implements PitchProps roadmap features following the project's Next.js 16 + React 19 + Zustand + Tailwind conventions and the data-provider adapter pattern. Use when building a new feature, market, page, or component, or when the roadmap-agent hands off the top priority item to implement.
---

# Feature Builder

Implements features from `ROADMAP.md` consistently with the existing architecture.
Smart-by-default — this file only captures what's specific to PitchProps.

## Stack & conventions (must follow)

- **Next.js 16 App Router** + **React 19** + **TypeScript**, files under `src/`.
- **Tailwind CSS** for styling (no CSS modules / styled-components).
- **Zustand** store at `src/lib/store.ts` for all play-money state; persisted to
  `localStorage` via `persist`. Add new persisted fields to `partialize`.
- Use the `@/` import alias (e.g. `@/lib/store`, `@/lib/types`).
- Domain types live in `src/lib/types.ts` — extend there, don't inline types.
- Money/odds math goes through `src/lib/format.ts` helpers (`combineOdds`,
  `impliedProbability`, `STARTING_BALANCE`). Don't re-implement.

## Architecture rules

- **Data is provider-agnostic.** New fixture/odds sources implement the adapter in
  `src/lib/providers/index.ts` returning `Match[]`; never call external APIs from
  components. Keep API keys server-side behind `src/app/api/**/route.ts`.
- **Markets** belong to a `MarketCategory` + `MarketGroup` (`src/lib/types.ts`).
  Adding a market type = update those unions, `CATEGORY_LABELS`, and `groupForCategory`.
- **Settlement** logic is centralized in `store.ts` (`settleDueBets`) and custom-prop
  grading in `src/lib/grade.ts`. Extend these rather than adding parallel paths.
- Custom (user-created) markets use the `custom_` id prefix (`isCustomMarket`).

## Build workflow

```
- [ ] 1. Confirm the feature + acceptance criteria from ROADMAP.md
- [ ] 2. Add/extend types in src/lib/types.ts
- [ ] 3. Implement store/lib logic (+ tests if present)
- [ ] 4. Build UI (page/component) with Tailwind, mobile-first
- [ ] 5. Wire data via provider adapter / API route if external
- [ ] 6. Run lint + build; fix issues
- [ ] 7. Hand to qa-verifier, then ask roadmap-agent to mark shipped
```

## Quality bar

- No `any` unless unavoidable; prefer the existing domain types.
- Handle empty/loading/hydration states (`hydrated` flag in the store).
- Keep components client/server-correct (`"use client"` only where needed).
- Match existing visual language (cards, rounded corners, dark UI).

## Verify

```bash
npm run lint
npm run build
```

Then run `npm run dev` and exercise the feature before handing off.

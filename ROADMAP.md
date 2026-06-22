# PitchProps — Product Roadmap

> Living document. Owned by the **Roadmap Agent** (`.cursor/skills/roadmap-agent`).

**Last updated:** 2026-06-21
**Current version:** v0.3.0

## Status legend

| Symbol | Meaning |
|--------|---------|
| ✅ Shipped | Implemented, verified working |
| ⬜ Planned | Agreed, not started |
| 💡 Idea | Candidate, not yet committed |

---

## v0.3 — Shipped

| Feature | Evidence |
|---------|----------|
| Provider leg grading from real scores | `src/lib/grade-provider.ts`, `src/lib/settle.ts`, `SettlementWatcher.tsx` |
| New gradeable markets (Win To Nil, Exact Total Goals) | `src/lib/providers/mock.ts` |
| Shareable bet slips (Web Share + clipboard) | `src/components/ShareBetButton.tsx`, `src/lib/share-bet.ts` |
| PWA manifest + app icon + theme | `public/manifest.json`, `src/app/icon.tsx`, `layout.tsx` |
| CI + E2E + 39 unit tests | `.github/workflows/ci.yml`, `e2e/`, `src/**/*.test.ts` |
| Production deploy config | `vercel.json` |

## v0.2 — Shipped (quality)

| Feature | Evidence |
|---------|----------|
| Toast notifications | `Toaster.tsx`, `store.ts` |
| Mobile touch targets + a11y | `BetSlip.tsx`, `OddsButton.tsx`, `NavBar.tsx` |

## v0.1 — Shipped (core)

Matches board, bet slip, play-money store, auto-settlement, custom props, scores/odds providers, dashboard, leaderboard.

---

## P1 — Next up

| Feature | Status | Effort | Notes |
|---------|--------|--------|-------|
| Production deploy to Vercel | ⬜ | S | Run `npx vercel --prod` or connect GitHub |

## P2 — Later

| Feature | Status | Effort | Notes |
|---------|--------|--------|-------|
| Accounts + cloud sync | 💡 | L | Auth + backend store |
| Service worker / offline cache | 💡 | M | Extend PWA beyond manifest |
| Additional player-prop grading | 💡 | M | Needs event-level data feed |
| Shareable bet image cards | 💡 | M | OG image / canvas export |

## P3 — Someday

Daily challenges, dark/light theme, analytics.

---

## Changelog

- **2026-06-21** — v0.3.0: Real score grading for provider legs, Win To Nil + Exact Goals markets, share bet, PWA manifest, 39 tests.
- **2026-06-21** — v0.2: CI/E2E, toasts, mobile/a11y polish, `vercel.json`.
- **2026-06-20** — v0.1 baseline.

# PitchProps — Product Roadmap

**Last updated:** 2026-06-22
**Current version:** v0.4.0 · Live at [pitchprops.vercel.app](https://pitchprops.vercel.app)

---

## v0.4 — Shipped

| Feature | Evidence |
|---------|----------|
| Service worker + offline shell | `public/sw.js`, `ServiceWorkerRegister.tsx`, `/offline` |
| Shareable bet image cards | `src/app/api/share/bet/route.tsx`, `ShareBetButton.tsx` |
| Player/bookings grading from event stats | `src/lib/mock-events.ts`, `grade-provider.ts`, `MatchEvents` |
| Dark / light theme toggle | `ThemeToggle.tsx`, `globals.css` |
| E2E score-graded settlement | `e2e/score-graded.spec.ts` |

## v0.3 — Shipped

Provider score grading, share text, PWA manifest, CI/E2E, production deploy.

## v0.1–v0.2 — Shipped

Core app, quality gate, toasts, mobile/a11y.

---

## P1 — Next up

| Feature | Status | Notes |
|---------|--------|-------|
| GitHub remote + Vercel Git auto-deploy | ⬜ | Push repo; connect in Vercel dashboard |
| `ODDS_API_KEY` in Vercel env | ⬜ | User secret — add in dashboard |

## P2 — Later

| Feature | Notes |
|---------|-------|
| Accounts + cloud sync | Auth + backend |
| OG meta for shared bet URLs | Deep links to bet state |
| Live player events from real API | Replace mock `MatchEvents` |

## P3 — Someday

Daily challenges, analytics.

---

## Changelog

- **2026-06-22** — v0.4.0: Offline SW, share image cards, event-based player grading, theme toggle, score-graded E2E.
- **2026-06-21** — v0.3.0: Score grading, share text, PWA, CI, production deploy.
- **2026-06-20** — v0.1 baseline.

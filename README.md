# PitchProps ⚽ — Proprietary Soccer Prop Bets

A play-money soccer **prop betting** platform with live odds, single & parlay bet slips, and a rich, "fun & unique" performance-tracking layer (ROI, win streaks, profit curve, achievements, and a daily leaderboard).

> Entertainment only. **No real money** is wagered or paid out. The in-app currency is "PC" (PitchCoins).

## Features

- **Markets & props** — Match Result (1X2), Total Goals, Both Teams To Score, Anytime Goalscorer, Player Shots On Target, Corners, and Bookings.
- **Bet slip** — Add selections from anywhere, build singles or parlays (auto-combines odds), set a stake, and rate your **confidence** (1–5 ★).
- **Auto-settlement** — Bets settle automatically after their (simulated) match window, weighted by each leg's implied probability. This drives the tracking loop without needing a live results feed.
- **Performance dashboard** (`/bets`) — Balance, lifetime profit, ROI, win rate, current/best streak, biggest win, average odds, open exposure, an SVG **profit curve**, and **achievements**.
- **Leaderboard** (`/leaderboard`) — You vs. a roster of "house regular" bots; ranked by profit and refreshed daily.
- **Pluggable data** — Live odds via [The Odds API](https://the-odds-api.com), behind an adapter, with a realistic **mock fallback** so the app runs with zero configuration.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS** for styling
- **Zustand** (with `persist`) for the play-money store (balance, slip, bets) — saved to `localStorage`
- Server-side **API proxy** (`/api/matches`) keeps your odds API key secret

## Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

The app works immediately with realistic **demo data**. To pull live fixtures and odds:

1. Copy `.env.example` to `.env.local`.
2. Add your key:

```bash
ODDS_API_KEY=your_key_here
ODDS_LEAGUES=soccer_epl,soccer_uefa_champs_league,soccer_spain_la_liga
ODDS_REGION=eu
```

3. Restart the dev server. The home page badge will switch from **Demo odds** to **Live odds**.

> Player props (scorers, shots on target) require a plan/region on The Odds API that exposes those markets. If they're unavailable, core markets still load and props are simply omitted for that match.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint with ESLint (flat config) |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Build + Playwright E2E happy path |

## Deploy

The app is configured for [Vercel](https://vercel.com) (`vercel.json`). Connect the GitHub repo for automatic deploys on push, or run:

```bash
npx vercel --prod
```

## Project structure

```
src/
  app/
    api/matches/route.ts   # server proxy: live odds or mock fallback
    page.tsx               # matches board + league filter
    match/[id]/page.tsx    # all prop markets for a match
    bets/page.tsx          # performance dashboard
    leaderboard/page.tsx   # user vs. bots
  components/               # NavBar, BetSlip, OddsButton, MatchCard, ProfitChart, ...
  lib/
    providers/             # theoddsapi.ts, mock.ts, index.ts (adapter)
    store.ts               # Zustand play-money store + settlement
    stats.ts               # ROI, streaks, profit curve, achievements
    leaderboard.ts         # simulated bettors
    types.ts               # domain types
```

## Swapping in a different data provider

Implement a function returning `Match[]` (see `src/lib/types.ts`) and wire it in `src/lib/providers/index.ts`. The rest of the app is provider-agnostic.

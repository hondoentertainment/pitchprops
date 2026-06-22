"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BetLeg,
  CustomMarketResult,
  CustomMatchInfo,
  LegStatus,
  Market,
  PlacedBet,
  ToastNotice,
} from "@/lib/types";
import { combineOdds, impliedProbability, STARTING_BALANCE } from "@/lib/format";
import { settleBet, settlementMessage, type SettleContext } from "@/lib/settle";
import type { MatchScore } from "@/lib/types";
import type { TeamNames } from "@/lib/grade-provider";

interface PlaceOptions {
  stake: number;
  confidence: number;
  tag?: string;
}

interface StoreState {
  balance: number;
  slip: BetLeg[];
  bets: PlacedBet[];
  /** User-created markets keyed by match id, merged into fetched matches. */
  customMarkets: Record<string, Market[]>;
  /** Fixture info for matches that have custom props, keyed by match id. */
  customMatchMeta: Record<string, CustomMatchInfo>;
  /** Recorded outcomes for custom markets, keyed by market id. */
  customMarketResults: Record<string, CustomMarketResult>;
  /** When true, score-derivable custom props auto-grade from the final score. */
  autoSettleProps: boolean;
  /** Transient toast queue (not persisted). */
  notifications: ToastNotice[];
  hydrated: boolean;
  slipOpen: boolean;

  setSlipOpen: (open: boolean) => void;
  setAutoSettleProps: (on: boolean) => void;
  pushNotice: (notice: Omit<ToastNotice, "id">) => void;
  dismissNotice: (id: string) => void;
  addLeg: (leg: BetLeg) => void;
  removeLeg: (selectionId: string) => void;
  clearSlip: () => void;
  isInSlip: (selectionId: string) => boolean;

  addCustomMarket: (match: CustomMatchInfo, market: Market) => { ok: boolean; error?: string };
  removeCustomMarket: (matchId: string, marketId: string) => void;
  setCustomMarketResult: (result: CustomMarketResult) => void;
  clearCustomMarketResult: (marketId: string) => void;

  placeBet: (opts: PlaceOptions) => { ok: boolean; error?: string };
  settleDueBets: (ctx?: Pick<SettleContext, "scores" | "teams">) => number;
  resetBankroll: () => void;
  setHydrated: () => void;
}

function legResolveTime(legs: BetLeg[]): string {
  // A bet resolves shortly after the latest kickoff among its legs.
  const latest = legs.reduce((max, l) => Math.max(max, +new Date(l.commenceTime)), 0);
  // simulate a ~2 hour match for demo settlement
  return new Date(latest + 2 * 60 * 60 * 1000).toISOString();
}

function simulateLeg(price: number): LegStatus {
  const p = impliedProbability(price);
  return Math.random() < p ? "won" : "lost";
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      balance: STARTING_BALANCE,
      slip: [],
      bets: [],
      customMarkets: {},
      customMatchMeta: {},
      customMarketResults: {},
      autoSettleProps: false,
      notifications: [],
      hydrated: false,
      slipOpen: false,

      setSlipOpen: (open) => set({ slipOpen: open }),

      setAutoSettleProps: (on) => set({ autoSettleProps: on }),

      pushNotice: (notice) =>
        set((s) => ({
          notifications: [
            ...s.notifications,
            { ...notice, id: `n_${Date.now()}_${Math.floor(Math.random() * 1e4)}` },
          ],
        })),

      dismissNotice: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      addLeg: (leg) => {
        const { slip } = get();
        if (slip.some((l) => l.selectionId === leg.selectionId)) return;
        // Prevent two legs from the same market (conflicting picks) in a parlay.
        const filtered = slip.filter(
          (l) => !(l.matchId === leg.matchId && l.marketId === leg.marketId)
        );
        set({ slip: [...filtered, leg], slipOpen: true });
      },

      removeLeg: (selectionId) =>
        set((s) => ({ slip: s.slip.filter((l) => l.selectionId !== selectionId) })),

      clearSlip: () => set({ slip: [] }),

      isInSlip: (selectionId) => get().slip.some((l) => l.selectionId === selectionId),

      addCustomMarket: (match, market) => {
        if (!match?.id) return { ok: false, error: "Pick a match for this prop." };
        if (!market.title.trim()) return { ok: false, error: "Give the prop a title." };
        if (market.selections.length === 0) {
          return { ok: false, error: "Add at least one selection." };
        }
        set((s) => ({
          customMarkets: {
            ...s.customMarkets,
            [match.id]: [...(s.customMarkets[match.id] ?? []), market],
          },
          customMatchMeta: {
            ...s.customMatchMeta,
            [match.id]: {
              id: match.id,
              league: match.league,
              leagueKey: match.leagueKey,
              home: match.home,
              away: match.away,
              commenceTime: match.commenceTime,
            },
          },
        }));
        return { ok: true };
      },

      removeCustomMarket: (matchId, marketId) =>
        set((s) => {
          const remaining = (s.customMarkets[matchId] ?? []).filter((m) => m.id !== marketId);
          const next = { ...s.customMarkets };
          const meta = { ...s.customMatchMeta };
          if (remaining.length > 0) {
            next[matchId] = remaining;
          } else {
            delete next[matchId];
            delete meta[matchId];
          }
          const results = { ...s.customMarketResults };
          delete results[marketId];
          return { customMarkets: next, customMatchMeta: meta, customMarketResults: results };
        }),

      setCustomMarketResult: (result) =>
        set((s) => ({
          customMarketResults: { ...s.customMarketResults, [result.marketId]: result },
        })),

      clearCustomMarketResult: (marketId) =>
        set((s) => {
          const results = { ...s.customMarketResults };
          delete results[marketId];
          return { customMarketResults: results };
        }),

      placeBet: ({ stake, confidence, tag }) => {
        const { slip, balance } = get();
        if (slip.length === 0) return { ok: false, error: "Your slip is empty." };
        if (stake <= 0) return { ok: false, error: "Enter a stake greater than 0." };
        if (stake > balance) return { ok: false, error: "Insufficient balance." };

        const odds = combineOdds(slip.map((l) => l.price));
        const type = slip.length > 1 ? "parlay" : "single";
        const bet: PlacedBet = {
          id: `bet_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
          legs: slip.map((l) => ({ ...l, status: "pending" })),
          type,
          stake,
          odds,
          potentialReturn: Math.round(stake * odds * 100) / 100,
          status: "open",
          placedAt: new Date().toISOString(),
          confidence,
          tag,
          resolveAt: legResolveTime(slip),
        };

        set({
          balance: Math.round((balance - stake) * 100) / 100,
          bets: [bet, ...get().bets],
          slip: [],
        });
        return { ok: true };
      },

      settleDueBets: (scoreCtx) => {
        const ctx: SettleContext = {
          results: get().customMarketResults,
          simulateLeg,
          now: Date.now(),
          scores: scoreCtx?.scores,
          teams: scoreCtx?.teams,
        };
        let settledCount = 0;
        let payout = 0;
        const notices: ToastNotice[] = [];

        const bets = get().bets.map((bet) => {
          const outcome = settleBet(bet, ctx);
          if (!outcome) return bet;
          settledCount++;
          payout += outcome.realizedReturn;
          const { message, tone } = settlementMessage(outcome);
          notices.push({
            id: `n_${outcome.bet.id}`,
            message,
            tone,
          });
          return outcome.bet;
        });

        if (settledCount > 0) {
          set({
            bets,
            balance: Math.round((get().balance + payout) * 100) / 100,
            notifications: [...get().notifications, ...notices],
          });
        }
        return settledCount;
      },

      resetBankroll: () => set({ balance: STARTING_BALANCE, bets: [], slip: [] }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "soccer-props-store-v1",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
      partialize: (s) => ({
        balance: s.balance,
        bets: s.bets,
        slip: s.slip,
        customMarkets: s.customMarkets,
        customMatchMeta: s.customMatchMeta,
        customMarketResults: s.customMarketResults,
        autoSettleProps: s.autoSettleProps,
      }),
    }
  )
);

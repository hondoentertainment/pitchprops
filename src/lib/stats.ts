import type { PlacedBet } from "@/lib/types";
import { STARTING_BALANCE } from "@/lib/format";

export interface TrackingStats {
  totalBets: number;
  settledBets: number;
  openBets: number;
  wins: number;
  losses: number;
  winRate: number; // 0-1 over settled
  staked: number;
  returned: number;
  profit: number;
  roi: number; // profit / staked
  currentStreak: number; // + for win streak, - for loss streak
  bestStreak: number;
  biggestWin: number;
  avgOdds: number;
  pendingRisk: number; // stake locked in open bets
  pendingPotential: number;
}

export interface ProfitPoint {
  index: number;
  label: string;
  balance: number;
  profit: number;
}

export function computeStats(bets: PlacedBet[]): TrackingStats {
  const settled = bets.filter((b) => b.status === "won" || b.status === "lost");
  const open = bets.filter((b) => b.status === "open");
  const wins = settled.filter((b) => b.status === "won");
  const losses = settled.filter((b) => b.status === "lost");

  const staked = settled.reduce((s, b) => s + b.stake, 0);
  const returned = wins.reduce((s, b) => s + b.potentialReturn, 0);
  const profit = returned - staked;

  // streaks over chronological settle order (oldest -> newest)
  const chrono = [...settled].sort(
    (a, b) => +new Date(a.settledAt || a.placedAt) - +new Date(b.settledAt || b.placedAt)
  );
  let currentStreak = 0;
  let bestStreak = 0;
  let run = 0;
  for (const b of chrono) {
    if (b.status === "won") {
      run = run >= 0 ? run + 1 : 1;
    } else {
      run = run <= 0 ? run - 1 : -1;
    }
    bestStreak = Math.max(bestStreak, run);
    currentStreak = run;
  }

  const biggestWin = wins.reduce((m, b) => Math.max(m, b.potentialReturn - b.stake), 0);
  const avgOdds = settled.length
    ? settled.reduce((s, b) => s + b.odds, 0) / settled.length
    : 0;

  return {
    totalBets: bets.length,
    settledBets: settled.length,
    openBets: open.length,
    wins: wins.length,
    losses: losses.length,
    winRate: settled.length ? wins.length / settled.length : 0,
    staked,
    returned,
    profit,
    roi: staked ? profit / staked : 0,
    currentStreak,
    bestStreak,
    biggestWin,
    avgOdds,
    pendingRisk: open.reduce((s, b) => s + b.stake, 0),
    pendingPotential: open.reduce((s, b) => s + b.potentialReturn, 0),
  };
}

/** Build a running-balance curve from settled bets (oldest to newest). */
export function profitCurve(bets: PlacedBet[]): ProfitPoint[] {
  const settled = [...bets]
    .filter((b) => b.status === "won" || b.status === "lost")
    .sort((a, b) => +new Date(a.settledAt || a.placedAt) - +new Date(b.settledAt || b.placedAt));

  const points: ProfitPoint[] = [
    { index: 0, label: "Start", balance: STARTING_BALANCE, profit: 0 },
  ];
  let bal = STARTING_BALANCE;
  settled.forEach((b, i) => {
    const delta = b.status === "won" ? b.potentialReturn - b.stake : -b.stake;
    bal = Math.round((bal + delta) * 100) / 100;
    points.push({
      index: i + 1,
      label: `#${i + 1}`,
      balance: bal,
      profit: Math.round((bal - STARTING_BALANCE) * 100) / 100,
    });
  });
  return points;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export function computeAchievements(bets: PlacedBet[], stats: TrackingStats): Achievement[] {
  const wonParlay3 = bets.some((b) => b.status === "won" && b.legs.length >= 3);
  const bigOddsWin = bets.some((b) => b.status === "won" && b.odds >= 5);
  const highRoller = bets.some((b) => b.stake >= 250);
  const comeback = stats.profit > 0 && stats.currentStreak >= 3;

  return [
    {
      id: "first_bet",
      name: "Getting Started",
      description: "Place your first bet",
      icon: "🎯",
      unlocked: stats.totalBets >= 1,
    },
    {
      id: "first_win",
      name: "Winner Winner",
      description: "Win your first bet",
      icon: "✅",
      unlocked: stats.wins >= 1,
    },
    {
      id: "streak3",
      name: "On Fire",
      description: "Win 3 bets in a row",
      icon: "🔥",
      unlocked: stats.bestStreak >= 3,
    },
    {
      id: "parlay3",
      name: "Parlay Architect",
      description: "Win a 3+ leg parlay",
      icon: "🏗️",
      unlocked: wonParlay3,
    },
    {
      id: "longshot",
      name: "Longshot Hero",
      description: "Win a bet at 5.00+ odds",
      icon: "🚀",
      unlocked: bigOddsWin,
    },
    {
      id: "highroller",
      name: "High Roller",
      description: "Place a single bet of 250+",
      icon: "💎",
      unlocked: highRoller,
    },
    {
      id: "profit",
      name: "In The Green",
      description: "Reach positive lifetime profit",
      icon: "📈",
      unlocked: stats.profit > 0,
    },
    {
      id: "comeback",
      name: "Heater",
      description: "Be profitable on a 3+ win streak",
      icon: "⚡",
      unlocked: comeback,
    },
  ];
}

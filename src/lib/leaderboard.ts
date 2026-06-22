import { STARTING_BALANCE } from "@/lib/format";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  balance: number;
  profit: number;
  roi: number;
  bets: number;
  winRate: number;
  isUser: boolean;
}

interface Bot {
  name: string;
  avatar: string;
  skill: number; // -1..1, edge
  volume: number; // base bet count
  variance: number;
}

const BOTS: Bot[] = [
  { name: "xGWizard", avatar: "🧙", skill: 0.62, volume: 140, variance: 0.9 },
  { name: "ParlayPablo", avatar: "🎲", skill: -0.35, volume: 220, variance: 1.6 },
  { name: "TheGaffer", avatar: "🧣", skill: 0.41, volume: 95, variance: 0.7 },
  { name: "CornerKingdom", avatar: "🚩", skill: 0.18, volume: 130, variance: 1.0 },
  { name: "OverUnderOwl", avatar: "🦉", skill: 0.33, volume: 110, variance: 0.8 },
  { name: "DerbyDan", avatar: "⚽", skill: -0.12, volume: 160, variance: 1.2 },
  { name: "CleanSheetCleo", avatar: "🧤", skill: 0.27, volume: 85, variance: 0.75 },
  { name: "StoppageTime", avatar: "⏱️", skill: -0.5, volume: 260, variance: 1.9 },
  { name: "HatTrickHank", avatar: "🎩", skill: 0.55, volume: 70, variance: 0.85 },
  { name: "VARVictim", avatar: "📺", skill: -0.28, volume: 190, variance: 1.4 },
];

// Deterministic pseudo-random from a string + day bucket so the board feels
// alive (shifts daily) but is stable within a session.
function seeded(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function botStats(bot: Bot, dayBucket: number) {
  const r1 = seeded(`${bot.name}-${dayBucket}-a`);
  const r2 = seeded(`${bot.name}-${dayBucket}-b`);
  const r3 = seeded(`${bot.name}-${dayBucket}-c`);

  const bets = Math.round(bot.volume * (0.7 + r1 * 0.6));
  const baseWin = 0.5 + bot.skill * 0.12;
  const winRate = Math.min(0.72, Math.max(0.28, baseWin + (r2 - 0.5) * 0.1));
  // average stake ~25, avg odds ~2 => edge accumulates over volume
  const avgStake = 20 + r3 * 30;
  const edge = (winRate * 2 - 1) * bot.skill * 0.4;
  const profit = Math.round(bets * avgStake * edge * (0.6 + bot.variance * 0.3));
  const staked = bets * avgStake;

  return {
    bets,
    winRate,
    profit,
    balance: Math.round(STARTING_BALANCE + profit),
    roi: staked ? profit / staked : 0,
  };
}

export function buildLeaderboard(user: {
  balance: number;
  profit: number;
  bets: number;
  winRate: number;
  staked: number;
}): LeaderboardEntry[] {
  const dayBucket = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

  const entries: Omit<LeaderboardEntry, "rank">[] = BOTS.map((b) => {
    const s = botStats(b, dayBucket);
    return {
      name: b.name,
      avatar: b.avatar,
      balance: s.balance,
      profit: s.profit,
      roi: s.roi,
      bets: s.bets,
      winRate: s.winRate,
      isUser: false,
    };
  });

  entries.push({
    name: "You",
    avatar: "🫵",
    balance: user.balance,
    profit: user.profit,
    roi: user.staked ? user.profit / user.staked : 0,
    bets: user.bets,
    winRate: user.winRate,
    isUser: true,
  });

  return entries
    .sort((a, b) => b.profit - a.profit)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

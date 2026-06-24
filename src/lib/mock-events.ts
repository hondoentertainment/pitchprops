import type { Match, MatchEvents, MatchScore } from "@/lib/types";

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** Deterministic demo event stats derived from match id + final score. */
export function buildMockEvents(match: Match, home: number, away: number): MatchEvents {
  const h = hashStr(`${match.id}:${home}-${away}`);
  const stars = match.markets
    .flatMap((m) => m.selections.map((s) => s.label))
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .slice(0, 8);

  const pool = stars.length > 0 ? stars : [match.home.name, match.away.name];
  const scorers: string[] = [];
  let remaining = home + away;
  let idx = h % pool.length;
  while (remaining > 0 && pool.length > 0) {
    scorers.push(pool[idx % pool.length]);
    remaining--;
    idx += 1 + (h % 3);
  }

  const shotsOnTarget: Record<string, number> = {};
  const assists: Record<string, number> = {};
  const booked: string[] = [];

  pool.forEach((name, i) => {
    const p = hashStr(`${match.id}:${name}`);
    shotsOnTarget[name] = (p % 5) + (scorers.includes(name) ? 1 : 0);
    if (p % 7 === 0) assists[name] = 1;
    if (p % 11 === 0) booked.push(name);
  });

  const firstTeam: "home" | "away" | null =
    home > 0 && away === 0
      ? "home"
      : away > 0 && home === 0
        ? "away"
        : home + away > 0
          ? h % 2 === 0
            ? "home"
            : "away"
          : null;

  return {
    scorers,
    firstScorer: scorers[0] ?? null,
    firstTeam,
    assists,
    shotsOnTarget,
    booked,
    corners: 6 + (h % 12),
    cards: 2 + (h % 6),
  };
}

export function scoreWithEvents(match: Match): MatchScore {
  const h = hashStr(match.id);
  const home = h % 4;
  const away = (h >> 4) % 4;
  return {
    matchId: match.id,
    home,
    away,
    completed: true,
    events: buildMockEvents(match, home, away),
  };
}

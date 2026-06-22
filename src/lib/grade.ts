import type { Market, MatchScore, Selection } from "@/lib/types";

// Best-effort grading of custom props from a final score.
// Only outcomes that are fully derivable from the final score are suggested
// (match result, total goals, both-teams-to-score, correct score). Player /
// card / corner props can't be inferred from the score, so they return null
// and must be graded manually.

interface TeamNames {
  home: { name: string; short: string };
  away: { name: string; short: string };
}

function text(sel: Selection): string {
  return `${sel.label} ${sel.sublabel ?? ""}`.toLowerCase();
}

type Outcome = "home" | "draw" | "away";

function classifyMatchSelection(sel: Selection, teams: TeamNames): Outcome | null {
  const t = text(sel);
  if (/\bdraw\b/.test(t) || t.trim() === "x") return "draw";
  const { home, away } = teams;
  if (t.includes(home.name.toLowerCase()) || t.includes(home.short.toLowerCase()) || /\bhome\b/.test(t)) {
    return "home";
  }
  if (t.includes(away.name.toLowerCase()) || t.includes(away.short.toLowerCase()) || /\baway\b/.test(t)) {
    return "away";
  }
  return null;
}

function parseOverUnder(sel: Selection): { dir: "over" | "under"; line: number } | null {
  const t = text(sel);
  const isOver = t.includes("over");
  const isUnder = t.includes("under");
  if (!isOver && !isUnder) return null;
  const m = t.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const line = parseFloat(m[1]);
  if (!Number.isFinite(line)) return null;
  return { dir: isOver ? "over" : "under", line };
}

function parseYesNo(sel: Selection): "yes" | "no" | null {
  const t = sel.label.trim().toLowerCase();
  if (t === "yes") return "yes";
  if (t === "no") return "no";
  return null;
}

function parseCorrectScore(sel: Selection): { h: number; a: number } | null {
  const m = text(sel).match(/(\d+)\s*[-\u2013:]\s*(\d+)/);
  if (!m) return null;
  return { h: Number(m[1]), a: Number(m[2]) };
}

/**
 * Returns the raw selection ids that won given a final score, or `null` when
 * the market type can't be derived from the score alone.
 */
export function suggestWinners(market: Market, score: MatchScore, teams: TeamNames): string[] | null {
  const total = score.home + score.away;
  const outcome: Outcome =
    score.home > score.away ? "home" : score.away > score.home ? "away" : "draw";

  switch (market.category) {
    case "match": {
      let recognized = false;
      const ids: string[] = [];
      for (const sel of market.selections) {
        const c = classifyMatchSelection(sel, teams);
        if (!c) continue;
        recognized = true;
        if (c === outcome) ids.push(sel.id);
      }
      return recognized ? ids : null;
    }
    case "goals": {
      let recognized = false;
      const ids: string[] = [];
      const bothScored = score.home > 0 && score.away > 0;
      for (const sel of market.selections) {
        const ou = parseOverUnder(sel);
        if (ou) {
          recognized = true;
          if (ou.dir === "over" && total > ou.line) ids.push(sel.id);
          else if (ou.dir === "under" && total < ou.line) ids.push(sel.id);
          continue;
        }
        const yn = parseYesNo(sel);
        if (yn) {
          recognized = true;
          if ((yn === "yes") === bothScored) ids.push(sel.id);
        }
      }
      return recognized ? ids : null;
    }
    case "score": {
      let recognized = false;
      const ids: string[] = [];
      for (const sel of market.selections) {
        const cs = parseCorrectScore(sel);
        if (!cs) continue;
        recognized = true;
        if (cs.h === score.home && cs.a === score.away) ids.push(sel.id);
      }
      return recognized ? ids : null;
    }
    default:
      return null;
  }
}

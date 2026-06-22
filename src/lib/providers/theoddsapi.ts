import type { Market, MarketCategory, Match, MatchScore, Selection } from "@/lib/types";
import { groupForCategory } from "@/lib/types";

// Integration with https://the-odds-api.com (v4).
// Best-effort: pulls core markets in bulk, then enriches with player props per event.
// Any failure for a league/event is swallowed so the app stays functional.

const BASE = "https://api.the-odds-api.com/v4";

interface OAOutcome {
  name: string;
  price: number;
  point?: number;
  description?: string; // player name for player props
}
interface OAMarket {
  key: string;
  outcomes: OAOutcome[];
}
interface OABookmaker {
  key: string;
  title: string;
  markets: OAMarket[];
}
interface OAEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OABookmaker[];
}

const LEAGUE_NAMES: Record<string, string> = {
  soccer_epl: "Premier League",
  soccer_spain_la_liga: "La Liga",
  soccer_italy_serie_a: "Serie A",
  soccer_germany_bundesliga: "Bundesliga",
  soccer_france_ligue_one: "Ligue 1",
  soccer_uefa_champs_league: "Champions League",
  soccer_uefa_europa_league: "Europa League",
  soccer_usa_mls: "MLS",
};

function short(name: string): string {
  const cleaned = name.replace(/[^A-Za-z ]/g, "").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function pickBookmaker(ev: OAEvent): OABookmaker | undefined {
  return ev.bookmakers?.[0];
}

function findMarket(bm: OABookmaker | undefined, key: string): OAMarket | undefined {
  return bm?.markets?.find((m) => m.key === key);
}

function mkt(
  id: string,
  title: string,
  category: MarketCategory,
  selections: Selection[]
): Market {
  return { id, title, category, group: groupForCategory(category), selections };
}

function mapCoreMarkets(ev: OAEvent): Market[] {
  const bm = pickBookmaker(ev);
  const markets: Market[] = [];

  const h2h = findMarket(bm, "h2h");
  if (h2h) {
    const selections: Selection[] = h2h.outcomes.map((o) => {
      let id = "draw";
      let label = o.name;
      let sublabel: string | undefined;
      if (o.name === ev.home_team) {
        id = "home";
        sublabel = "Win";
      } else if (o.name === ev.away_team) {
        id = "away";
        sublabel = "Win";
      } else {
        id = "draw";
        label = "Draw";
      }
      return { id, label, sublabel, price: o.price };
    });
    markets.push(mkt("1x2", "Match Result", "match", selections));
  }

  const spreads = findMarket(bm, "spreads");
  if (spreads && spreads.outcomes.length) {
    markets.push(
      mkt(
        "handicap",
        "Match Handicap",
        "handicap",
        spreads.outcomes.map((o, i) => ({
          id: `hcap_${i}`,
          label: o.name,
          sublabel: o.point != null ? (o.point > 0 ? `+${o.point}` : String(o.point)) : undefined,
          price: o.price,
        }))
      )
    );
  }

  const totals = findMarket(bm, "totals");
  if (totals) {
    markets.push(
      mkt(
        "totals",
        "Total Goals",
        "goals",
        totals.outcomes.map((o, i) => ({
          id: `${o.name.toLowerCase()}_${o.point ?? i}`,
          label: o.name,
          sublabel: o.point != null ? String(o.point) : undefined,
          price: o.price,
        }))
      )
    );
  }

  return markets;
}

/** Markets available via the additional/per-event endpoint that are not player props. */
function mapAdditionalMarkets(ev: OAEvent): Market[] {
  const bm = pickBookmaker(ev);
  const markets: Market[] = [];

  const btts = findMarket(bm, "btts");
  if (btts) {
    markets.push(
      mkt(
        "btts",
        "Both Teams To Score",
        "goals",
        btts.outcomes.map((o) => ({ id: `btts_${o.name.toLowerCase()}`, label: o.name, price: o.price }))
      )
    );
  }

  const dc = findMarket(bm, "double_chance");
  if (dc) {
    markets.push(
      mkt(
        "double_chance",
        "Double Chance",
        "match",
        dc.outcomes.map((o, i) => ({ id: `dc_${i}`, label: o.name, price: o.price }))
      )
    );
  }

  const dnb = findMarket(bm, "draw_no_bet");
  if (dnb) {
    markets.push(
      mkt(
        "dnb",
        "Draw No Bet",
        "match",
        dnb.outcomes.map((o, i) => ({ id: `dnb_${i}`, label: o.name, price: o.price }))
      )
    );
  }

  return markets;
}

interface PlayerMarketDef {
  key: string;
  id: string;
  title: string;
  category: MarketCategory;
  sublabel: (o: OAOutcome) => string;
}

const PLAYER_MARKETS: PlayerMarketDef[] = [
  { key: "player_goal_scorer_anytime", id: "anytime_scorer", title: "Anytime Goalscorer", category: "player_goals", sublabel: () => "Anytime" },
  { key: "player_first_goal_scorer", id: "first_scorer", title: "First Goalscorer", category: "player_goals", sublabel: () => "1st goal" },
  { key: "player_last_goal_scorer", id: "last_scorer", title: "Last Goalscorer", category: "player_goals", sublabel: () => "Last goal" },
  { key: "player_to_score_2_or_more", id: "to_score_2", title: "To Score 2+ Goals", category: "player_goals", sublabel: () => "Brace" },
  { key: "player_shots_on_target", id: "player_sot", title: "Player Shots On Target", category: "player_shots", sublabel: (o) => (o.point != null ? `${o.point}+ SOT` : "SOT") },
  { key: "player_shots", id: "player_shots", title: "Player Total Shots", category: "player_shots", sublabel: (o) => (o.point != null ? `${o.point}+ shots` : "Shots") },
  { key: "player_assists", id: "player_assists", title: "Anytime Assist", category: "player_assists", sublabel: () => "Assist" },
  { key: "player_to_receive_card", id: "player_cards", title: "Player To Be Carded", category: "player_cards", sublabel: () => "Booked" },
];

function mapPlayerProps(ev: OAEvent): Market[] {
  const bm = pickBookmaker(ev);
  const markets: Market[] = [];

  for (const def of PLAYER_MARKETS) {
    const m = findMarket(bm, def.key);
    if (!m || !m.outcomes.length) continue;
    markets.push(
      mkt(
        def.id,
        def.title,
        def.category,
        m.outcomes.slice(0, 14).map((o, i) => ({
          id: `${def.id}_${i}`,
          label: o.description ?? o.name,
          sublabel: def.sublabel(o),
          price: o.price,
        }))
      )
    );
  }

  return markets;
}

async function safeJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getLiveMatches(opts: {
  apiKey: string;
  leagues: string[];
  region: string;
}): Promise<Match[]> {
  const { apiKey, leagues, region } = opts;
  const out: Match[] = [];

  // Featured markets are safe to request in bulk; everything else is fetched
  // per-event below (The Odds API serves "additional" markets per event only).
  const ADDITIONAL_MARKETS = [
    "btts",
    "double_chance",
    "draw_no_bet",
    "player_goal_scorer_anytime",
    "player_first_goal_scorer",
    "player_last_goal_scorer",
    "player_to_score_2_or_more",
    "player_shots_on_target",
    "player_shots",
    "player_assists",
    "player_to_receive_card",
  ].join(",");

  for (const league of leagues) {
    const url =
      `${BASE}/sports/${league}/odds/?apiKey=${apiKey}` +
      `&regions=${region}&markets=h2h,spreads,totals&oddsFormat=decimal`;
    const data = (await safeJson(url)) as OAEvent[] | null;
    if (!Array.isArray(data)) continue;

    for (const ev of data.slice(0, 8)) {
      const markets = mapCoreMarkets(ev);

      // Best-effort additional + player markets (per-event; ok if it fails).
      const propUrl =
        `${BASE}/sports/${league}/events/${ev.id}/odds/?apiKey=${apiKey}` +
        `&regions=${region}&markets=${ADDITIONAL_MARKETS}&oddsFormat=decimal`;
      const propData = (await safeJson(propUrl)) as OAEvent | null;
      if (propData) {
        markets.push(...mapAdditionalMarkets(propData));
        markets.push(...mapPlayerProps(propData));
      }

      if (!markets.length) continue;

      out.push({
        id: ev.id,
        league: LEAGUE_NAMES[league] ?? ev.sport_title ?? league,
        leagueKey: league,
        home: { name: ev.home_team, short: short(ev.home_team) },
        away: { name: ev.away_team, short: short(ev.away_team) },
        commenceTime: ev.commence_time,
        markets,
      });
    }
  }

  return out.sort((a, b) => +new Date(a.commenceTime) - +new Date(b.commenceTime));
}

interface OAScore {
  name: string;
  score: string;
}
interface OAScoreEvent {
  id: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: OAScore[] | null;
}

/** Final scores for recently completed fixtures (used to grade props). */
export async function getLiveScores(opts: {
  apiKey: string;
  leagues: string[];
}): Promise<MatchScore[]> {
  const { apiKey, leagues } = opts;
  const out: MatchScore[] = [];

  for (const league of leagues) {
    const url = `${BASE}/sports/${league}/scores/?apiKey=${apiKey}&daysFrom=3`;
    const data = (await safeJson(url)) as OAScoreEvent[] | null;
    if (!Array.isArray(data)) continue;

    for (const ev of data) {
      if (!ev.scores) continue;
      const homeS = ev.scores.find((s) => s.name === ev.home_team);
      const awayS = ev.scores.find((s) => s.name === ev.away_team);
      const home = Number(homeS?.score);
      const away = Number(awayS?.score);
      if (!Number.isFinite(home) || !Number.isFinite(away)) continue;
      out.push({ matchId: ev.id, home, away, completed: Boolean(ev.completed) });
    }
  }

  return out;
}

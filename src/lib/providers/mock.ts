import type { Market, MarketCategory, Match, MatchScore, Selection } from "@/lib/types";
import { groupForCategory } from "@/lib/types";

// Deterministic-ish mock data so the app is fully functional with no API key.

interface LeagueDef {
  key: string;
  name: string;
  teams: [string, string][]; // [name, short]
  stars: string[]; // notable players for player props
}

const LEAGUES: LeagueDef[] = [
  {
    key: "soccer_epl",
    name: "Premier League",
    teams: [
      ["Manchester City", "MCI"],
      ["Arsenal", "ARS"],
      ["Liverpool", "LIV"],
      ["Chelsea", "CHE"],
      ["Manchester United", "MUN"],
      ["Tottenham Hotspur", "TOT"],
      ["Newcastle United", "NEW"],
      ["Aston Villa", "AVL"],
    ],
    stars: [
      "Erling Haaland",
      "Mohamed Salah",
      "Bukayo Saka",
      "Cole Palmer",
      "Son Heung-min",
      "Bruno Fernandes",
      "Alexander Isak",
      "Ollie Watkins",
    ],
  },
  {
    key: "soccer_spain_la_liga",
    name: "La Liga",
    teams: [
      ["Real Madrid", "RMA"],
      ["Barcelona", "BAR"],
      ["Atletico Madrid", "ATM"],
      ["Athletic Bilbao", "ATH"],
      ["Real Sociedad", "RSO"],
      ["Real Betis", "BET"],
    ],
    stars: [
      "Kylian Mbappe",
      "Vinicius Junior",
      "Robert Lewandowski",
      "Lamine Yamal",
      "Antoine Griezmann",
      "Jude Bellingham",
    ],
  },
  {
    key: "soccer_uefa_champs_league",
    name: "Champions League",
    teams: [
      ["Bayern Munich", "BAY"],
      ["Inter Milan", "INT"],
      ["PSG", "PSG"],
      ["Borussia Dortmund", "BVB"],
      ["Real Madrid", "RMA"],
      ["Manchester City", "MCI"],
    ],
    stars: [
      "Harry Kane",
      "Ousmane Dembele",
      "Lautaro Martinez",
      "Florian Wirtz",
      "Jamal Musiala",
      "Vinicius Junior",
    ],
  },
  {
    key: "soccer_italy_serie_a",
    name: "Serie A",
    teams: [
      ["Inter Milan", "INT"],
      ["Juventus", "JUV"],
      ["AC Milan", "MIL"],
      ["Napoli", "NAP"],
      ["AS Roma", "ROM"],
      ["Atalanta", "ATA"],
    ],
    stars: [
      "Lautaro Martinez",
      "Dusan Vlahovic",
      "Rafael Leao",
      "Romelu Lukaku",
      "Paulo Dybala",
      "Ademola Lookman",
    ],
  },
];

// Simple seeded RNG (mulberry32) for stable-ish prices per run.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function priceFromProb(p: number): number {
  // add ~6% margin and round to 2 decimals
  const fair = 1 / p;
  const withMargin = fair * 0.94;
  return Math.max(1.04, Math.round(withMargin * 100) / 100);
}

function mkt(
  id: string,
  title: string,
  category: MarketCategory,
  selections: Selection[]
): Market {
  return { id, title, category, group: groupForCategory(category), selections };
}

const clamp = (p: number, lo = 0.04, hi = 0.96) => Math.min(hi, Math.max(lo, p));

function buildMarkets(rand: () => number, home: string, away: string, stars: string[]): Market[] {
  const markets: Market[] = [];
  const matchStars = stars.slice(0, 6);

  // ---- Base 1X2 probabilities (reused to derive many markets) ----
  let pHome = 0.3 + rand() * 0.3;
  let pDraw = 0.2 + rand() * 0.12;
  let pAway = Math.max(0.12, 1 - pHome - pDraw);
  const norm = pHome + pDraw + pAway;
  pHome /= norm;
  pDraw /= norm;
  pAway /= norm;

  // ===================== MATCH =====================
  markets.push(
    mkt("1x2", "Match Result", "match", [
      { id: "home", label: home, sublabel: "Win", price: priceFromProb(pHome) },
      { id: "draw", label: "Draw", price: priceFromProb(pDraw) },
      { id: "away", label: away, sublabel: "Win", price: priceFromProb(pAway) },
    ])
  );

  markets.push(
    mkt("double_chance", "Double Chance", "match", [
      { id: "1x", label: `${home} or Draw`, sublabel: "1X", price: priceFromProb(clamp(pHome + pDraw)) },
      { id: "12", label: "Either team", sublabel: "12", price: priceFromProb(clamp(pHome + pAway)) },
      { id: "x2", label: `Draw or ${away}`, sublabel: "X2", price: priceFromProb(clamp(pDraw + pAway)) },
    ])
  );

  markets.push(
    mkt("dnb", "Draw No Bet", "match", [
      { id: "dnb_home", label: home, price: priceFromProb(clamp(pHome / (pHome + pAway))) },
      { id: "dnb_away", label: away, price: priceFromProb(clamp(pAway / (pHome + pAway))) },
    ])
  );

  // 3-way handicap: favourite starts -1
  const favHome = pHome >= pAway;
  const fav = favHome ? home : away;
  const dog = favHome ? away : home;
  markets.push(
    mkt("handicap", "Match Handicap", "handicap", [
      { id: "hcap_fav", label: fav, sublabel: "-1", price: priceFromProb(clamp(0.42 + (favHome ? pHome - pAway : pAway - pHome) * 0.3)) },
      { id: "hcap_draw", label: "Draw", sublabel: "-1", price: priceFromProb(clamp(0.26)) },
      { id: "hcap_dog", label: dog, sublabel: "+1", price: priceFromProb(clamp(0.34)) },
    ])
  );

  // Half-time result (tighter towards draw)
  const htDraw = clamp(pDraw + 0.16);
  const htHome = clamp(pHome * 0.8);
  const htAway = clamp(pAway * 0.8);
  markets.push(
    mkt("ht_result", "Half-Time Result", "halftime", [
      { id: "ht_home", label: home, price: priceFromProb(htHome) },
      { id: "ht_draw", label: "Draw", price: priceFromProb(htDraw) },
      { id: "ht_away", label: away, price: priceFromProb(htAway) },
    ])
  );

  // Half-Time / Full-Time (9 combos)
  const htft: Selection[] = [
    ["H", "H", htHome * pHome * 3.0],
    ["H", "D", htHome * pDraw * 1.2],
    ["H", "A", htHome * pAway * 0.4],
    ["D", "H", htDraw * pHome * 1.6],
    ["D", "D", htDraw * pDraw * 2.2],
    ["D", "A", htDraw * pAway * 1.6],
    ["A", "H", htAway * pHome * 0.4],
    ["A", "D", htAway * pDraw * 1.2],
    ["A", "A", htAway * pAway * 3.0],
  ].map(([h, f, w]) => {
    const code = (x: string) => (x === "H" ? home : x === "A" ? away : "Draw");
    return {
      id: `htft_${h}${f}`,
      label: `${code(h as string)} / ${code(f as string)}`,
      sublabel: `${h}/${f}`,
      price: priceFromProb(clamp((w as number), 0.02, 0.6)),
    };
  });
  markets.push(mkt("ht_ft", "Half-Time / Full-Time", "halftime", htft));

  // ===================== GOALS =====================
  const goalLines = [0.5, 1.5, 2.5, 3.5, 4.5];
  markets.push(
    mkt(
      "totals",
      "Total Goals",
      "goals",
      goalLines.flatMap<Selection>((line) => {
        const pOver = clamp(0.78 - (line - 0.5) * 0.17 + (rand() - 0.5) * 0.06);
        return [
          { id: `over_${line}`, label: "Over", sublabel: String(line), price: priceFromProb(pOver) },
          { id: `under_${line}`, label: "Under", sublabel: String(line), price: priceFromProb(1 - pOver) },
        ];
      })
    )
  );

  const pBtts = clamp(0.45 + rand() * 0.2);
  markets.push(
    mkt("btts", "Both Teams To Score", "goals", [
      { id: "btts_yes", label: "Yes", price: priceFromProb(pBtts) },
      { id: "btts_no", label: "No", price: priceFromProb(1 - pBtts) },
    ])
  );

  markets.push(
    mkt("win_to_nil", "Win To Nil", "goals", [
      { id: "home", label: home, sublabel: "Win to nil", price: priceFromProb(clamp(pHome * 0.45)) },
      { id: "away", label: away, sublabel: "Win to nil", price: priceFromProb(clamp(pAway * 0.45)) },
    ])
  );

  markets.push(
    mkt(
      "exact_goals",
      "Exact Total Goals",
      "goals",
      [0, 1, 2, 3].map((n) => ({
        id: `eg_${n}`,
        label: String(n),
        sublabel: n === 3 ? "3+" : "goals",
        price: priceFromProb(clamp(0.28 - n * 0.05 + rand() * 0.08, 0.06)),
      }))
    )
  );

  const pOddEven = clamp(0.49 + (rand() - 0.5) * 0.06);
  markets.push(
    mkt("odd_even", "Total Goals Odd/Even", "goals", [
      { id: "odd", label: "Odd", price: priceFromProb(pOddEven) },
      { id: "even", label: "Even", price: priceFromProb(1 - pOddEven) },
    ])
  );

  for (const [side, name, base] of [
    ["home", home, 0.55 + pHome * 0.2],
    ["away", away, 0.5 + pAway * 0.2],
  ] as const) {
    markets.push(
      mkt(`team_total_${side}`, `${name} Total Goals`, "goals", [1.5, 2.5].flatMap<Selection>((line) => {
        const pOver = clamp(base - (line - 1.5) * 0.28 + (rand() - 0.5) * 0.05);
        return [
          { id: `tt_${side}_over_${line}`, label: "Over", sublabel: String(line), price: priceFromProb(pOver) },
          { id: `tt_${side}_under_${line}`, label: "Under", sublabel: String(line), price: priceFromProb(1 - pOver) },
        ];
      }))
    );
  }

  // ===================== SPECIALS (score) =====================
  const scores: [number, number, number][] = [
    [1, 0, pHome * 1.4],
    [2, 0, pHome * 0.9],
    [2, 1, pHome * 1.0],
    [3, 1, pHome * 0.5],
    [0, 0, pDraw * 1.4],
    [1, 1, pDraw * 1.6],
    [2, 2, pDraw * 0.6],
    [0, 1, pAway * 1.4],
    [0, 2, pAway * 0.9],
    [1, 2, pAway * 1.0],
  ];
  markets.push(
    mkt(
      "correct_score",
      "Correct Score",
      "score",
      scores.map(([h, a, w]) => ({
        id: `cs_${h}_${a}`,
        label: `${h}\u2013${a}`,
        sublabel: h > a ? home : a > h ? away : "Draw",
        price: priceFromProb(clamp(w, 0.02, 0.4)),
      }))
    )
  );

  markets.push(
    mkt("winning_margin", "Winning Margin", "score", [
      { id: "wm_home1", label: `${home} by 1`, price: priceFromProb(clamp(pHome * 0.55)) },
      { id: "wm_home2", label: `${home} by 2+`, price: priceFromProb(clamp(pHome * 0.55)) },
      { id: "wm_draw", label: "Draw", price: priceFromProb(clamp(pDraw)) },
      { id: "wm_away1", label: `${away} by 1`, price: priceFromProb(clamp(pAway * 0.55)) },
      { id: "wm_away2", label: `${away} by 2+`, price: priceFromProb(clamp(pAway * 0.55)) },
    ])
  );

  const pFirstHome = clamp(pHome + pDraw * 0.4);
  markets.push(
    mkt("first_to_score", "First Team To Score", "score", [
      { id: "fts_home", label: home, price: priceFromProb(pFirstHome * 0.9) },
      { id: "fts_away", label: away, price: priceFromProb((1 - pFirstHome) * 0.9) },
      { id: "fts_none", label: "No goals", price: priceFromProb(clamp(0.08)) },
    ])
  );

  for (const [side, name, p] of [
    ["home", home, clamp(1 - pBtts + 0.05)],
    ["away", away, clamp(1 - pBtts)],
  ] as const) {
    markets.push(
      mkt(`clean_sheet_${side}`, `${name} Clean Sheet`, "score", [
        { id: `cs_${side}_yes`, label: "Yes", price: priceFromProb(p * 0.7) },
        { id: `cs_${side}_no`, label: "No", price: priceFromProb(1 - p * 0.7) },
      ])
    );
  }

  // ===================== PLAYERS =====================
  markets.push(
    mkt(
      "anytime_scorer",
      "Anytime Goalscorer",
      "player_goals",
      matchStars.map((name, i) => ({
        id: `scorer_${i}`,
        label: name,
        sublabel: "Anytime",
        price: priceFromProb(clamp(0.5 - i * 0.06 + (rand() - 0.5) * 0.06, 0.12)),
      }))
    )
  );

  markets.push(
    mkt(
      "first_scorer",
      "First Goalscorer",
      "player_goals",
      matchStars.slice(0, 5).map((name, i) => ({
        id: `first_scorer_${i}`,
        label: name,
        sublabel: "1st goal",
        price: priceFromProb(clamp(0.16 - i * 0.018 + (rand() - 0.5) * 0.02, 0.05)),
      }))
    )
  );

  markets.push(
    mkt(
      "to_score_2",
      "To Score 2+ Goals",
      "player_goals",
      matchStars.slice(0, 4).map((name, i) => ({
        id: `brace_${i}`,
        label: name,
        sublabel: "Brace",
        price: priceFromProb(clamp(0.16 - i * 0.025 + (rand() - 0.5) * 0.02, 0.04)),
      }))
    )
  );

  markets.push(
    mkt(
      "player_sot",
      "Player Shots On Target",
      "player_shots",
      matchStars.slice(0, 4).flatMap<Selection>((name, i) => {
        const pHalf = clamp(0.62 - i * 0.05 + (rand() - 0.5) * 0.05, 0.28);
        const pTwo = clamp(0.4 - i * 0.05 + (rand() - 0.5) * 0.05, 0.16);
        return [
          { id: `sot1_${i}`, label: name, sublabel: "1+ SOT", price: priceFromProb(pHalf) },
          { id: `sot2_${i}`, label: name, sublabel: "2+ SOT", price: priceFromProb(pTwo) },
        ];
      })
    )
  );

  markets.push(
    mkt(
      "player_shots",
      "Player Total Shots",
      "player_shots",
      matchStars.slice(0, 4).flatMap<Selection>((name, i) => {
        const pOne = clamp(0.74 - i * 0.05 + (rand() - 0.5) * 0.05, 0.4);
        const pThree = clamp(0.45 - i * 0.05 + (rand() - 0.5) * 0.05, 0.2);
        return [
          { id: `shots1_${i}`, label: name, sublabel: "1+ shots", price: priceFromProb(pOne) },
          { id: `shots3_${i}`, label: name, sublabel: "3+ shots", price: priceFromProb(pThree) },
        ];
      })
    )
  );

  markets.push(
    mkt(
      "player_assists",
      "Anytime Assist",
      "player_assists",
      matchStars.slice(0, 5).map((name, i) => ({
        id: `assist_${i}`,
        label: name,
        sublabel: "Assist",
        price: priceFromProb(clamp(0.32 - i * 0.04 + (rand() - 0.5) * 0.04, 0.1)),
      }))
    )
  );

  markets.push(
    mkt(
      "player_cards",
      "Player To Be Carded",
      "player_cards",
      matchStars.slice(0, 5).map((name, i) => ({
        id: `card_${i}`,
        label: name,
        sublabel: "Booked",
        price: priceFromProb(clamp(0.24 + i * 0.02 + (rand() - 0.5) * 0.04, 0.1)),
      }))
    )
  );

  // ===================== CARDS & CORNERS =====================
  const cornerLine = 9.5 + Math.round(rand() * 2);
  const pCornerOver = clamp(0.5 + (rand() - 0.5) * 0.16);
  markets.push(
    mkt("corners", "Total Corners", "corners", [
      { id: "corners_over", label: "Over", sublabel: String(cornerLine), price: priceFromProb(pCornerOver) },
      { id: "corners_under", label: "Under", sublabel: String(cornerLine), price: priceFromProb(1 - pCornerOver) },
    ])
  );

  const cardLine = 3.5 + Math.round(rand());
  const pCardOver = clamp(0.5 + (rand() - 0.5) * 0.18);
  markets.push(
    mkt("cards", "Total Bookings", "cards", [
      { id: "cards_over", label: "Over", sublabel: String(cardLine), price: priceFromProb(pCardOver) },
      { id: "cards_under", label: "Under", sublabel: String(cardLine), price: priceFromProb(1 - pCardOver) },
    ])
  );

  return markets;
}

export function getMockMatches(): Match[] {
  const matches: Match[] = [];
  const now = Date.now();
  let counter = 0;

  for (const league of LEAGUES) {
    // create 3 fixtures per league
    for (let g = 0; g < 3; g++) {
      const i = (g * 2) % league.teams.length;
      const home = league.teams[i];
      const away = league.teams[(i + 1) % league.teams.length];
      const rand = rng(1000 + counter * 97 + league.key.length);
      // staggered kickoff times over the next 5 days
      const commence = new Date(now + (counter * 7 + 3) * 60 * 60 * 1000).toISOString();
      matches.push({
        id: `mock_${league.key}_${g}`,
        league: league.name,
        leagueKey: league.key,
        home: { name: home[0], short: home[1] },
        away: { name: away[0], short: away[1] },
        commenceTime: commence,
        markets: buildMarkets(rand, home[0], away[0], league.stars),
      });
      counter++;
    }
  }

  return matches.sort((a, b) => +new Date(a.commenceTime) - +new Date(b.commenceTime));
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic demo final scores so the auto-suggest grading flow is fully
 * functional without an API key. Marked completed so suggestions are available.
 */
export function getMockScores(): MatchScore[] {
  return getMockMatches().map((m) => {
    const h = hashStr(m.id);
    return {
      matchId: m.id,
      home: h % 4,
      away: (h >> 4) % 4,
      completed: true,
    };
  });
}

// Shared domain types for the soccer props platform.

export type MarketCategory =
  | "match"
  | "handicap"
  | "halftime"
  | "goals"
  | "score"
  | "player_goals"
  | "player_shots"
  | "player_assists"
  | "player_cards"
  | "cards"
  | "corners";

/** High-level grouping used to organise the match page into tabs. */
export type MarketGroup = "match" | "goals" | "players" | "bookings" | "specials";

export const PLAYER_CATEGORIES: MarketCategory[] = [
  "player_goals",
  "player_shots",
  "player_assists",
  "player_cards",
];

/** All categories in display order — used to populate the create-prop form. */
export const MARKET_CATEGORIES: MarketCategory[] = [
  "match",
  "handicap",
  "halftime",
  "goals",
  "score",
  "player_goals",
  "player_shots",
  "player_assists",
  "player_cards",
  "cards",
  "corners",
];

/** Friendly labels for each category, used in pickers. */
export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  match: "Match result",
  handicap: "Handicap",
  halftime: "Half time",
  goals: "Goals",
  score: "Correct score",
  player_goals: "Player goals",
  player_shots: "Player shots",
  player_assists: "Player assists",
  player_cards: "Player cards",
  cards: "Cards",
  corners: "Corners",
};

/** Prefix marking a market as user-created (vs. provider-generated). */
export const CUSTOM_MARKET_PREFIX = "custom_";

export function isCustomMarket(marketId: string): boolean {
  return marketId.startsWith(CUSTOM_MARKET_PREFIX);
}

export function isPlayerCategory(c: MarketCategory): boolean {
  return PLAYER_CATEGORIES.includes(c);
}

/** Map a market category to its high-level tab group. */
export function groupForCategory(c: MarketCategory): MarketGroup {
  if (isPlayerCategory(c)) return "players";
  switch (c) {
    case "match":
    case "handicap":
    case "halftime":
      return "match";
    case "goals":
      return "goals";
    case "score":
      return "specials";
    case "cards":
    case "corners":
      return "bookings";
    default:
      return "specials";
  }
}

export const GROUP_LABELS: Record<MarketGroup, string> = {
  match: "Match",
  goals: "Goals",
  players: "Players",
  bookings: "Cards & Corners",
  specials: "Specials",
};

export const GROUP_ORDER: MarketGroup[] = ["match", "goals", "players", "bookings", "specials"];

export interface Selection {
  /** Stable id unique within its market. */
  id: string;
  /** Display label, e.g. "Over 2.5", "Erling Haaland", "Home". */
  label: string;
  /** Optional secondary label, e.g. line "2.5" or "Anytime Scorer". */
  sublabel?: string;
  /** Decimal odds, e.g. 1.91. */
  price: number;
}

export interface Market {
  id: string;
  /** Human title, e.g. "Total Goals", "Anytime Goalscorer". */
  title: string;
  category: MarketCategory;
  group: MarketGroup;
  selections: Selection[];
}

export interface MatchTeam {
  name: string;
  short: string;
}

export interface Match {
  id: string;
  league: string;
  leagueKey: string;
  home: MatchTeam;
  away: MatchTeam;
  /** ISO start time. */
  commenceTime: string;
  markets: Market[];
}

/** A single leg the user has added to their slip / bet. */
export interface BetLeg {
  matchId: string;
  matchLabel: string;
  league: string;
  commenceTime: string;
  marketId: string;
  marketTitle: string;
  selectionId: string;
  selectionLabel: string;
  price: number;
}

export type BetStatus = "open" | "won" | "lost" | "void";
export type LegStatus = "pending" | "won" | "lost" | "void";

/** A transient in-app toast (e.g. when a bet settles). Not persisted. */
export interface ToastNotice {
  id: string;
  message: string;
  tone: "win" | "loss" | "info";
}

/** Final score for a fixture, used to grade/settle props from real game data. */
export interface MatchScore {
  matchId: string;
  home: number;
  away: number;
  /** Whether the game has finished (only completed games can grade props). */
  completed: boolean;
}

/** Lightweight fixture info stored alongside a custom prop so it can be
 *  labelled and settled even if the match leaves the live feed. */
export type CustomMatchInfo = Pick<
  Match,
  "id" | "league" | "leagueKey" | "home" | "away" | "commenceTime"
>;

/** A recorded outcome for a user-created (custom) market. */
export interface CustomMarketResult {
  marketId: string;
  matchId: string;
  /** "graded" = winners are listed; "void" = whole market is a push/refund. */
  status: "graded" | "void";
  /** Composite selection keys (`matchId::marketId::selId`) that won. */
  winningSelectionIds: string[];
  recordedAt: string;
  /** Whether the result was entered by hand or accepted from a score suggestion. */
  source: "manual" | "auto";
}

export interface PlacedBet {
  id: string;
  legs: (BetLeg & { status: LegStatus })[];
  /** "single" | "parlay" */
  type: "single" | "parlay";
  stake: number;
  /** Combined decimal odds. */
  odds: number;
  potentialReturn: number;
  status: BetStatus;
  placedAt: string;
  settledAt?: string;
  /** User confidence 1-5, part of the "fun tracking". */
  confidence: number;
  /** Optional note tag. */
  tag?: string;
  /** Earliest leg start time, used to know when it can settle. */
  resolveAt: string;
}

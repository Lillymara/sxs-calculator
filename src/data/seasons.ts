// Season rules, upgrade-cost formulas and Realm constants.
// Extracted from the Global game client.

export interface SeasonRule {
  season: number;
  /** Season rank name in the client (Silver, Gold, ...). */
  rank: string;
  /** Zero-score baseline level; the first scored level is floor + 1. */
  floor: number;
  /** Relic scoring starts above this + level. */
  relicFloor: number;
  /** Relic level the Sand cost formula counts from. */
  relicBase: number;
  /** Primostars awarded for the season regardless of score. */
  fixedStars: number;
  /** Progression points per Primostar. */
  pointsPerStar: number;
  weights: { character: number; gear: number; skill: number; fantomon: number; relic: number };
  /** Upgrade-cost formulas; undefined where the client has no data yet. */
  costs?: {
    gearBase: number;
    gearRate: number;
    /** Forging stones needed every 5th gear level. */
    forgeStone: number;
    skillBase: number;
    skillRate: number;
    relicBaseCost: number;
    relicRate: number;
    relicTier: "blue" | "purple";
  };
  /** Realm material multiplier for rank I, II, III. */
  realmMultipliers?: [number, number, number];
  realmRankName: string;
  /** Minimum score for D, C, B, A, S, SS, SSS. */
  ratingThresholds?: number[];
}

export const RATING_NAMES = ["D", "C", "B", "A", "S", "SS", "SSS"] as const;

export const SEASON_RULES: SeasonRule[] = [
  {
    season: 1, rank: "Silver", floor: 100, relicFloor: 10, relicBase: 10, fixedStars: 10, pointsPerStar: 100,
    weights: { character: 100, gear: 38, skill: 13, fantomon: 14, relic: 57 },
    costs: { gearBase: 9280, gearRate: 92.8, forgeStone: 450, skillBase: 6025, skillRate: 60.25, relicBaseCost: 3200, relicRate: 320, relicTier: "blue" },
    realmMultipliers: [5.75, 6.65, 7.7], realmRankName: "Expert",
    ratingThresholds: [0, 3900, 6200, 8500, 10800, 11900, 13100],
  },
  {
    season: 2, rank: "Gold", floor: 130, relicFloor: 13, relicBase: 13, fixedStars: 45, pointsPerStar: 27,
    weights: { character: 100, gear: 18, skill: 7, fantomon: 8, relic: 33 },
    costs: { gearBase: 16630, gearRate: 166.3, forgeStone: 510, skillBase: 12025, skillRate: 120.25, relicBaseCost: 1350, relicRate: 135, relicTier: "purple" },
    realmMultipliers: [10, 10.8, 11.8], realmRankName: "Champion",
    ratingThresholds: [0, 4800, 7600, 10400, 13100, 14500, 15900],
  },
  {
    season: 3, rank: "Saint", floor: 160, relicFloor: 17, relicBase: 16, fixedStars: 65, pointsPerStar: 13,
    weights: { character: 100, gear: 14, skill: 5, fantomon: 6, relic: 26 },
    costs: { gearBase: 26000, gearRate: 260, forgeStone: 540, skillBase: 19225, skillRate: 192.25, relicBaseCost: 2300, relicRate: 230, relicTier: "purple" },
    realmMultipliers: [19, 19.5, 20], realmRankName: "Master",
    ratingThresholds: [0, 9300, 14700, 20000, 25400, 28000, 30700],
  },
  {
    season: 4, rank: "Legend", floor: 190, relicFloor: 20, relicBase: 19, fixedStars: 120, pointsPerStar: 7,
    weights: { character: 100, gear: 17, skill: 5, fantomon: 11, relic: 28 },
    costs: { gearBase: 57000, gearRate: 570, forgeStone: 550, skillBase: 38425, skillRate: 384.25, relicBaseCost: 4600, relicRate: 460, relicTier: "purple" },
    realmMultipliers: [40, 42.5, 45], realmRankName: "Legend",
    ratingThresholds: [0, 9500, 14900, 20300, 25800, 28500, 31200],
  },
  {
    season: 5, rank: "Angel", floor: 220, relicFloor: 23, relicBase: 22, fixedStars: 150, pointsPerStar: 4,
    weights: { character: 100, gear: 18, skill: 6, fantomon: 12, relic: 30 },
    costs: { gearBase: 101000, gearRate: 1010, forgeStone: 580, skillBase: 65425, skillRate: 654.25, relicBaseCost: 8000, relicRate: 800, relicTier: "purple" },
    realmMultipliers: [70, 75, 80], realmRankName: "Angel",
    ratingThresholds: [0, 10000, 15700, 21400, 27100, 30000, 32800],
  },
  {
    season: 6, rank: "Godtouched", floor: 250, relicFloor: 26, relicBase: 25, fixedStars: 200, pointsPerStar: 3,
    weights: { character: 100, gear: 13, skill: 4, fantomon: 5, relic: 18 },
    realmRankName: "Godtouched",
  },
];

export function getRule(season: number): SeasonRule | undefined {
  return SEASON_RULES.find((r) => r.season === season);
}

/** Season 2 unlock caps by completed character level (Global client). */
export const S2_PROGRESSION_CAPS = [
  { level: 130, skill: 130, gear: 130, fantomon: 130, relic: 13 },
  { level: 131, skill: 160, gear: 150, fantomon: 160, relic: 16 },
  { level: 140, skill: 170, gear: 170, fantomon: 170, relic: 17 },
  { level: 150, skill: 180, gear: 190, fantomon: 180, relic: 18 },
  { level: 160, skill: 190, gear: 210, fantomon: 190, relic: 19 },
  { level: 170, skill: 200, gear: 230, fantomon: 200, relic: 20 },
  { level: 180, skill: 280, gear: 430, fantomon: 280, relic: 28 },
];

/** Realm hit damage roll: [damage, probability]. */
export const REALM_DAMAGE_PROBABILITIES: [number, number][] = [
  [9, 0.2], [10, 0.4], [11, 0.2], [14, 1 / 15], [15, 1 / 15], [16, 1 / 15],
];

/** Entries each Realm refresh grants, and free entries per type from daily quests. */
export const ENTRIES_PER_REFRESH = 5;
export const DAILY_QUEST_ENTRIES = 5;

/**
 * Dawnium price of each daily Realm refresh purchase, in order.
 * From Avalon's Loong Haven calculator (https://primostar2.vercel.app/).
 */
export const DAWNIUM_REFRESH_COSTS = [60, 60, 100, 100, 150, 150, 200, 200, 250, 300];

import { RATING_NAMES, type SeasonRule } from "../../data/seasons";
import type { Slot } from "./costs";

/** Whole levels above the season baseline. */
export function seasonLevels(level: number, floor: number): number {
  return Math.max(0, Math.floor(level) - floor);
}

/** Character points: whole levels at full weight, partial level rounded down. */
export function characterPoints(seasonLevel: number, weight: number): number {
  const whole = Math.floor(Math.max(0, seasonLevel));
  const fraction = Math.max(0, seasonLevel - whole);
  return whole * weight + Math.floor(fraction * weight + 1e-9);
}

export interface CategoryScore {
  key: "character" | "gear" | "skill" | "fantomon" | "relic";
  label: string;
  seasonLevels: number;
  weight: number;
  points: number;
}

export interface ScoreSummary {
  categories: CategoryScore[];
  total: number;
  starsFromScore: number;
  fixedStars: number;
  earned: number;
  projectedTotal: number;
  goal: number;
  /** Progression score this season needs to hit the goal. */
  scoreNeeded: number;
  /** Projected total minus goal (negative = short). */
  difference: number;
  rating: string | null;
}

const sum = (slots: Slot[], floor: number) => slots.reduce((a, s) => a + seasonLevels(s.planned, floor), 0);

export function scoreSeason(
  rule: SeasonRule,
  p: {
    /** Character level including the fractional progress into the next level. */
    characterLevel: number;
    gear: Slot[];
    skills: Slot[];
    fantomons: Slot[];
    relics: Slot[];
    primostarsNow: number;
    primostarGoal: number;
  },
): ScoreSummary {
  const w = rule.weights;
  const charSL = Math.max(0, p.characterLevel - rule.floor);
  const categories: CategoryScore[] = [
    { key: "character", label: "Character", seasonLevels: charSL, weight: w.character, points: characterPoints(charSL, w.character) },
    { key: "gear", label: "Gear", seasonLevels: sum(p.gear, rule.floor), weight: w.gear, points: 0 },
    { key: "skill", label: "Skills", seasonLevels: sum(p.skills, rule.floor), weight: w.skill, points: 0 },
    { key: "fantomon", label: "Fantomons", seasonLevels: sum(p.fantomons, rule.floor), weight: w.fantomon, points: 0 },
    { key: "relic", label: "Relics", seasonLevels: sum(p.relics, rule.relicFloor), weight: w.relic, points: 0 },
  ];
  for (const c of categories) if (c.key !== "character") c.points = c.seasonLevels * c.weight;

  const total = categories.reduce((a, c) => a + c.points, 0);
  const starsFromScore = Math.floor(total / rule.pointsPerStar + 1e-9);
  const earned = starsFromScore + rule.fixedStars;
  const projectedTotal = p.primostarsNow + earned;
  const neededThisSeason = Math.max(0, p.primostarGoal - p.primostarsNow);
  const scoreNeeded = Math.max(0, neededThisSeason - rule.fixedStars) * rule.pointsPerStar;

  let rating: string | null = null;
  if (rule.ratingThresholds) {
    rule.ratingThresholds.forEach((min, i) => {
      if (total >= min) rating = RATING_NAMES[i];
    });
  }

  return {
    categories,
    total,
    starsFromScore,
    fixedStars: rule.fixedStars,
    earned,
    projectedTotal,
    goal: p.primostarGoal,
    scoreNeeded,
    difference: projectedTotal - p.primostarGoal,
    rating,
  };
}

export type SlotCategory = "gear" | "skill" | "fantomon" | "relic";

export interface MinimumPlan {
  planned: number[];
  /** True when the cap stops this category short of the goal. */
  limited: boolean;
}

/**
 * Lowest plan for one category that reaches the score goal, raising the lowest slot first.
 * Every other category counts at its planned levels.
 */
export function minimumPlan(
  slots: Slot[],
  floor: number,
  weight: number,
  pointsFromOtherCategories: number,
  scoreNeeded: number,
  cap: number | null,
): MinimumPlan {
  const planned = slots.map((g) => Math.max(floor, Math.floor(g.current)));
  const short = scoreNeeded - pointsFromOtherCategories;
  if (short <= 0) return { planned, limited: false };
  if (!(weight > 0)) return { planned, limited: true };
  const needLevels = Math.ceil(short / weight - 1e-10);
  let have = planned.reduce((a, v) => a + seasonLevels(v, floor), 0);
  while (have < needLevels) {
    let best = -1;
    planned.forEach((v, i) => {
      if ((cap === null || v < cap) && (best < 0 || v < planned[best])) best = i;
    });
    if (best < 0) return { planned, limited: true };
    planned[best]++;
    have++;
  }
  return { planned, limited: false };
}

/** Lowest gear plan that reaches the score goal (see minimumPlan). */
export function minimumGearPlan(
  rule: SeasonRule,
  gear: Slot[],
  pointsFromOtherCategories: number,
  scoreNeeded: number,
  cap: number | null,
): MinimumPlan {
  return minimumPlan(gear, rule.floor, rule.weights.gear, pointsFromOtherCategories, scoreNeeded, cap);
}

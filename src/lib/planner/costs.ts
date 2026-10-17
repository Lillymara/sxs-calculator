// Upgrade-cost formulas from extracted client tables.
import fantomonData from "../../data/fantomon_exp.json";
import { S2_PROGRESSION_CAPS, type SeasonRule } from "../../data/seasons";

const FANTOMON_EXP = fantomonData as Record<string, { start: number; exp: number[] }>;

/** Ore to raise one gear piece to level L (Rola is twice this). null = unknown. */
export function gearStepCost(rule: SeasonRule, L: number): number | null {
  const bless = L - rule.floor;
  if (!rule.costs || bless < 1 || bless > 300) return null;
  const scaled = Math.min(bless, 150);
  return Math.round((rule.costs.gearBase + (scaled - 1) * rule.costs.gearRate) / 5) * 5;
}

/** Essence to raise one skill to level L. */
export function skillStepCost(rule: SeasonRule, L: number): number | null {
  const bless = L - rule.floor;
  const limit = rule.season <= 2 ? 150 : 180;
  if (!rule.costs || bless < 1 || bless > limit) return null;
  return Math.round((rule.costs.skillBase + (bless - 1) * rule.costs.skillRate) / 5) * 5;
}

/** Sand to raise one relic to +L, in that season's tier and as White Sand equivalent. */
export function relicStepCost(rule: SeasonRule, L: number): { blue: number; purple: number; white: number } | null {
  const bless = L - rule.relicBase;
  const limit = rule.season <= 2 ? 15 : 18;
  if (!rule.costs || bless < 1 || bless > limit) return null;
  const amount = rule.costs.relicBaseCost + (bless - 1) * rule.costs.relicRate;
  return rule.costs.relicTier === "blue"
    ? { blue: amount, purple: 0, white: amount * 5 }
    : { blue: 0, purple: amount, white: amount * 25 };
}

/** Feed EXP to raise one Fantomon to level L. */
export function fantomonStepExp(rule: SeasonRule, L: number): number | null {
  const table = FANTOMON_EXP[String(rule.season)];
  if (!table) return null;
  const exp = table.exp[L - table.start];
  return exp > 0 ? exp : null;
}

export interface Slot {
  current: number;
  planned: number;
}

export interface UpgradeCosts {
  ore: number;
  rola: number;
  forgeStones: number;
  essence: number;
  fantomonExp: number;
  blueSand: number;
  purpleSand: number;
  /** White Sand equivalent of all relic upgrades. */
  sand: number;
  /** First level whose cost is not in the data, per category. */
  unknownFrom: { gear?: number; skill?: number; fantomon?: number; relic?: number };
}

/** Sums `fn` over every level step from current (clamped to `base`) to planned. */
function sumSteps<T>(slots: Slot[], base: number, fn: (L: number) => T | null, add: (v: T) => void): number | undefined {
  let unknown: number | undefined;
  for (const { current, planned } of slots) {
    for (let L = Math.max(base, Math.floor(current)) + 1; L <= Math.floor(planned); L++) {
      const v = fn(L);
      if (v === null) {
        unknown = unknown === undefined ? L : Math.min(unknown, L);
        break;
      }
      add(v);
    }
  }
  return unknown;
}

export function upgradeCosts(
  rule: SeasonRule,
  p: { gear: Slot[]; skills: Slot[]; fantomons: Slot[]; relics: Slot[] },
): UpgradeCosts {
  const c: UpgradeCosts = { ore: 0, rola: 0, forgeStones: 0, essence: 0, fantomonExp: 0, blueSand: 0, purpleSand: 0, sand: 0, unknownFrom: {} };
  c.unknownFrom.gear = sumSteps(p.gear, rule.floor, (L) => {
    const ore = gearStepCost(rule, L);
    return ore === null ? null : { ore, L };
  }, ({ ore, L }) => {
    c.ore += ore;
    c.rola += ore * 2;
    if ((L - rule.floor) % 5 === 0) c.forgeStones += rule.costs?.forgeStone ?? 0;
  });
  c.unknownFrom.skill = sumSteps(p.skills, rule.floor, (L) => skillStepCost(rule, L), (v) => (c.essence += v));
  c.unknownFrom.fantomon = sumSteps(p.fantomons, rule.floor, (L) => fantomonStepExp(rule, L), (v) => (c.fantomonExp += v));
  c.unknownFrom.relic = sumSteps(p.relics, rule.relicBase, (L) => relicStepCost(rule, L), (v) => {
    c.blueSand += v.blue;
    c.purpleSand += v.purple;
    c.sand += v.white;
  });
  return c;
}

export interface ProgressionCaps {
  gear: number | null;
  skill: number | null;
  fantomon: number | null;
  relic: number;
  /** Character level of the next cap increase, if known. */
  nextAt: number | null;
}

/** Highest planned levels allowed at a completed character level. */
export function progressionCaps(rule: SeasonRule, characterLevel: number): ProgressionCaps {
  const lv = Math.floor(characterLevel);
  if (rule.season === 2) {
    let row = S2_PROGRESSION_CAPS[0];
    for (const r of S2_PROGRESSION_CAPS) if (lv >= r.level) row = r;
    const next = S2_PROGRESSION_CAPS.find((r) => r.level > lv);
    return { gear: row.gear, skill: row.skill, fantomon: row.fantomon, relic: row.relic, nextAt: next?.level ?? null };
  }
  const relic = lv < 100 ? 10 : Math.max(10, Math.floor(lv / 10) + 1);
  return { gear: null, skill: null, fantomon: null, relic, nextAt: (relic) * 10 };
}

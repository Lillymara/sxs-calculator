import { DAILY_QUEST_ENTRIES, DAWNIUM_REFRESH_COSTS, ENTRIES_PER_REFRESH, getRule, type SeasonRule } from "../../data/seasons";
import { expToNext, getSeason } from "../xp";
import { progressionCaps, upgradeCosts, type ProgressionCaps, type Slot, type UpgradeCosts } from "./costs";
import { realmYieldsPerEntry, type RealmYields } from "./realm";
import { minimumPlan, scoreSeason, type MinimumPlan, type ScoreSummary, type SlotCategory } from "./score";
import { summarizeTime, type TimeInput, type TimeSummary } from "./time";

export type Material = "ore" | "rola" | "essence" | "sand" | "treats";
export type RealmMaterial = Exclude<Material, "treats">;
export const REALM_MATERIALS: RealmMaterial[] = ["ore", "rola", "essence", "sand"];

export interface MaterialIncome {
  have: number;
  cartPerHour: number;
  /** Shop purchases and anything else you get per real day. */
  perDay: number;
}

export interface OverworldInput {
  /** Share of stamina spent on each node type, in percent. */
  split: { rola: number; ore: number; sand: number };
  /** Big nodes harvested per week by type (50 a week across all types). */
  bigNodesPerWeek: { rola: number; ore: number; sand: number };
  /** Material from one stamina on a regular node. Big nodes give 10x for 5 stamina. */
  yieldPerStamina: { rola: number; ore: number; sand: number };
  dungeonOrePerDay: number;
}

export interface PlannerInput extends TimeInput {
  season: number;
  level: number;
  xpIntoLevel: number;
  xpPerHour: number;
  /** Goddess statues: each adds 1% EXP; new ones arrive each daily reset. */
  statues: number;
  statuesPerDay: number;
  primostarsNow: number;
  primostarGoal: number;
  gear: Slot[];
  skills: Slot[];
  fantomons: Slot[];
  relics: Slot[];
  income: Record<Material, MaterialIncome>;
  overworld: OverworldInput;
  /** Realm refreshes bought per day by type (0–10), order Ore-Rola-Essence-Sand. */
  refreshes: Record<RealmMaterial, number>;
  savedEntries: Record<RealmMaterial, number>;
  /** Realm rank tier 1–3. */
  realmTier: number;
  /** Fantomon feed EXP per treat. */
  expPerTreat: number;
}

export interface CharacterProjection {
  ok: boolean;
  /** Level and XP at season end. */
  level: number;
  xp: number;
  need: number;
  /** Level including fractional progress. */
  decimalLevel: number;
  xpGained: number;
  /** EXP held in the bed for next season. */
  xpSaved: number;
  /** Level where the XP table ran out, if it did. */
  stoppedAt?: number;
}

export interface MaterialLine {
  key: Material;
  label: string;
  need: number;
  /** Passive total by season end, before Realms. */
  passive: number;
  fromCart: number;
  fromOverworld: number;
  shortfall: number;
  realmYield: number | null;
  realmEntriesNeeded: number | null;
  entriesAvailable: number | null;
  entriesLeft: number | null;
  /** When passive income alone covers the need (null = not by season end). */
  readyAt: Date | null;
  unknownCost: boolean;
}

export interface PlannerResult {
  rule: SeasonRule;
  time: TimeSummary;
  character: CharacterProjection;
  caps: ProgressionCaps;
  score: ScoreSummary;
  costs: UpgradeCosts;
  materials: MaterialLine[];
  realmYields: RealmYields | null;
  realmEntriesNeeded: number | null;
  dawniumPerDay: number;
  stamina: number;
  /** Per category: the lowest plan that reaches the goal with everything else as planned. */
  minimum: Record<SlotCategory, MinimumPlan>;
}

const LABELS: Record<Material, string> = {
  ore: "Ore",
  rola: "Rola",
  essence: "Essence",
  sand: "Sand (White eq.)",
  treats: "Treats",
};

/** Stamina regenerates 140 a day, plus 50 from the daily quest at each reset. */
const STAMINA_PER_DAY = 140;
const STAMINA_PER_RESET = 50;

/**
 * Character EXP over the season. The rate is constant between resets and steps up
 * at each reset as new statues arrive; boost hours are paid at the post-reset rate.
 */
function projectCharacter(input: PlannerInput, time: TimeSummary): CharacterProjection {
  const table = getSeason(input.season);
  const base = Math.max(0, input.xpPerHour);
  const rateAfter = (resetsPassed: number) =>
    (base * (1 + (input.statues + resetsPassed * input.statuesPerDay) / 100)) / (1 + input.statues / 100);

  // Natural hours count until the save window opens; boosts always count.
  const naturalEnd = time.saveStart ?? input.end;
  const bounds = [input.start, ...time.resets, input.end];
  let gained = 0;
  let saved = 0;
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = bounds[i].getTime(), b = bounds[i + 1].getTime();
    const cut = Math.min(Math.max(naturalEnd.getTime(), a), b);
    const rate = rateAfter(i);
    gained += ((cut - a) / 3_600_000) * rate;
    saved += ((b - cut) / 3_600_000) * rate;
    if (i > 0) gained += input.boostHoursPerReset * rate;
  }

  let level = input.level;
  let xp = Math.max(0, input.xpIntoLevel);
  let remaining = gained;
  const need = (l: number) => (table ? expToNext(table, l) : undefined);
  if (need(level) === undefined) {
    return { ok: false, level, xp, need: 0, decimalLevel: level, xpGained: gained, xpSaved: saved };
  }
  let stoppedAt: number | undefined;
  while (remaining > 0) {
    const req = need(level);
    if (req === undefined) {
      stoppedAt = level;
      break;
    }
    if (remaining < req - xp) {
      xp += remaining;
      remaining = 0;
    } else {
      remaining -= req - xp;
      level++;
      xp = 0;
    }
  }
  const req = need(level) ?? 0;
  return {
    ok: true,
    level,
    xp,
    need: req,
    decimalLevel: level + (req > 0 ? Math.min(1, xp / req) : 0),
    xpGained: gained,
    xpSaved: saved,
    stoppedAt,
  };
}

function overworldGains(o: OverworldInput, stamina: number, weeks: number, resets: number) {
  const gain = (k: "rola" | "ore" | "sand") => {
    const spent = (stamina * Math.max(0, o.split[k])) / 100;
    const big = Math.min(Math.max(0, o.bigNodesPerWeek[k]) * weeks, Math.floor(spent / 5));
    return big * 10 * o.yieldPerStamina[k] + (spent - big * 5) * o.yieldPerStamina[k];
  };
  return {
    rola: gain("rola"),
    ore: gain("ore") + Math.max(0, o.dungeonOrePerDay) * resets,
    sand: gain("sand"),
  };
}

/**
 * First moment passive income reaches `need`, or null if not by season end.
 * Overworld gains are spread evenly over the season as `extraPerHour`.
 */
function readyTime(need: number, inc: MaterialIncome, extraPerHour: number, input: PlannerInput, time: TimeSummary): Date | null {
  if (need <= inc.have) return input.start;
  const perHour = inc.cartPerHour + inc.perDay / 24 + extraPerHour;
  let have = inc.have;
  let t = input.start.getTime();
  for (const reset of [...time.resets, input.end]) {
    const hours = (reset.getTime() - t) / 3_600_000;
    if (perHour > 0 && have + perHour * hours >= need) return new Date(t + ((need - have) / perHour) * 3_600_000);
    have += perHour * hours;
    t = reset.getTime();
    if (reset !== input.end) have += inc.cartPerHour * input.boostHoursPerReset;
    if (have >= need) return reset;
  }
  return null;
}

export function planSeason(input: PlannerInput): PlannerResult | null {
  const rule = getRule(input.season);
  if (!rule) return null;
  const time = summarizeTime(input);
  const character = projectCharacter(input, time);
  const caps = progressionCaps(rule, character.ok ? character.level : input.level);

  const score = scoreSeason(rule, {
    characterLevel: character.ok ? character.decimalLevel : input.level,
    gear: input.gear,
    skills: input.skills,
    fantomons: input.fantomons,
    relics: input.relics,
    primostarsNow: input.primostarsNow,
    primostarGoal: input.primostarGoal,
  });
  const pointsExcept = (key: SlotCategory) => score.categories.filter((c) => c.key !== key).reduce((a, c) => a + c.points, 0);
  const fill = (key: SlotCategory, slots: Slot[], floor: number, cap: number | null) =>
    minimumPlan(slots, floor, rule.weights[key], pointsExcept(key), score.scoreNeeded, cap);
  const minimum: Record<SlotCategory, MinimumPlan> = {
    gear: fill("gear", input.gear, rule.floor, caps.gear),
    skill: fill("skill", input.skills, rule.floor, caps.skill),
    fantomon: fill("fantomon", input.fantomons, rule.floor, caps.fantomon),
    relic: fill("relic", input.relics, rule.relicFloor, caps.relic),
  };

  const costs = upgradeCosts(rule, input);
  const tier = Math.min(3, Math.max(1, Math.floor(input.realmTier) || 3));
  const multiplier = rule.realmMultipliers?.[tier - 1];
  const realmYields = multiplier ? realmYieldsPerEntry(multiplier) : null;

  const resets = time.resets.length;
  const stamina = time.realHours * (STAMINA_PER_DAY / 24) + resets * STAMINA_PER_RESET;
  const overworld = overworldGains(input.overworld, stamina, time.realDays / 7, resets);

  const needs: Record<Material, number> = {
    ore: costs.ore,
    rola: costs.rola,
    essence: costs.essence,
    sand: costs.sand,
    treats: input.expPerTreat > 0 ? Math.ceil(costs.fantomonExp / input.expPerTreat) : 0,
  };
  const unknown: Record<Material, boolean> = {
    ore: costs.unknownFrom.gear !== undefined,
    rola: costs.unknownFrom.gear !== undefined,
    essence: costs.unknownFrom.skill !== undefined,
    sand: costs.unknownFrom.relic !== undefined,
    treats: costs.unknownFrom.fantomon !== undefined,
  };

  let realmEntriesNeeded: number | null = 0;
  const materials: MaterialLine[] = (Object.keys(LABELS) as Material[]).map((key) => {
    const inc = input.income[key];
    const fromCart = Math.max(0, inc.cartPerHour) * time.productionHours;
    const fromOverworld = key === "ore" || key === "rola" || key === "sand" ? overworld[key] : 0;
    const passive = Math.max(0, inc.have) + fromCart + Math.max(0, inc.perDay) * time.realDays + fromOverworld;
    const shortfall = Math.max(0, needs[key] - passive);

    const isRealm = key !== "treats";
    const realmYield = isRealm && realmYields ? realmYields[key] : null;
    const entriesNeeded = !isRealm ? null : shortfall === 0 ? 0 : realmYield ? Math.ceil(shortfall / realmYield) : null;
    const entriesAvailable = isRealm
      ? Math.max(0, input.savedEntries[key]) + resets * (Math.max(0, input.refreshes[key]) * ENTRIES_PER_REFRESH + DAILY_QUEST_ENTRIES)
      : null;
    if (isRealm) {
      realmEntriesNeeded = realmEntriesNeeded === null || entriesNeeded === null ? null : realmEntriesNeeded + entriesNeeded;
    }
    return {
      key,
      label: LABELS[key],
      need: needs[key],
      passive,
      fromCart,
      fromOverworld,
      shortfall,
      realmYield,
      realmEntriesNeeded: entriesNeeded,
      entriesAvailable,
      entriesLeft: entriesAvailable !== null && entriesNeeded !== null ? entriesAvailable - entriesNeeded : null,
      readyAt: unknown[key] ? null : readyTime(needs[key], inc, time.realHours > 0 ? fromOverworld / time.realHours : 0, input, time),
      unknownCost: unknown[key],
    };
  });

  const dawniumPerDay = REALM_MATERIALS.reduce(
    (a, k) => a + DAWNIUM_REFRESH_COSTS.slice(0, Math.min(10, Math.max(0, input.refreshes[k]))).reduce((x, y) => x + y, 0),
    0,
  );

  return { rule, time, character, caps, score, costs, materials, realmYields, realmEntriesNeeded, dawniumPerDay, stamina, minimum };
}

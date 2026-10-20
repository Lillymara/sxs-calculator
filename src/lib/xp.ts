import rawData from "../data/exp_required.json";

/** XP needed to go from each level to the next, for one season. */
export interface SeasonTable {
  season: number;
  /** First level that has an XP requirement. */
  minLevel: number;
  /** Last level that has an XP requirement (you can still level past it once). */
  maxLevel: number;
  /** expToNext[i] is the XP needed to go from level minLevel + i to the next level. */
  expToNext: number[];
}

type RawData = Record<string, { start: number; exp: number[] }>;

export const seasons: SeasonTable[] = Object.entries(rawData as RawData)
  .map(([season, { start, exp }]) => ({
    season: Number(season),
    minLevel: start,
    maxLevel: start + exp.length - 1,
    expToNext: exp,
  }))
  .sort((a, b) => a.season - b.season);

export function getSeason(season: number): SeasonTable | undefined {
  return seasons.find((s) => s.season === season);
}

/** XP needed to go from `level` to `level + 1`, or undefined if not in the table. */
export function expToNext(table: SeasonTable, level: number): number | undefined {
  if (!Number.isInteger(level) || level < table.minLevel || level > table.maxLevel) return undefined;
  return table.expToNext[level - table.minLevel];
}

export interface CalcInput {
  table: SeasonTable;
  level: number;
  /** XP already earned toward the next level. */
  currentXp: number;
  xpPerHour: number;
  /** Optional target level beyond the next one. */
  goalLevel?: number;
}

export interface LevelStep {
  level: number;
  xpRemaining: number;
  hours: number;
  /** Cumulative hours from now until this level is reached. */
  cumulativeHours: number;
}

/** XP saved up past a level cap, which all applies once the next area opens. */
export interface Banked {
  /** The level you're held at now. */
  cappedLevel: number;
  /** All the XP you've banked. */
  xp: number;
  /** The level you'll jump to when the cap lifts. */
  level: number;
  /** True if the banked XP runs past the end of the season's data. */
  pastData: boolean;
}

export interface CalcResult {
  /** Set when you have more XP than your level needs (you're at a level cap). */
  banked?: Banked;
  nextLevel: number;
  xpRequired: number;
  xpRemaining: number;
  progress: number;
  hoursToNext: number;
  goal?: {
    level: number;
    xpRemaining: number;
    hours: number;
    steps: LevelStep[];
  };
}

export type CalcOutcome = { ok: true; result: CalcResult } | { ok: false; error: string };

export function calculate(input: CalcInput): CalcOutcome {
  const { table, level, currentXp, xpPerHour, goalLevel } = input;
  const required = expToNext(table, level);

  if (required === undefined) {
    return {
      ok: false,
      error: `Season ${table.season} has XP data for levels ${table.minLevel}–${table.maxLevel}.`,
    };
  }
  if (!Number.isFinite(currentXp) || currentXp < 0) {
    return { ok: false, error: "Enter your current XP as shown in game, like 4.13k or 1.52B." };
  }
  if (!Number.isFinite(xpPerHour) || xpPerHour <= 0) {
    return { ok: false, error: "Enter your XP per hour, like 150M." };
  }

  // More XP than the level needs means you're held at a level cap. Work out where that
  // XP lands you once the cap lifts, then time everything from there.
  if (currentXp >= required) {
    let lvl = level;
    let xp = currentXp;
    let need: number | undefined = required;
    while (need !== undefined && xp >= need) {
      xp -= need;
      lvl++;
      need = expToNext(table, lvl);
    }
    const banked: Banked = { cappedLevel: level, xp: currentXp, level: lvl, pastData: need === undefined };
    if (need === undefined) {
      return {
        ok: true,
        result: { banked, nextLevel: lvl, xpRequired: 0, xpRemaining: 0, progress: 1, hoursToNext: 0 },
      };
    }
    const after = calculate({ ...input, level: lvl, currentXp: xp, goalLevel: goalLevel !== undefined && goalLevel > lvl + 1 ? goalLevel : undefined });
    return after.ok ? { ok: true, result: { ...after.result, banked } } : after;
  }

  const xpRemaining = required - currentXp;
  const result: CalcResult = {
    nextLevel: level + 1,
    xpRequired: required,
    xpRemaining,
    progress: required === 0 ? 1 : currentXp / required,
    hoursToNext: xpRemaining / xpPerHour,
  };

  if (goalLevel !== undefined && goalLevel > level + 1) {
    if (goalLevel > table.maxLevel + 1) {
      return {
        ok: false,
        error: `The highest level in season ${table.season}'s data is ${table.maxLevel + 1}.`,
      };
    }
    const steps: LevelStep[] = [];
    let total = 0;
    for (let l = level; l < goalLevel; l++) {
      const stepXp = l === level ? xpRemaining : expToNext(table, l)!;
      total += stepXp;
      steps.push({
        level: l + 1,
        xpRemaining: stepXp,
        hours: stepXp / xpPerHour,
        cumulativeHours: total / xpPerHour,
      });
    }
    result.goal = { level: goalLevel, xpRemaining: total, hours: total / xpPerHour, steps };
  }

  return { ok: true, result };
}

const SUFFIXES: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

/**
 * Parses numbers the way players type them: "4.13k", "1.52B", "250,000".
 * Returns NaN for blank or unreadable input.
 */
export function parseAmount(value: string): number {
  const match = value
    .replace(/[,\s_]/g, "")
    .toLowerCase()
    .match(/^(\d*\.?\d+)([kmbt]?)$/);
  if (!match) return NaN;
  const [, digits, suffix] = match;
  return Number(digits) * (suffix ? SUFFIXES[suffix] : 1);
}

/** "3d 4h 12m" style duration. */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours)) return "—";
  if (hours <= 0) return "Ready now";
  const totalMinutes = Math.ceil(hours * 60);
  const days = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days.toLocaleString()}d`);
  if (h) parts.push(`${h}h`);
  if (m || parts.length === 0) parts.push(`${m}m`);
  return parts.join(" ");
}

/** Local wall-clock time `hours` from `now`. */
export function formatEta(hours: number, now: Date = new Date()): string {
  if (!Number.isFinite(hours)) return "—";
  const eta = new Date(now.getTime() + hours * 3_600_000);
  const sameYear = eta.getFullYear() === now.getFullYear();
  return eta.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Compact XP figures: 1.52B, 340.7M, 12.3K. */
export function formatXpShort(xp: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(xp);
}

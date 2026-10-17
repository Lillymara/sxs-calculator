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

export type RateUnit = "minute" | "hour" | "day";

const HOURS_PER_UNIT: Record<RateUnit, number> = { minute: 1 / 60, hour: 1, day: 24 };

export function toXpPerHour(amount: number, unit: RateUnit): number {
  return amount / HOURS_PER_UNIT[unit];
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

export interface CalcResult {
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
    return { ok: false, error: "Current XP must be zero or more." };
  }
  if (currentXp > required) {
    return { ok: false, error: `Level ${level} only needs ${required.toLocaleString()} XP.` };
  }
  if (!Number.isFinite(xpPerHour) || xpPerHour <= 0) {
    return { ok: false, error: "Enter how much XP you earn." };
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

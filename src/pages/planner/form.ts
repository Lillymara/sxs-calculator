import { getRule } from "../../data/seasons";
import type { Slot } from "../../lib/planner/costs";
import { REALM_MATERIALS, type Material, type PlannerInput, type RealmMaterial } from "../../lib/planner/plan";
import { parseAmount } from "../../lib/xp";
import type { Character } from "../../components/CharacterForm";

export interface SlotForm {
  current: string;
  planned: string;
}

type Triple = { rola: string; ore: string; sand: string };

/** Everything the planner asks for beyond the shared character fields; kept as typed text. */
export interface PlannerForm {
  seasonEnd: string;
  resetTime: string;
  boostHours: string;
  saveBed: boolean;
  saveBedHours: string;
  statues: string;
  statuesPerDay: string;
  primostarsNow: string;
  primostarGoal: string;
  gear: SlotForm[];
  skills: SlotForm[];
  fantomons: SlotForm[];
  relics: SlotForm[];
  income: Record<Material, { have: string; cartPerHour: string; perDay: string }>;
  staminaSplit: Triple;
  bigNodes: Triple;
  staminaYield: Triple;
  dungeonOrePerDay: string;
  refreshes: Record<RealmMaterial, string>;
  savedEntries: Record<RealmMaterial, string>;
  realmTier: "auto" | "1" | "2" | "3";
  expPerTreat: string;
}

const blankSlots = (n: number): SlotForm[] => Array.from({ length: n }, () => ({ current: "", planned: "" }));
const blankRealm = (): Record<RealmMaterial, string> => ({ ore: "", rola: "", essence: "", sand: "" });
const blankIncome = () => ({ have: "", cartPerHour: "", perDay: "" });

export const DEFAULT_PLANNER: PlannerForm = {
  seasonEnd: "",
  resetTime: "",
  boostHours: "2",
  saveBed: false,
  saveBedHours: "36",
  statues: "",
  statuesPerDay: "",
  primostarsNow: "",
  primostarGoal: "",
  gear: blankSlots(5),
  skills: blankSlots(8),
  fantomons: blankSlots(4),
  relics: blankSlots(20),
  income: { ore: blankIncome(), rola: blankIncome(), essence: blankIncome(), sand: blankIncome(), treats: blankIncome() },
  staminaSplit: { rola: "", ore: "", sand: "" },
  bigNodes: { rola: "", ore: "", sand: "" },
  staminaYield: { rola: "", ore: "", sand: "" },
  dungeonOrePerDay: "",
  refreshes: blankRealm(),
  savedEntries: blankRealm(),
  realmTier: "auto",
  expPerTreat: "",
};

export const GEAR_NAMES = ["Helmet", "Armor", "Boots", "Main Hand", "Off Hand"];

/** Per-stamina overworld yields known for a season (Season 2 from Avalon's calculator). */
export const STAMINA_YIELD_DEFAULTS: Record<number, { rola: number; ore: number; sand: number }> = {
  2: { rola: 2800, ore: 240, sand: 236 },
};
export const DEFAULT_EXP_PER_TREAT = 50;

/** Blank or unreadable -> fallback; otherwise the parsed number. A leading "+" (as relics show) is fine. */
export const n = (value: string, fallback = 0) => {
  const v = parseAmount(value.trim().replace(/^\+/, ""));
  return Number.isFinite(v) ? v : fallback;
};

/** Default season end when none is set: 14 days out at the reset time. */
export function defaultSeasonEnd(now: Date, resetTime: string): string {
  const d = new Date(now.getTime() + 14 * 86_400_000);
  const [h, m] = resetTime.split(":").map(Number);
  d.setHours(h || 16, m || 0, 0, 0);
  return toLocalInput(d);
}

export function toLocalInput(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toSlots(rows: SlotForm[], floor: number): Slot[] {
  return rows.map((r) => {
    const current = n(r.current, floor);
    return { current, planned: n(r.planned, current) };
  });
}

/** What the planner uses when a time field is left blank. */
export interface TimeDefaults {
  /** Season end from the player's server calendar, if known. */
  seasonEnd: Date | null;
  /** Local "HH:MM" of the daily reset. */
  resetTime: string;
}

export function effectiveSeasonEnd(f: PlannerForm, d: TimeDefaults, now: Date): string {
  return f.seasonEnd || (d.seasonEnd ? toLocalInput(d.seasonEnd) : defaultSeasonEnd(now, f.resetTime || d.resetTime));
}

/** `xpIntoLevel` comes from the character card, which may be in XP or % mode. */
export function toPlannerInput(c: Character, xpIntoLevel: number, f: PlannerForm, d: TimeDefaults, now: Date): PlannerInput | null {
  const season = Number(c.season);
  const rule = getRule(season);
  if (!rule) return null;
  const level = n(c.level, NaN);
  if (!Number.isInteger(level)) return null;
  const end = new Date(effectiveSeasonEnd(f, d, now));
  if (!Number.isFinite(end.getTime())) return null;

  const yields = STAMINA_YIELD_DEFAULTS[season];
  const triple = (t: Triple, def?: { rola: number; ore: number; sand: number }) => ({
    rola: n(t.rola, def?.rola ?? 0),
    ore: n(t.ore, def?.ore ?? 0),
    sand: n(t.sand, def?.sand ?? 0),
  });
  const realm = (r: Record<RealmMaterial, string>) =>
    Object.fromEntries(REALM_MATERIALS.map((k) => [k, n(r[k])])) as Record<RealmMaterial, number>;

  return {
    season,
    start: now,
    end,
    resetTime: f.resetTime || d.resetTime,
    boostHoursPerReset: n(f.boostHours, 2),
    saveBedHours: f.saveBed ? n(f.saveBedHours, 36) : 0,
    level,
    xpIntoLevel,
    xpPerHour: n(c.rate),
    statues: n(f.statues),
    statuesPerDay: n(f.statuesPerDay),
    primostarsNow: n(f.primostarsNow),
    primostarGoal: n(f.primostarGoal),
    gear: toSlots(f.gear, rule.floor),
    skills: toSlots(f.skills, rule.floor),
    fantomons: toSlots(f.fantomons, rule.floor),
    relics: toSlots(f.relics, rule.relicFloor),
    income: Object.fromEntries(
      Object.entries(f.income).map(([k, v]) => [k, { have: n(v.have), cartPerHour: n(v.cartPerHour), perDay: n(v.perDay) }]),
    ) as PlannerInput["income"],
    overworld: {
      split: triple(f.staminaSplit),
      bigNodesPerWeek: triple(f.bigNodes),
      yieldPerStamina: triple(f.staminaYield, yields),
      dungeonOrePerDay: n(f.dungeonOrePerDay),
    },
    refreshes: realm(f.refreshes),
    savedEntries: realm(f.savedEntries),
    realmTier: f.realmTier === "auto" ? 3 : Number(f.realmTier),
    expPerTreat: n(f.expPerTreat, DEFAULT_EXP_PER_TREAT),
  };
}

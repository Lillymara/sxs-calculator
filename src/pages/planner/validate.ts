// Spots planner inputs that can't happen in the game, so the planner can say why
// instead of quietly working out nonsense.
import type { SeasonRule } from "../../data/seasons";
import { parseAmount, type SeasonTable } from "../../lib/xp";
import type { Character } from "../../components/CharacterForm";
import { GEAR_NAMES, type PlannerForm, type SlotForm } from "./form";

export type SlotField = "gear" | "skills" | "fantomons" | "relics";

export interface Problems {
  /** Plain-language reasons, one per kind of mistake. */
  messages: string[];
  /** Inputs to outline, as "index:current" / "index:planned" per section. */
  slots: Record<SlotField, Set<string>>;
}

/** A level as typed: blank, a number (a leading "+" is fine), or junk. */
export function readLevel(value: string): number | null | "junk" {
  const v = value.trim().replace(/^\+/, "");
  if (v === "") return null;
  const x = parseAmount(v);
  return Number.isFinite(x) ? x : "junk";
}

const list = (names: string[]) =>
  names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;

export function findProblems(
  character: Character,
  form: PlannerForm,
  rule: SeasonRule | undefined,
  table: SeasonTable | undefined,
): Problems {
  const messages: string[] = [];
  const slots: Problems["slots"] = { gear: new Set(), skills: new Set(), fantomons: new Set(), relics: new Set() };
  if (!rule) return { messages, slots };
  const season = rule.season;

  // Character
  const level = readLevel(character.level);
  if (level === "junk" || (level !== null && !Number.isInteger(level))) {
    messages.push(`Your character level "${character.level}" isn't a whole number.`);
  } else if (level !== null && table && (level < table.minLevel || level > table.maxLevel)) {
    messages.push(`Level ${level} doesn't exist in Season ${season}. Its levels run from ${table.minLevel} to ${table.maxLevel}.`);
  } else if (level !== null && table) {
    if (character.progressMode === "xp" && character.currentXp.trim() !== "") {
      const xp = parseAmount(character.currentXp);
      // More EXP than the level needs is fine: it's banked behind a level cap.
      if (!Number.isFinite(xp)) messages.push(`Your EXP into the level, "${character.currentXp}", isn't a number.`);
    }
    if (character.progressMode === "percent" && character.percent.trim() !== "") {
      const pct = parseAmount(character.percent.replace(/%$/, ""));
      if (!Number.isFinite(pct) || pct >= 100) messages.push(`Progress has to be under 100%. You entered "${character.percent}".`);
    }
  }
  if (character.rate.trim() !== "" && !Number.isFinite(parseAmount(character.rate)))
    messages.push(`Your XP per hour, "${character.rate}", isn't a number.`);

  // Gear, skills, Fantomons, relics
  // Planning past a level cap is left to the red outline on the slot tables: the cap
  // depends on the projected season-end level, so it isn't impossible in itself.
  const sections: { field: SlotField; plural: string; single: string; names: string[]; start: number; plus: string }[] = [
    { field: "gear", plural: "gear pieces", single: "gear", names: GEAR_NAMES, start: rule.floor, plus: "" },
    { field: "skills", plural: "skills", single: "skill", names: form.skills.map((_, i) => `Skill ${i + 1}`), start: rule.floor, plus: "" },
    { field: "fantomons", plural: "Fantomons", single: "Fantomon", names: form.fantomons.map((_, i) => `Fantomon #${i + 1}`), start: rule.floor, plus: "" },
    { field: "relics", plural: "relics", single: "relic", names: form.relics.map((_, i) => `Relic #${i + 1}`), start: rule.relicBase, plus: "+" },
  ];
  for (const s of sections) {
    const junk: string[] = [], low: string[] = [], down: string[] = [];
    const rows: SlotForm[] = form[s.field];
    rows.forEach((r, i) => {
      const name = s.names[i] ?? `#${i + 1}`;
      const cur = readLevel(r.current);
      const plan = readLevel(r.planned);
      if (cur === "junk") junk.push(name), slots[s.field].add(`${i}:current`);
      if (plan === "junk") junk.push(name), slots[s.field].add(`${i}:planned`);
      if (typeof cur === "number" && cur < s.start) low.push(name), slots[s.field].add(`${i}:current`);
      if (typeof plan === "number" && plan < s.start) low.push(name), slots[s.field].add(`${i}:planned`);
      const from = typeof cur === "number" ? cur : s.start;
      if (typeof plan === "number" && plan >= s.start && plan < from) down.push(name), slots[s.field].add(`${i}:planned`);
    });
    const uniq = (xs: string[]) => [...new Set(xs)];
    if (junk.length) messages.push(`Some ${s.single} levels aren't valid numbers (${list(uniq(junk))}).`);
    if (low.length)
      messages.push(`${upper(s.plural)} can't be below ${s.plus}${s.start} in Season ${season}. That's where they start (${list(uniq(low))}).`);
    if (down.length) messages.push(`Some ${s.plural} are planned lower than they already are (${list(uniq(down))}). Upgrades only go up.`);
  }

  // Everything else that has to be a positive number
  const plain: [string, string][] = [
    ["Primostars you have", form.primostarsNow],
    ["Primostar goal", form.primostarGoal],
    ["Boost hours per reset", form.boostHours],
    ["Hours to save", form.saveBedHours],
    ["Statues", form.statues],
    ["Statues per day", form.statuesPerDay],
  ];
  const bad = plain.filter(([, v]) => v.trim() !== "" && !Number.isFinite(parseAmount(v))).map(([l]) => l);
  if (bad.length) messages.push(`These need to be plain numbers, not negative or text: ${list(bad)}.`);
  if (form.saveBed && parseAmount(form.saveBedHours) > 36) messages.push("The bed only holds 36 hours of EXP, so you can't save more than that.");
  const boost = parseAmount(form.boostHours);
  if (Number.isFinite(boost) && boost > 24) messages.push("A daily reset can't give more than 24 boost hours.");

  return { messages, slots };
}

const upper = (s: string) => s[0].toUpperCase() + s.slice(1);

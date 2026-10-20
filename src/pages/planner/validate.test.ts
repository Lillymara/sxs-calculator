import { describe, expect, it } from "vitest";
import { getRule } from "../../data/seasons";
import { getSeason } from "../../lib/xp";
import type { Character } from "../../components/CharacterForm";
import { DEFAULT_PLANNER, n, type PlannerForm } from "./form";
import { findProblems, readLevel } from "./validate";

const character: Character = { name: "", season: "2", level: "140", progressMode: "xp", currentXp: "0", percent: "", rate: "100K", goalLevel: "" };
const check = (form: Partial<PlannerForm>, c: Partial<Character> = {}) =>
  findProblems({ ...character, ...c }, { ...DEFAULT_PLANNER, ...form }, getRule(2), getSeason(2));
const slots = (count: number, current: string, planned: string) => Array.from({ length: count }, () => ({ current, planned }));

describe("silly goat checks", () => {
  it("is happy with a normal plan, including relics typed as +15", () => {
    const p = check({ gear: slots(5, "135", "140"), relics: slots(20, "+13", "+15") });
    expect(p.messages).toEqual([]);
  });

  it("catches levels below where the season starts", () => {
    const p = check({ gear: slots(5, "50", "60") });
    expect(p.messages).toEqual([expect.stringContaining("Gear pieces can't be below 130 in Season 2")]);
    expect(p.slots.gear.has("0:current")).toBe(true);
    expect(p.slots.gear.has("4:planned")).toBe(true);
  });

  it("catches relics below their starting +", () => {
    const p = check({ relics: slots(20, "5", "8") });
    expect(p.messages[0]).toContain("Relics can't be below +13");
  });

  it("catches downgrades and junk", () => {
    const p = check({ skills: slots(8, "150", "140"), fantomons: slots(4, "abc", "-5") });
    expect(p.messages).toEqual([
      expect.stringContaining("Some skills are planned lower than they already are"),
      expect.stringContaining("Some Fantomon levels aren't valid numbers"),
    ]);
  });

  it("catches impossible character progress", () => {
    expect(check({}, { level: "9999" }).messages[0]).toContain("doesn't exist in Season 2");
    expect(check({}, { currentXp: "999B" }).messages).toEqual([]); // banked behind a level cap
    expect(check({}, { currentXp: "lots" }).messages[0]).toContain("isn't a number");
    expect(check({}, { progressMode: "percent", percent: "120" }).messages[0]).toContain("under 100%");
  });

  it("reads levels the way players type them", () => {
    expect(readLevel("")).toBeNull();
    expect(readLevel("+15")).toBe(15);
    expect(readLevel("x")).toBe("junk");
    expect(n("+15")).toBe(15);
  });
});

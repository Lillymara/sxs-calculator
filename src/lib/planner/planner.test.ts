import { describe, expect, it } from "vitest";
import { getRule } from "../../data/seasons";
import { fantomonStepExp, gearStepCost, progressionCaps, relicStepCost, skillStepCost, upgradeCosts } from "./costs";
import { planSeason, type PlannerInput } from "./plan";
import { realmYieldsPerEntry } from "./realm";
import { characterPoints, minimumGearPlan, minimumPlan, scoreSeason } from "./score";
import { resetsBetween, summarizeTime } from "./time";

const s1 = getRule(1)!;
const s2 = getRule(2)!;
const slots = (n: number, current: number, planned: number) => Array.from({ length: n }, () => ({ current, planned }));

describe("realm yields", () => {
  it("matches Season 2 Champion III reference averages", () => {
    const y = realmYieldsPerEntry(s2.realmMultipliers![2]);
    expect(y.ore).toBeCloseTo(1194.8, 1);
    expect(y.rola).toBeCloseTo(12164.2, 1);
    expect(y.essence).toBeCloseTo(1667.5, 1);
    expect(y.sand).toBeCloseTo(1132.3, 1);
  });
});

describe("upgrade costs", () => {
  it("prices the first scored level of each category", () => {
    expect(gearStepCost(s2, 131)).toBe(16630);
    expect(skillStepCost(s2, 131)).toBe(12025);
    expect(relicStepCost(s2, 14)).toEqual({ blue: 0, purple: 1350, white: 33750 });
    expect(relicStepCost(s1, 11)).toEqual({ blue: 3200, purple: 0, white: 16000 });
    expect(fantomonStepExp(s2, 131)).toBe(57370);
  });

  it("returns null past the known range", () => {
    expect(gearStepCost(s2, 130)).toBeNull();
    expect(skillStepCost(s2, 281)).toBeNull();
  });

  it("charges Rola at twice Ore and a forging stone every 5th gear level", () => {
    const c = upgradeCosts(s2, { gear: [{ current: 130, planned: 135 }], skills: [], fantomons: [], relics: [] });
    expect(c.rola).toBe(c.ore * 2);
    expect(c.forgeStones).toBe(510);
  });

  it("uses the Season 2 unlock table for caps", () => {
    expect(progressionCaps(s2, 155)).toMatchObject({ gear: 190, skill: 180, relic: 18, nextAt: 160 });
    expect(progressionCaps(s1, 125).relic).toBe(13);
  });
});

describe("scoring", () => {
  it("rounds partial character levels down", () => {
    expect(characterPoints(2.567, 100)).toBe(256);
  });

  it("converts score to Primostars with the season's fixed award", () => {
    const s = scoreSeason(s2, {
      characterLevel: 140,
      gear: slots(5, 130, 140),
      skills: [],
      fantomons: [],
      relics: [],
      primostarsNow: 100,
      primostarGoal: 200,
    });
    // 10 char levels * 100 + 50 gear levels * 18 = 1900 -> floor(1900/27) = 70, +45 fixed
    expect(s.total).toBe(1900);
    expect(s.earned).toBe(115);
    expect(s.projectedTotal).toBe(215);
    expect(s.scoreNeeded).toBe((100 - 45) * 27);
  });

  it("fills the lowest gear first to reach a goal", () => {
    const plan = minimumGearPlan(s2, [{ current: 135, planned: 0 }, ...slots(4, 130, 0)], 0, 18 * 10, null);
    expect(plan.planned).toEqual([135, 132, 131, 131, 131]);
  });

  it("fills any category, counting what the others already cover", () => {
    // Relics from +10, weight 33: 100 points short -> 4 levels, spread lowest first.
    const relics = minimumPlan(slots(3, 10, 0), 10, 33, 900, 1000, 20);
    expect(relics).toEqual({ planned: [12, 11, 11], limited: false });
    // Nothing needed when the other categories already reach the goal.
    expect(minimumPlan(slots(2, 130, 0), 130, 7, 500, 400, null).planned).toEqual([130, 130]);
    // A cap that stops it short is reported.
    expect(minimumPlan(slots(2, 130, 0), 130, 7, 0, 7 * 10, 132)).toEqual({ planned: [132, 132], limited: true });
  });
});

describe("time", () => {
  it("counts resets strictly inside the window", () => {
    const start = new Date(2026, 9, 17, 10, 0);
    const end = new Date(2026, 9, 20, 16, 0);
    expect(resetsBetween(start, end, "16:00")).toHaveLength(3);
  });

  it("keeps boosts but drops natural hours in the save window", () => {
    const start = new Date(2026, 9, 17, 0, 0);
    const end = new Date(2026, 9, 27, 0, 0);
    const t = summarizeTime({ start, end, resetTime: "16:00", boostHoursPerReset: 2, saveBedHours: 36 });
    expect(t.realHours).toBe(240);
    expect(t.boostHours).toBe(20);
    expect(t.xpHours).toBe(240 - 36 + 20);
  });
});

describe("planSeason", () => {
  const base: PlannerInput = {
    season: 2,
    start: new Date(2026, 9, 17, 0, 0),
    end: new Date(2026, 9, 27, 0, 0),
    resetTime: "16:00",
    boostHoursPerReset: 2,
    saveBedHours: 0,
    level: 130,
    xpIntoLevel: 0,
    xpPerHour: 1_000_000,
    statues: 0,
    statuesPerDay: 0,
    primostarsNow: 0,
    primostarGoal: 0,
    gear: slots(5, 130, 130),
    skills: slots(8, 130, 130),
    fantomons: slots(4, 130, 130),
    relics: slots(20, 13, 13),
    income: {
      ore: { have: 0, cartPerHour: 0, perDay: 0 },
      rola: { have: 0, cartPerHour: 0, perDay: 0 },
      essence: { have: 0, cartPerHour: 0, perDay: 0 },
      sand: { have: 0, cartPerHour: 0, perDay: 0 },
      treats: { have: 0, cartPerHour: 0, perDay: 0 },
    },
    overworld: {
      split: { rola: 0, ore: 0, sand: 0 },
      bigNodesPerWeek: { rola: 0, ore: 0, sand: 0 },
      yieldPerStamina: { rola: 2800, ore: 240, sand: 236 },
      dungeonOrePerDay: 0,
    },
    refreshes: { ore: 0, rola: 0, essence: 0, sand: 0 },
    savedEntries: { ore: 0, rola: 0, essence: 0, sand: 0 },
    realmTier: 3,
    expPerTreat: 50,
  };

  it("projects EXP over real hours plus reset boosts", () => {
    const r = planSeason(base)!;
    expect(r.character.xpGained).toBeCloseTo(260 * 1_000_000);
    expect(r.character.level).toBeGreaterThan(130);
  });

  it("raises the EXP rate as statues arrive each reset", () => {
    const r = planSeason({ ...base, statues: 100, statuesPerDay: 10 })!;
    expect(r.character.xpGained).toBeGreaterThan(260 * 1_000_000);
  });

  it("counts daily-quest Realm entries and overworld ore", () => {
    const r = planSeason({
      ...base,
      refreshes: { ore: 2, rola: 0, essence: 0, sand: 0 },
      overworld: { ...base.overworld, split: { rola: 0, ore: 100, sand: 0 } },
    })!;
    const ore = r.materials.find((m) => m.key === "ore")!;
    expect(ore.entriesAvailable).toBe(10 * (2 * 5 + 5));
    // 240h * 140/24 + 10 resets * 50 = 1900 stamina -> 1900 * 240 ore
    expect(ore.fromOverworld).toBeCloseTo(1900 * 240);
    expect(r.dawniumPerDay).toBe(120);
  });

  it("works out Realm entries for a shortfall", () => {
    const r = planSeason({ ...base, gear: slots(5, 130, 140) })!;
    const ore = r.materials.find((m) => m.key === "ore")!;
    expect(ore.shortfall).toBe(r.costs.ore);
    expect(ore.realmEntriesNeeded).toBe(Math.ceil(r.costs.ore / r.realmYields!.ore));
  });
});

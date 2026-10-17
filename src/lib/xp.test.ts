import { describe, expect, it } from "vitest";
import { calculate, formatDuration, getSeason, seasons, toXpPerHour, type SeasonTable } from "./xp";

const table: SeasonTable = { season: 9, minLevel: 10, maxLevel: 12, expToNext: [100, 200, 400] };

describe("calculate", () => {
  it("computes time to the next level", () => {
    const out = calculate({ table, level: 10, currentXp: 40, xpPerHour: 30 });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.nextLevel).toBe(11);
    expect(out.result.xpRemaining).toBe(60);
    expect(out.result.hoursToNext).toBe(2);
    expect(out.result.progress).toBeCloseTo(0.4);
  });

  it("sums every level up to the goal and subtracts current progress", () => {
    const out = calculate({ table, level: 10, currentXp: 40, xpPerHour: 100, goalLevel: 13 });
    if (!out.ok) throw new Error(out.error);
    expect(out.result.goal?.xpRemaining).toBe(60 + 200 + 400);
    expect(out.result.goal?.steps.map((s) => s.cumulativeHours)).toEqual([0.6, 2.6, 6.6]);
  });

  it("rejects levels outside the table and goals beyond the cap", () => {
    expect(calculate({ table, level: 9, currentXp: 0, xpPerHour: 1 }).ok).toBe(false);
    expect(calculate({ table, level: 10, currentXp: 0, xpPerHour: 1, goalLevel: 14 }).ok).toBe(false);
  });

  it("rejects XP above the level requirement and non-positive rates", () => {
    expect(calculate({ table, level: 10, currentXp: 101, xpPerHour: 1 }).ok).toBe(false);
    expect(calculate({ table, level: 10, currentXp: 0, xpPerHour: 0 }).ok).toBe(false);
  });
});

describe("helpers", () => {
  it("converts rates to per-hour", () => {
    expect(toXpPerHour(10, "minute")).toBe(600);
    expect(toXpPerHour(2400, "day")).toBe(100);
  });

  it("formats durations", () => {
    expect(formatDuration(0)).toBe("Ready now");
    expect(formatDuration(0.5)).toBe("30m");
    expect(formatDuration(26.25)).toBe("1d 2h 15m");
  });

  it("loads the bundled season data", () => {
    expect(seasons.length).toBeGreaterThan(0);
    expect(getSeason(1)?.expToNext[0]).toBe(80);
  });
});

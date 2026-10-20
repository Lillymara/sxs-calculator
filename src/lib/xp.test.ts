import { describe, expect, it } from "vitest";
import { calculate, formatDuration, getSeason, parseAmount, seasons, type SeasonTable } from "./xp";

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

  it("rejects non-positive rates", () => {
    expect(calculate({ table, level: 10, currentXp: 0, xpPerHour: 0 }).ok).toBe(false);
  });

  it("works out where banked XP lands you when a level cap lifts", () => {
    // Held at 10 with 350 XP: 100 takes you to 11, 200 more to 12, with 50 left toward 13.
    const out = calculate({ table, level: 10, currentXp: 350, xpPerHour: 50 });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.result.banked).toEqual({ cappedLevel: 10, xp: 350, level: 12, pastData: false });
    expect(out.result.nextLevel).toBe(13);
    expect(out.result.xpRemaining).toBe(350);
    expect(out.result.hoursToNext).toBe(7);
  });

  it("stops at the end of the season's data", () => {
    const out = calculate({ table, level: 10, currentXp: 5000, xpPerHour: 50 });
    expect(out.ok && out.result.banked).toEqual({ cappedLevel: 10, xp: 5000, level: 13, pastData: true });
  });
});

describe("helpers", () => {
  it("parses in-game short numbers", () => {
    expect(parseAmount("4.13k")).toBeCloseTo(4130);
    expect(parseAmount("1.52B")).toBeCloseTo(1.52e9);
    expect(parseAmount("340M")).toBe(340e6);
    expect(parseAmount("1,250,000")).toBe(1250000);
    expect(parseAmount(" 12 ")).toBe(12);
    expect(parseAmount("")).toBeNaN();
    expect(parseAmount("abc")).toBeNaN();
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

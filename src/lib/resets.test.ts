import { describe, expect, it } from "vitest";
import { countdown, lastDailyReset, lastWeeklyReset, nextDailyReset, nextWeeklyReset } from "./resets";

const utc = (s: string) => new Date(`${s}Z`);

describe("resets", () => {
  it("rolls the daily reset over at 13:00 UTC", () => {
    expect(lastDailyReset(utc("2026-10-19T12:59:00")).toISOString()).toBe("2026-10-18T13:00:00.000Z");
    expect(lastDailyReset(utc("2026-10-19T13:00:00")).toISOString()).toBe("2026-10-19T13:00:00.000Z");
    expect(nextDailyReset(utc("2026-10-19T20:00:00")).toISOString()).toBe("2026-10-20T13:00:00.000Z");
  });

  it("finds the weekly reset on the chosen weekday", () => {
    // 2026-10-19 is a Monday.
    expect(lastWeeklyReset(utc("2026-10-19T12:00:00"), 1).toISOString()).toBe("2026-10-12T13:00:00.000Z");
    expect(lastWeeklyReset(utc("2026-10-19T14:00:00"), 1).toISOString()).toBe("2026-10-19T13:00:00.000Z");
    expect(lastWeeklyReset(utc("2026-10-22T09:00:00"), 1).toISOString()).toBe("2026-10-19T13:00:00.000Z");
    expect(nextWeeklyReset(utc("2026-10-22T09:00:00"), 1).toISOString()).toBe("2026-10-26T13:00:00.000Z");
  });

  it("formats countdowns", () => {
    const now = utc("2026-10-19T10:00:00");
    expect(countdown(now, utc("2026-10-19T13:00:00"))).toBe("3h 0m");
    expect(countdown(now, utc("2026-10-21T15:00:00"))).toBe("2d 5h");
    expect(countdown(now, utc("2026-10-19T10:20:00"))).toBe("20m");
  });
});

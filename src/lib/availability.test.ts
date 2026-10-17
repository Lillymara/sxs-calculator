import { describe, expect, it } from "vitest";
import { COMPANION_RULES, FANTOMON_RULES, availabilityFor, companionRule, isObtainable } from "./availability";
import { parseDay } from "./calendar";

const now = new Date("2026-10-17T15:00:00Z");

describe("availability", () => {
  it("keeps regular roster entries available", () => {
    expect(availabilityFor(undefined, null, now).state).toBe("available");
  });

  it("hides unreleased content everywhere", () => {
    const a = availabilityFor(FANTOMON_RULES[1616], parseDay("2026-05-19"), now);
    expect(a.state).toBe("unreleased");
    expect(isObtainable(a)).toBe(false);
    expect(companionRule(11021, "TW / future")?.kind).toBe("unreleased");
  });

  it("checks server-day releases against the server's age", () => {
    // Pandarial arrives on public day 91: First Dawn (day 152) has it, a server opened Sep 1 doesn't.
    expect(availabilityFor(FANTOMON_RULES[1611], parseDay("2026-05-19"), now).state).toBe("available");
    expect(availabilityFor(FANTOMON_RULES[1611], parseDay("2026-09-01"), now).state).toBe("upcoming");
  });

  it("marks event items missed only when the event ended before the server opened", () => {
    const cabbage = FANTOMON_RULES[1613];
    expect(availabilityFor(cabbage, parseDay("2026-05-19"), now).state).toBe("available");
    expect(availabilityFor(cabbage, parseDay("2026-10-01"), now).state).toBe("missed");
    expect(availabilityFor(COMPANION_RULES[11015], parseDay("2026-05-19"), now).state).toBe("upcoming");
  });

  it("keeps limited items with unknown dates visible", () => {
    expect(isObtainable(availabilityFor(FANTOMON_RULES[1612], parseDay("2026-10-01"), now))).toBe(true);
  });
});

describe("Fantomon filter keeps upcoming ones", () => {
  it("hides only missed and unreleased", async () => {
    const { isStillObtainable } = await import("./availability");
    const lateServer = parseDay("2026-10-01");
    expect(isStillObtainable(availabilityFor(FANTOMON_RULES[1611], parseDay("2026-09-01"), now))).toBe(true); // upcoming
    expect(isStillObtainable(availabilityFor(FANTOMON_RULES[1613], lateServer, now))).toBe(false); // missed
    expect(isStillObtainable(availabilityFor(FANTOMON_RULES[1616], lateServer, now))).toBe(false); // unreleased
  });
});

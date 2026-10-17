import { describe, expect, it } from "vitest";
import serverRows from "../data/servers.json";
import { buildEntries, dungeonDifficulties, loadServers, parseDay, searchServers, seasonStatus, serverDayAt } from "./calendar";

const servers = loadServers(serverRows as Parameters<typeof loadServers>[0]);

describe("server calendar", () => {
  const day1 = parseDay("2026-05-19")!;

  it("anchors Day 1 at the 13:00 UTC reset", () => {
    expect(day1.toISOString()).toBe("2026-05-19T13:00:00.000Z");
    expect(serverDayAt(day1, new Date("2026-05-20T12:59:00Z"))).toBe(1);
    expect(serverDayAt(day1, new Date("2026-05-20T13:00:00Z"))).toBe(2);
    expect(parseDay("2026-02-30")).toBeNull();
  });

  // Checks calendar dates for First Dawn on 2026-10-17.
  it("finds the season and its end", () => {
    const s = seasonStatus(day1, new Date("2026-10-17T15:00:00Z"));
    expect(s.day).toBe(152);
    expect(s.season.number).toBe(3);
    expect(s.dayOfSeason).toBe(40);
    expect(s.seasonEnds?.toISOString()).toBe("2026-12-18T13:00:00.000Z");
  });

  it("adds Nexus merges to season starts", () => {
    const firstDawn = servers.find((s) => s.name === "First Dawn")!;
    const s2 = buildEntries(day1, firstDawn).find((e) => e.type === "season" && e.title.startsWith("Season 2"))!;
    expect(s2.mergeServers).toEqual(["Silvercrest", "Stormwall"]);
  });

  it("matches server names despite typos", () => {
    expect(searchServers(servers, "first dwan")[0].name).toBe("First Dawn");
    expect(searchServers(servers, "")).toEqual([]);
  });

  it("splits dungeon difficulty requirements", () => {
    expect(dungeonDifficulties("Normal 3.55M + Lv130 · Hard 5M")).toEqual([
      { name: "Normal", requirement: "3.55M Power · Lv 130" },
      { name: "Hard", requirement: "5M Power" },
    ]);
    expect(dungeonDifficulties("Normal · Hard (36K Power)")[1].requirement).toBe("36K Power");
  });
});

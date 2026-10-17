import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createExplorer, rowText } from "./explorer";
import type { GameData } from "./gamedata";

const data = JSON.parse(readFileSync(new URL("../../public/data/gamedata.json", import.meta.url), "utf8")) as GameData;
const explorer = createExplorer(data);

// Skill and Fantomon reference values verified on 2026-10-17.
describe("skill and Fantomon details match reference values", () => {
  it("compares Water Shot at two grades", () => {
    const id = Object.values(data.loadout.skills).find((s) => s.name === "Water Shot")!.id;
    expect(rowText(explorer.detail(id, "Blue", 0, 128).rows[0])).toBe("43.61% ATK + 8,716 fixed");
    expect(rowText(explorer.detail(id, "Gold", 0, 128).rows[0])).toBe("77.87% ATK + 40,677 fixed");
  });

  it("shows Nyxarchon's Requiem Blast at Legendary skill grade", () => {
    const blast = data.combat.pets["1609"].stages.Childhood[0];
    expect(rowText(explorer.detail(blast.id, "Orange", 0, 128, "Silver3", 3).rows[0])).toBe("45% ATK + 34,834 fixed");
  });

  it("lists the Fantomons with client stats", () => {
    expect(explorer.fantomons).toHaveLength(18);
  });
});

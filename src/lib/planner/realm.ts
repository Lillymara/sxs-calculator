// Long-run Material Realm yields per entry.
import { REALM_DAMAGE_PROBABILITIES } from "../../data/seasons";

const cycleMemo = new Map<number, { hits: number; damage: number }>();

/** Expected hits and rewarded damage to break an object with this durability. */
function expectedCycle(durability: number) {
  const cached = cycleMemo.get(durability);
  if (cached) return cached;
  const hits = new Array<number>(durability + 1).fill(0);
  const damage = new Array<number>(durability + 1).fill(0);
  for (let left = 1; left <= durability; left++) {
    hits[left] = 1 + REALM_DAMAGE_PROBABILITIES.reduce((s, [hit, p]) => s + p * hits[Math.max(0, left - hit)], 0);
    // The breaking hit is rewarded in full, even past the remaining durability.
    damage[left] = REALM_DAMAGE_PROBABILITIES.reduce((s, [hit, p]) => s + p * (hit + damage[Math.max(0, left - hit)]), 0);
  }
  const result = { hits: hits[durability], damage: damage[durability] };
  cycleMemo.set(durability, result);
  return result;
}

export interface RealmYields {
  ore: number;
  rola: number;
  essence: number;
  /** White Sand equivalent (Blue counts as 5 White). */
  sand: number;
}

export function realmYieldsPerEntry(multiplier: number): RealmYields {
  const scaled = (base: number) => Math.trunc(base * multiplier + 1e-9);
  const c90 = expectedCycle(90), c150 = expectedCycle(150), c180 = expectedCycle(180);
  const ore = ((80 / 95) * (scaled(8) * c90.damage + scaled(120)) + (15 / 95) * (scaled(8) * c90.damage) + (5 / 95) * scaled(320)) / c90.hits;
  const rola = ((90 / 95) * (scaled(80) * c90.damage + scaled(1200)) + (5 / 95) * (scaled(80) * c90.damage) + (5 / 95) * scaled(3200)) / c90.hits;
  const essenceReward =
    (800 / 970) * (scaled(10) * c90.damage + scaled(150)) +
    (150 / 970) * (scaled(15) * c180.damage + scaled(225)) +
    (20 / 970) * (scaled(10) * c150.damage) +
    (30 / 970) * scaled(400);
  const essenceHits = (800 / 970) * c90.hits + (150 / 970) * c180.hits + (20 / 970) * c150.hits;
  const sand = ((80 / 95) * (scaled(7) * c90.damage + scaled(105)) + (15 / 95) * 5 * (scaled(2) * c90.damage + scaled(30)) + (5 / 95) * scaled(280)) / c90.hits;
  return { ore, rola, essence: essenceReward / essenceHits, sand };
}

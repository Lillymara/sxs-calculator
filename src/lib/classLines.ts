import type { Profession } from "./gamedata";

/**
 * Class lines, derived from each class's lineage (`chain`). Rank 1 classes are the
 * roots; every later class belongs to the path of its rank 2 ancestor.
 */
export interface ClassLine {
  id: string;
  name: string;
  /** Badge disc gradient; badges are white, so both colors need white contrast. */
  colors: [string, string];
  order: number;
}

const LINES: Record<string, Omit<ClassLine, "id">> = {
  Zhanshi: { name: "Warrior", colors: ["#64748b", "#334155"], order: 0 },
  Huwei: { name: "Knight line", colors: ["#d4a017", "#8a6508"], order: 1 },
  Doushi: { name: "Duelist line", colors: ["#dc2626", "#9f1239"], order: 2 },
  Fashi: { name: "Mage", colors: ["#7c3aed", "#4c1d95"], order: 3 },
  Shushi: { name: "Sorcerer line", colors: ["#2563eb", "#1e3a8a"], order: 4 },
  Xianzhe: { name: "Sage line", colors: ["#059669", "#115e59"], order: 5 },
};

export function lineOf(p: Profession): ClassLine {
  const id = p.rank === 1 ? p.code : p.chain[1] ?? p.chain[0];
  const line = LINES[id] ?? { name: "Other", colors: ["#6b7280", "#374151"] as [string, string], order: 9 };
  return { id, ...line };
}

/** Classes ordered by line, then rank. */
export function byLine(classes: Profession[]): Profession[] {
  return [...classes].sort((a, b) => lineOf(a).order - lineOf(b).order || a.rank - b.rank);
}

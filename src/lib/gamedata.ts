// Skill, class and Fantomon tables extracted from the game client.
// Shared by the Skills, Class Change and Fantomons tools.

export type Props = Record<string, number>;
export type Curve = Record<string, Props>;

export interface Quality {
  raw: string;
  name: string;
}

export interface Profession {
  code: string;
  name: string;
  rank: number;
  /** Class badge image id (public/art/classes/{badge}.webp). */
  badge: number;
  chain: string[];
  skills: number[];
  /** Which class in the chain each skill comes from. */
  source: Record<string, string>;
}

export interface SkillInfo {
  id: number;
  name: string;
  type: "active" | "charm";
  rank: number;
  /** Base grade (Blue, Purple, ...). */
  quality?: string;
  description: string;
}

export interface SkillMeta {
  groupId?: number;
  cd?: number | null;
  effects?: Record<string, Props>;
  passive?: { groupId: number; rankPropId: string; rankFactorId: string; factors: Props };
  statusEffects?: { groupId: number; entityId?: number; effects: Record<string, Props> }[];
  summons?: { effects: Record<string, Props> }[];
}

export interface PetData {
  minQuality?: string;
  levels: Curve;
  stages: Record<string, { id: number; name: string; description: string }[]>;
  forms?: Record<string, { iconId?: number; level?: number; skillQuality?: string }>;
}

export interface GameData {
  loadout: { professions: Profession[]; skills: Record<string, SkillInfo> };
  fantomons: { id: number; name: string; type: string; status?: string }[];
  combat: {
    qualities: Quality[];
    combatRanks: { raw: string; name: string }[];
    skills: Record<string, SkillMeta>;
    pets: Record<string, PetData>;
    skillGroups: Record<string, Record<string, string>>;
    skillFixedCurves: Record<string, Curve>;
    skillPassiveCurves: Record<string, Curve>;
    skillPassiveRankProps: Record<string, Curve>;
    skillPassiveRankScales: Record<string, Curve>;
  };
}

/** Row of a level-keyed table nearest to `value`. */
export function nearest(map: Curve | undefined, value: number): Props {
  const keys = Object.keys(map || {}).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!keys.length) return {};
  const key = keys.reduce((best, x) => (Math.abs(x - value) < Math.abs(best - value) ? x : best), keys[0]);
  return map![String(key)] || {};
}

/** Fetches the tables once per visit. */
let dataPromise: Promise<GameData> | null = null;

export function loadGameData(): Promise<GameData> {
  dataPromise ??= fetch(`${import.meta.env.BASE_URL}data/gamedata.json?v=${__BUILD_ID__}`)
    .then((r) => {
      if (!r.ok) throw new Error(`Game data failed to load (${r.status})`);
      return r.json() as Promise<GameData>;
    })
    .catch((e) => {
      dataPromise = null;
      throw e;
    });
  return dataPromise;
}

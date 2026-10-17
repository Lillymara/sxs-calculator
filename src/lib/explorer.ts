// Skill and Fantomon detail math for the Skills Overview, Skills Conversion and Fantomons tools.
import { nearest, type GameData, type Props, type Quality } from "./gamedata";

/** Skill rank range covered by each grade. */
export const GRADE_RANKS: Record<string, [number, number]> = {
  Blue: [1, 2], Purple: [3, 5], Orange: [6, 9], Gold: [10, 15], Red: [16, 23], Rainbow: [24, 34],
};
export const rankFrom = (raw: string, stars: number) => {
  const [a, b] = GRADE_RANKS[raw] || [1, 2];
  return Math.min(b, a + (+stars || 0));
};

export interface DetailRow {
  label: string;
  /** Percent coefficient (already ÷100) with its source stat, for scaling lines. */
  pct?: number;
  source?: string;
  fixed?: number;
  /** Plain value for passive/status lines. */
  value?: number;
  unit?: string;
  kind?: "passive";
}

const PASSIVE_LABELS: Record<string, string> = {
  MaxHp: "HP", Attack: "ATK", Defence: "DEF", Speed: "SPD", EffectDodge: "Effect RES", EffectRate: "Effect Hit Rate", ElementMaster: "Elemental Mastery",
  ElementResistance: "Elemental RES", KongFuMaster: "Physical Mastery", KongFuResistance: "Physical RES", CritRatePercent: "Crit Rate", CritRatePercentValue: "Crit Rate rating",
  CritAvoidPercent: "Crit RES", CritAvoidPercentValue: "Crit RES rating", CritPowerPercent: "Crit DMG", CritPower: "Crit DMG rating", BlockPercent: "Block Rate",
  BlockPercentValue: "Block Rate rating", BlockAvoidPercent: "Accuracy", BlockAvoidPercentValue: "Accuracy rating", BlockValuePercent: "Block Efficiency", BlockValue: "Block rating",
  CureAddPercent: "Healing Boost", CureAdd: "Healing rating", BeCureAddPercent: "Healing Received", BreakResiliencePercent: "Break RES",
  WindDamageAdd: "Wind Affinity", WaterDamageAdd: "Water Affinity", FireDamageAdd: "Fire Affinity", LightDamageAdd: "Light Affinity", DarkDamageAdd: "Dark Affinity",
};
const PASSIVE_RANK_ALIASES: Record<string, string> = {
  CritRatePercentValue: "CritRate", CritAvoidPercentValue: "CritAvoid", BlockPercentValue: "Block", BlockAvoidPercentValue: "Precise",
  WindDamageAdd: "WindFriend", WaterDamageAdd: "WaterFriend", FireDamageAdd: "FireFriend", LightDamageAdd: "LightFriend", DarkDamageAdd: "DarkFriend",
};
const PASSIVE_PERCENT = new Set(["CritRatePercent", "CritAvoidPercent", "CritPowerPercent", "BlockPercent", "BlockAvoidPercent", "BlockValuePercent", "CureAddPercent", "BeCureAddPercent", "BreakResiliencePercent"]);
const STATUS_PAIRS: [string, string, string, string][] = [
  ["AttackScale", "FixedAttack", "ATK", "base ATK"], ["DefenceScale", "FixedDefence", "DEF", "base DEF"], ["MaxHpScale", "FixedMaxHp", "HP", "base max HP"],
  ["SpeedScale", "FixedSpeed", "SPD", "base SPD"], ["StatusDmgAddPer", "FixedStatusDmgAdd", "DMG Boost", "damage"], ["StatusDmgReducePer", "FixedStatusDmgReduce", "DMG RES", "damage"],
  ["StatusDmgVulnerablePer", "FixedstatusDmgVulnerable", "DMG Taken", "damage"], ["CureAddPercent", "CureAdd", "Healing Boost", "healing"],
  ["BeCureAddPercent", "BeCureAdd", "Healing Received", "healing"], ["SuckHpByDamage", "FixedSuckHp", "Lifesteal", "damage"],
  ["StatusIgnoreDefence", "FixedStatusIgnoreDefence", "Ignore DEF", "DEF"], ["DamageByDamage", "FixedDamageByDamage", "Triggered DMG", "damage"],
  ["ShieldByTargetHp", "SkillFixedShield", "Shield", "max HP"], ["ShieldByDefence", "SkillFixedShield", "Shield", "DEF"],
  ["ShieldByConvertedCurHp", "SkillFixedShield", "Shield", "converted current HP"],
];
const STATUS_PERCENT_LABELS: Record<string, string> = {
  SkillCostByMaxHp: "HP Cost", FinalCureScale: "Final Healing", StatusShieldAddPercent: "Shield Boost", BlockAvoidPercent: "Accuracy", CritRatePercent: "Crit Rate",
  BlockPercent: "Block Rate", CritPowerPercent: "Crit DMG", MoveDistPercent: "Movement", FinalDamageReducePercent: "Final DMG RES", DmgAddPercent: "DMG Boost",
  DmgReducePercent: "DMG RES", DodgePercent: "Dodge", CritAvoidPercent: "Crit RES", BlockValuePercent: "Block Efficiency",
};
const STATUS_FLAT_LABELS: Record<string, string> = {
  ElementMaster: "Elemental Mastery", EffectRate: "Effect Hit Rate", EffectDodge: "Effect RES", FireDamageAdd: "Fire Affinity", WaterDamageAdd: "Water Affinity",
  WindDamageAdd: "Wind Affinity", LightDamageAdd: "Light Affinity", DarkDamageAdd: "Dark Affinity", BlockAvoidPercentValue: "Accuracy rating",
  CritRatePercentValue: "Crit Rate rating", BlockPercentValue: "Block Rate rating", FixedBlockValue: "Block rating", CritPower: "Crit DMG rating",
  FixedCritPower: "Crit DMG rating", SkillFixedShield: "Shield fixed", CureAdd: "Healing fixed", BeCureAdd: "Healing Received fixed", FixedMoveDist: "Movement",
  StatusAdd1: "Effect 1", StatusAdd2: "Effect 2", StatusAdd3: "Effect 3", StatusAdd4: "Effect 4",
  StatusFixedAdd1: "Effect 1 fixed", StatusFixedAdd2: "Effect 2 fixed", StatusFixedAdd3: "Effect 3 fixed", StatusFixedAdd4: "Effect 4 fixed",
};

export function createExplorer(data: GameData) {
  const D = data.loadout;
  const C = data.combat;
  const grades: Quality[] = C.qualities.slice(1);
  const grade = (raw: string) => grades.find((g) => g.raw === raw) || grades[0];

  function fixed(id: number, rank: number, level: number, prop: string, combatRank: string) {
    const meta = C.skills[id] || {};
    const curve = meta.groupId !== undefined ? C.skillGroups[meta.groupId]?.[combatRank] : undefined;
    const row = curve ? nearest(C.skillFixedCurves[curve], level) : null;
    const e = meta.effects?.[rank] || {};
    return row && e[prop] ? Math.round(((+row[prop] || 0) * (+e[prop] || 0)) / 10000) : 0;
  }

  function passiveRows(id: number, rank: number, level: number, combatRank: string): DetailRow[] {
    const p = C.skills[id]?.passive;
    if (!p) return [];
    const rankRow = C.skillPassiveRankProps[p.rankPropId]?.[rank] || {};
    const scaleRow = C.skillPassiveRankScales[p.rankFactorId]?.[rank] || {};
    const curveId = C.skillGroups[p.groupId]?.[combatRank];
    const levelRow = curveId ? nearest(C.skillPassiveCurves[curveId], level) : {};
    return Object.entries(p.factors || {})
      .map(([prop, factor]) => {
        const base = +rankRow[PASSIVE_RANK_ALIASES[prop] || prop] || 0;
        const scaled = ((+levelRow[prop] || 0) * (+scaleRow[prop] || 0)) / 10000;
        const value = ((base + scaled) * (+factor || 0)) / 10000;
        const isPercent = PASSIVE_PERCENT.has(prop);
        return { label: PASSIVE_LABELS[prop] || prop, value: isPercent ? value / 100 : Math.round(value), unit: isPercent ? "%" : "", kind: "passive" as const };
      })
      .filter((x) => x.value);
  }

  /** The Formation Breaker style buff scales from a fixed anchor curve. */
  function formationBreakerFixed(effect: Props, level: number, combatRank: string) {
    const raw = +effect.StatusFixedAdd1 || 0;
    if (!raw) return 0;
    const curveId = C.skillGroups["4"]?.[combatRank] || C.skillGroups["4"]?.Silver3;
    const anchorId = C.skillGroups["4"]?.Silver3;
    const row = curveId ? nearest(C.skillFixedCurves[curveId], level) : {};
    const anchor = anchorId ? nearest(C.skillFixedCurves[anchorId], 106) : {};
    const rowValue = +row.SkillFixedAttack1 || 0, anchorValue = +anchor.SkillFixedAttack1 || 0;
    return Math.round(raw * 2.5 * (rowValue && anchorValue ? rowValue / anchorValue : 1));
  }

  function statusRows(id: number, rank: number, level: number, combatRank: string): DetailRow[] {
    const meta = C.skills[id] || {};
    const result: DetailRow[] = [];
    (meta.statusEffects || []).forEach((st) => {
      const effect = st.effects?.[rank] || {};
      const curve = C.skillGroups[st.groupId]?.[combatRank];
      const levelRow = curve ? nearest(C.skillFixedCurves[curve], level) : {};
      const passiveRow = curve ? nearest(C.skillPassiveCurves[curve], level) : {};
      const curveValue = (prop: string) => +levelRow[prop] || +passiveRow[prop] || 0;
      const used = new Set<string>();
      if (+(st.entityId ?? 0) === 24192 && effect.StatusAdd1) {
        result.push({ label: "ATK", pct: (+effect.StatusAdd1 || 0) / 100, fixed: formationBreakerFixed(effect, level, combatRank), source: "caster ATK" });
        used.add("StatusAdd1");
        used.add("StatusFixedAdd1");
      }
      for (const [percentProp, fixedProp, label, source] of STATUS_PAIRS) {
        if (!effect[percentProp]) continue;
        const rawFixed = +effect[fixedProp] || 0;
        const scale = curveValue(fixedProp);
        result.push({ label, pct: effect[percentProp] / 100, fixed: rawFixed ? (scale ? Math.round((scale * rawFixed) / 10000) : Math.round(rawFixed)) : 0, source });
        used.add(percentProp);
        used.add(fixedProp);
      }
      for (const [prop, label] of Object.entries(STATUS_PERCENT_LABELS)) {
        if (effect[prop] && !used.has(prop)) {
          result.push({ label, value: effect[prop] / 100, unit: "%", kind: "passive" });
          used.add(prop);
        }
      }
      for (const [prop, label] of Object.entries(STATUS_FLAT_LABELS)) {
        if (effect[prop] && !used.has(prop)) {
          const scale = curveValue(prop);
          result.push({ label, value: scale ? Math.round((scale * effect[prop]) / 10000) : Math.round(effect[prop]), unit: "", kind: "passive" });
          used.add(prop);
        }
      }
    });
    (meta.summons || []).forEach((summon) => {
      const effect = summon.effects?.[rank] || {};
      for (const [prop, label] of Object.entries({ MaxHp: "Summon HP inheritance", Attack: "Summon ATK inheritance", Defence: "Summon DEF inheritance", Speed: "Summon SPD inheritance" })) {
        if (effect[prop]) result.push({ label, value: effect[prop] / 100, unit: "%", kind: "passive" });
      }
    });
    return result;
  }

  /** Every numeric line for a skill at a grade/stars (or explicit rank) and level. */
  function detail(id: number, raw: string, stars: number, level: number, combatRank = "Silver3", rankOverride: number | null = null) {
    const s = D.skills[id] || { id, name: `Skill ${id}`, description: "", type: "active" as const, rank: 1 };
    const rank = rankOverride ?? rankFrom(raw, stars);
    const meta = C.skills[id] || {};
    const e = meta.effects?.[rank] || {};
    const rows: DetailRow[] = [];
    for (let i = 1; i <= 4; i++) {
      const p = `SkillAttack${i}`;
      if (e[p]) rows.push({ label: i === 1 ? "DMG" : `DMG ${i}`, pct: e[p] / 100, fixed: fixed(id, rank, level, `SkillFixedAttack${i}`, combatRank), source: "ATK" });
    }
    const cure = fixed(id, rank, level, "SkillFixedCure", combatRank);
    if (e.SkillCureByAttack) rows.push({ label: "Healing", pct: e.SkillCureByAttack / 100, fixed: cure, source: "ATK" });
    if (e.SkillCureByHp) rows.push({ label: "Healing", pct: e.SkillCureByHp / 100, fixed: cure, source: "max HP" });
    for (const [prop, label] of Object.entries({ SkillDmgAddPerByTargetHp: "Target HP scaling", SkillDmgAddPerByLargeTarget: "Large-target DMG", OnceHitHemophagiaPer: "Lifesteal", DistanceAddDmgPercent: "Distance DMG bonus" })) {
      if (e[prop]) rows.push({ label, value: e[prop] / 100, unit: "%", kind: "passive" });
    }
    rows.push(...statusRows(id, rank, level, combatRank), ...passiveRows(id, rank, level, combatRank));
    return { s, rank, raw, stars, level, cd: meta.cd, rows };
  }

  /** Fantomons that have client stats. */
  const fantomons = data.fantomons.filter((f) => C.pets[String(f.id)]);

  return { D, C, grades, grade, detail, fantomons };
}

export type Explorer = ReturnType<typeof createExplorer>;

/** "45% ATK + 1,234 fixed" or "12.5%" for a detail row. */
export function rowText(r: DetailRow): string {
  if (r.kind === "passive" || r.pct === undefined) return `${(r.value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}${r.unit ?? ""}`;
  return `${r.pct.toFixed(2).replace(/\.00$/, "")}% ${r.source}${r.fixed ? ` + ${r.fixed.toLocaleString()} fixed` : ""}`;
}

import { useState } from "react";
import type { Explorer } from "../../lib/explorer";
import type { SkillInfo } from "../../lib/gamedata";
import { ClassSelect } from "../../components/ClassSelect";
import { GameArt } from "../../components/GameArt";
import { Loading, useExplorer } from "./shared";

export function ConversionPage() {
  const { explorer, error } = useExplorer();
  if (!explorer) return <Loading error={error} />;
  return <Conversion explorer={explorer} />;
}

interface Pool {
  rank: number;
  type: "active" | "charm";
  raw: string;
  left: SkillInfo[];
  right: SkillInfo[];
  fromName: string;
  toName: string;
}

/**
 * When you change class, each owned skill rerolls into a skill of the same
 * class tier, type and base grade from the new class line.
 */
function Conversion({ explorer }: { explorer: Explorer }) {
  const { D } = explorer;
  const [from, setFrom] = useState("Fashi");
  const [to, setTo] = useState("Zhanshi");
  const byCode = new Map(D.professions.map((p) => [p.code, p]));
  const a = byCode.get(from)!;
  const b = byCode.get(to)!;
  const all = Object.values(D.skills);
  const targetByRank = Object.fromEntries(b.chain.map((code) => [byCode.get(code)!.rank, code]));

  const pools: Pool[] = [];
  for (const rank of [...new Set(a.chain.map((code) => byCode.get(code)!.rank))]) {
    const sourceCode = a.chain.find((code) => byCode.get(code)!.rank === rank)!;
    const targetCode = targetByRank[rank];
    if (!targetCode) continue;
    const sourceSkills = all.filter((s) => a.source[s.id] === sourceCode);
    for (const type of ["active", "charm"] as const) {
      for (const g of explorer.grades) {
        const left = sourceSkills.filter((s) => s.type === type && s.quality === g.raw);
        const right = all.filter((s) => b.source[s.id] === targetCode && s.type === type && s.quality === g.raw);
        if (left.length && right.length) {
          pools.push({ rank, type, raw: g.raw, left, right, fromName: byCode.get(sourceCode)!.name, toName: byCode.get(targetCode)!.name });
        }
      }
    }
  }

  return (
    <div className="tool">
      <section className="card">
        <div className="fields">
          <ClassSelect label="Class you have" value={from} classes={D.professions} onChange={setFrom} />
          <ClassSelect label="Class you want" value={to} classes={D.professions} onChange={setTo} />
        </div>
        <p className="hint">
          Each skill you own rerolls into a random skill of the same class tier, type and base grade in the new class line. {pools.reduce((n, g) => n + g.left.length, 0)} of
          your skills map into {pools.length} pools.
        </p>
      </section>

      {pools.length ? (
        pools.map((g, i) => (
          <section key={i} className={`card conversion grade-${g.raw.toLowerCase()}`}>
            <h2 className="subhead">
              Rank {g.rank} · {explorer.grade(g.raw).name} {g.type === "active" ? "techniques" : "charms"} · {g.fromName} → {g.toName}
            </h2>
            {g.left.map((s) => (
              <div key={s.id} className="conversion-row">
                <b className="skill-name">
                  <GameArt path={`skills/skill_${s.id}.webp`} name={s.name} alt="" className="skill-icon" />
                  {s.name}
                </b>
                <span aria-hidden>→</span>
                <div className="chips">
                  {g.right.map((t) => (
                    <span key={t.id} className="reward with-icon" title={t.description}>
                      <GameArt path={`skills/skill_${t.id}.webp`} name={t.name} alt="" className="skill-icon small" />
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="hint">{g.right.length} possible results.</p>
          </section>
        ))
      ) : (
        <section className="card"><p className="hint">No compatible pools for this pair.</p></section>
      )}
    </div>
  );
}

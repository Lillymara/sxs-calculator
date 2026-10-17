import { useState } from "react";
import { rowText, type Explorer } from "../../lib/explorer";
import { nearest } from "../../lib/gamedata";
import { AvailabilityBar } from "../../components/AvailabilityBar";
import { GameArt } from "../../components/GameArt";
import { FANTOMON_RULES, availabilityFor, isStillObtainable } from "../../lib/availability";
import { usePersistentState } from "../../lib/storage";
import { effectiveDay1 } from "../calendar/server";
import type { ToolProps } from "./props";
import { GlossaryText, Loading, useExplorer } from "./shared";

export function FantomonsPage(props: ToolProps) {
  const { explorer, error } = useExplorer();
  if (!explorer) return <Loading error={error} />;
  return <Fantomons explorer={explorer} {...props} />;
}

/** Fantomon skill grade → skill rank, as the client maps it. */
const SKILL_RANKS: Record<string, number> = { Purple: 2, Orange: 3, Gold: 4, Red: 5, Rainbow: 6 };
const STATS: [string, string][] = [["Attack", "ATK"], ["Defence", "DEF"], ["MaxHp", "HP"], ["Speed", "SPD"]];

function Fantomons({ explorer, choice, onServerChange, now }: { explorer: Explorer } & ToolProps) {
  const { C, grades, grade, fantomons: all } = explorer;
  const [filter, setFilter] = usePersistentState<{ only: boolean; limited: boolean }>("sxs.availability", { only: false, limited: false });
  const day1 = effectiveDay1(choice);
  const avail = (id: number) => availabilityFor(FANTOMON_RULES[id], day1, now);
  const fantomons = all.filter((f) => {
    const a = avail(f.id);
    return (!filter.only || isStillObtainable(a)) && (!filter.limited || a.state !== "limited");
  });
  const qIndex = (raw: string) => grades.findIndex((g) => g.raw === raw);

  const [selected, setSelected] = useState("1609");
  const [level, setLevel] = useState(128);
  const pet = C.pets[selected];
  const allowedPet = grades.filter((g) => qIndex(g.raw) >= Math.max(0, qIndex(pet.minQuality || "Purple")));
  const baseSkill = qIndex(pet.minQuality || "Purple") < qIndex("Orange") ? pet.minQuality || "Purple" : "Orange";
  const allowedSkill = grades.filter((g) => qIndex(g.raw) >= qIndex(baseSkill) && SKILL_RANKS[g.raw]);
  const [petRaw, setPetRaw] = useState(pet.minQuality || "Purple");
  const [skillRaw, setSkillRaw] = useState(baseSkill);
  const petGrade = allowedPet.some((g) => g.raw === petRaw) ? petRaw : allowedPet[0]?.raw || "Purple";
  const skillGrade = allowedSkill.some((g) => g.raw === skillRaw) ? skillRaw : allowedSkill[0]?.raw || "Orange";

  const info = fantomons.find((f) => String(f.id) === selected)!;
  const row = nearest(pet.levels, level);
  const adult = pet.forms?.Adulthood;

  const choose = (id: string) => {
    setSelected(id);
    const p = C.pets[id];
    setPetRaw(p.minQuality || "Purple");
    setSkillRaw(qIndex(p.minQuality || "Purple") < qIndex("Orange") ? p.minQuality || "Purple" : "Orange");
  };

  return (
    <div className="tool">
      <section className="card">
        <AvailabilityBar
          choice={choice}
          onServerChange={onServerChange}
          onlyObtainable={filter.only}
          onToggle={(only) => setFilter({ ...filter, only })}
          hiddenCount={all.filter((f) => !isStillObtainable(avail(f.id))).length}
          hideLimited={filter.limited}
          onToggleLimited={(limited) => setFilter({ ...filter, limited })}
          limitedCount={all.filter((f) => avail(f.id).state === "limited").length}
          label="Hide missed and unreleased"
          description="Hides unreleased Fantomons and event Fantomons your server missed. Ones still on the way stay listed"
        />
      </section>
      <div className="tool-grid fantomons">
      <section className="card">
        <h2>Fantomons <span className="chip">{fantomons.length}</span></h2>
        {!fantomons.length && <p className="hint">Nothing matches. Turn off the filter to see everything.</p>}
        <div className="pet-list">
          {fantomons.map((f) => (
            <button key={f.id} type="button" className={`skill-card with-art ${String(f.id) === selected ? "on" : ""}`} onClick={() => choose(String(f.id))}>
              <GameArt path={`fantomons/pet_${C.pets[String(f.id)].forms?.Childhood?.iconId || f.id}.webp`} name={f.name} alt="" className="thumb" />
              <span>
                <b>{f.name}</b>
                <small>
                  {f.type} · starts {grade(C.pets[String(f.id)].minQuality || "Purple").name}
                </small>
                {(() => {
                  const a = avail(f.id);
                  return a.tag ? <span className={`avail-tag ${a.state}`}>{a.tag}</span> : null;
                })()}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="pet-hero">
          <div className="evolution">
            <figure>
              <GameArt path={`fantomons/pet_${pet.forms?.Childhood?.iconId || selected}.webp`} name={info.name} alt={`${info.name} baby form`} />
              <figcaption>Baby</figcaption>
            </figure>
            {adult && (
              <>
                <span className="evo-arrow" aria-hidden>→<small>Lv{adult.level || 100}</small></span>
                <figure>
                  <GameArt path={`fantomons/pet_${adult.iconId}.webp`} name={info.name} alt={`${info.name} adult form`} />
                  <figcaption>Adult</figcaption>
                </figure>
              </>
            )}
          </div>
          <div>
            <p className="eyebrow">{info.type}{info.status ? ` · ${info.status}` : ""}</p>
            <h2 className="pet-name">{info.name}</h2>
          </div>
        </div>
        <div className="fields three">
          <label className="field">
            <span>Fantomon grade</span>
            <select value={petGrade} onChange={(e) => setPetRaw(e.target.value)}>
              {allowedPet.map((g) => <option key={g.raw} value={g.raw}>{g.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Skill grade</span>
            <select value={skillGrade} onChange={(e) => setSkillRaw(e.target.value)}>
              {allowedSkill.map((g) => <option key={g.raw} value={g.raw}>{g.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Level</span>
            <input inputMode="numeric" value={level} onChange={(e) => setLevel(Math.max(1, Math.min(620, Math.trunc(+e.target.value) || 1)))} />
          </label>
        </div>
        <dl className="stats">
          {STATS.map(([k, n]) => (
            <div key={k}><dt>{n}</dt><dd>{(+row[k] || 0).toLocaleString()}</dd></div>
          ))}
        </dl>
        <p className="hint">
          {adult
            ? `Evolves to adult form at Lv${adult.level || 100} with ${grade(adult.skillQuality || "Gold").name} skills.`
            : "No adult form in the client data."}{" "}
        </p>
        {avail(+selected).detail && <p className={`note avail-note ${avail(+selected).state}`}>{avail(+selected).detail}</p>}

        {(["Childhood", "Adulthood"] as const).map((stage) => {
          const abilities = pet.stages?.[stage] || [];
          const available = stage === "Childhood" || adult;
          return (
            <div key={stage} className="form-block">
              <h3 className="subhead">
                {stage === "Childhood" ? "Baby form" : "Adult form"}{" "}
                <span className="chip">{available ? `${abilities.length} ${abilities.length === 1 ? "ability" : "abilities"}` : "Not available"}</span>
              </h3>
              {available &&
                abilities.map((s) => {
                  const d = explorer.detail(s.id, skillGrade, 0, level, "Silver3", SKILL_RANKS[skillGrade]);
                  const incomplete = /^(?:Skill \d+|DNTB)/i.test(s.name);
                  return (
                    <div key={s.id} className="tuning">
                      <p className="event-title">{incomplete ? `Unlocalized ability (ID ${s.id})` : s.name}</p>
                      <dl className="formulas">
                        {d.rows.length ? (
                          d.rows.map((r, i) => <div key={i}><dt>{r.label}</dt><dd>{rowText(r)}</dd></div>)
                        ) : (
                          <div><dt>Behavior</dt><dd>Status, buff or utility effect.</dd></div>
                        )}
                      </dl>
                      <GlossaryText text={s.description || "No description in this client build."} />
                    </div>
                  );
                })}
            </div>
          );
        })}
      </section>
    </div>
      </div>
  );
}

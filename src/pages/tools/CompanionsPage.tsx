// Companion stats and friendship curves from the game client.
import { useMemo, useState } from "react";
import raw from "../../data/companions.json";
import { AvailabilityBar } from "../../components/AvailabilityBar";
import { GameArt } from "../../components/GameArt";
import { availabilityFor, companionRule, isObtainable } from "../../lib/availability";
import { usePersistentState } from "../../lib/storage";
import { effectiveDay1 } from "../calendar/server";
import type { ToolProps } from "./props";

interface Companion {
  id: number;
  name: string;
  premium: boolean;
  catalog: string;
  nativeClass: string;
  recommended: string[];
  recommendationReason?: string;
  gift?: string;
  region?: string;
  availability: string;
  unlock: { label: string; sources: string[] };
  maxLevel: number;
  /** Stat bonuses at each friendship level (index 0 = level 1). */
  curve: Record<string, number>[];
  /** Cumulative friendship EXP per level. */
  exp: number[];
  /** Whether full-body art exists (otherwise only the portrait icon). */
  figure: boolean;
}

const DATA = raw as Companion[];
const CORE = new Set(["ATK", "DEF", "HP", "SPD"]);
const TRAVEL = new Set(["Travel Base Reward +", "Travel Reward Bonus", "Travel Extra Reward Chance"]);
const STAT_ORDER = ["ATK %", "DEF %", "HP %", "SPD %", "Crit Rate", "Crit RES", "Accuracy", "Block Rate", "Healing Boost", "DMG Boost", "DMG RES"];
const PERCENTISH = ["Crit Rate", "Crit RES", "Accuracy", "Block Rate", "Crit DMG", "Healing Boost", "DMG Boost", "DMG RES", "Travel Reward Bonus", "Travel Extra Reward Chance"];
const STAT_FILTERS = STAT_ORDER.filter((s) => DATA.some((c) => Number((c.curve[c.maxLevel - 1] || {})[s]) > 0));
const DUPLICATE_NAMES = new Set(DATA.filter((c, i) => DATA.findIndex((x) => x.name === c.name) !== i).map((c) => c.name));
const fmt = (name: string, v: number) =>
  name.includes("%") || PERCENTISH.includes(name)
    ? `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
    : Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
const uniq = (xs: string[]) => [...new Set(xs.filter(Boolean))].sort();

export function CompanionsPage({ choice, onServerChange, now }: ToolProps) {
  const [filter, setFilter] = usePersistentState<{ only: boolean; limited: boolean }>("sxs.availability", { only: false, limited: false });
  const day1 = effectiveDay1(choice);
  const day1Time = day1?.getTime() ?? null;
  const avail = (x: Companion) => availabilityFor(companionRule(x.id, x.availability), day1, now);
  const [search, setSearch] = useState("");
  const [cls, setCls] = useState("");
  const [rarity, setRarity] = useState("");
  const [catalog, setCatalog] = useState("");
  const [stats, setStats] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState(DATA[0]?.id);
  const [level, setLevel] = useState(100);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DATA.filter((c) => {
      const final = c.curve[c.maxLevel - 1] || {};
      const hay = [c.name, c.nativeClass, c.catalog, c.gift, c.region, c.availability, ...c.recommended].join(" ").toLowerCase();
      return (
        (!q || hay.includes(q)) &&
        [...stats].every((s) => Number(final[s]) > 0) &&
        (!cls || c.recommended.includes(cls)) &&
        (!catalog || c.catalog === catalog) &&
        (() => {
          const a = availabilityFor(companionRule(c.id, c.availability), day1Time === null ? null : new Date(day1Time), now);
          return (!filter.only || isObtainable(a)) && (!filter.limited || a.state !== "limited");
        })() &&
        (!rarity || (rarity === "premium") === c.premium)
      );
    });
  }, [search, cls, rarity, catalog, stats, filter.only, filter.limited, day1Time, now]);

  const c = DATA.find((x) => x.id === selectedId) ?? DATA[0];
  const lv = Math.max(1, Math.min(c.maxLevel, level));
  const entries = Object.entries(c.curve[lv - 1] || {});
  const top = (x: Companion) =>
    Object.entries(x.curve[x.maxLevel - 1] || {})
      .filter(([n]) => !CORE.has(n) && !TRAVEL.has(n))
      .slice(0, 3)
      .map(([n, v]) => `${n} ${fmt(n, v)}`)
      .join(" · ");

  const statRows = (rows: [string, number][]) =>
    rows.length ? (
      <dl className="item-lines">
        {rows.map(([n, v]) => <div key={n}><dt>{n}</dt><dd>{fmt(n, v)}</dd></div>)}
      </dl>
    ) : (
      <p className="hint">No bonus at this level.</p>
    );

  return (
    <div className="tool">
      <section className="card">
        <AvailabilityBar
          choice={choice}
          onServerChange={onServerChange}
          onlyObtainable={filter.only}
          onToggle={(only) => setFilter({ ...filter, only })}
          hideLimited={filter.limited}
          onToggleLimited={(limited) => setFilter({ ...filter, limited })}
          limitedCount={DATA.filter((x) => avail(x).state === "limited").length}
          hiddenCount={DATA.filter((x) => !isObtainable(avail(x))).length}
          description="Hides unreleased companions, ones your server hasn't reached yet, and event companions from before it opened"
        />
      </section>
      <section className="card">
        <div className="fields four">
          <label className="field span-2">
            <span>Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, class, gift, region" />
          </label>
          <label className="field">
            <span>Recommended for</span>
            <select value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="">Any class</option>
              {uniq(DATA.flatMap((x) => x.recommended)).map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Rarity</span>
            <select value={rarity} onChange={(e) => setRarity(e.target.value)}>
              <option value="">All</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
            </select>
          </label>
          <label className="field">
            <span>Catalog</span>
            <select value={catalog} onChange={(e) => setCatalog(e.target.value)}>
              <option value="">All</option>
              {uniq(DATA.map((x) => x.catalog)).map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
        </div>
        <div className="filter-row stat-filter" role="group" aria-label="Must have these stats">
          {STAT_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={stats.has(s)}
              onClick={() => setStats((prev) => {
                const n = new Set(prev);
                if (n.has(s)) n.delete(s);
                else n.add(s);
                return n;
              })}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="hint">
          {list.length} of {DATA.length} companions · {DATA.filter((x) => x.premium).length} premium. Stat filters keep companions that have every selected stat at max friendship.
        </p>
      </section>

      <div className="tool-grid">
        <section className="card">
          <div className="pet-list">
            {list.map((x) => (
              <button key={x.id} type="button" className={`skill-card with-art ${x.premium ? "premium" : ""} ${x.id === c.id ? "on" : ""}`} onClick={() => setSelectedId(x.id)}>
                <GameArt path={`companions/icon_${x.id}.webp`} name={x.name} alt="" className="thumb round" />
                <span>
                  <b>{x.name}</b>
                  <small>{x.premium ? "Premium" : "Standard"} · {x.nativeClass}</small>
                  <small className="muted">{top(x)}</small>
                  {(() => {
                    const a = avail(x);
                    return a.tag ? <span className={`avail-tag ${a.state}`}>{a.tag}</span> : null;
                  })()}
                </span>
              </button>
            ))}
            {!list.length && <p className="hint">No companions match these filters.</p>}
          </div>
        </section>

        <section className="card">
          <div className="companion-hero">
            <GameArt
              path={c.figure ? `companions/figure_${c.id}.webp` : `companions/icon_${c.id}.webp`}
              name={c.name}
              alt={`${c.name} artwork`}
              className={c.figure ? "figure" : "portrait-icon"}
            />
            <div>
              <p className="eyebrow">{c.premium ? "Premium" : "Standard"} · {c.catalog} · {c.availability}{DUPLICATE_NAMES.has(c.name) ? ` · entry ${c.id}` : ""}</p>
              <h2 className="pet-name">{c.name}</h2>
              <p className="hint">{c.nativeClass} native class. {c.recommendationReason}</p>
              <div className="chips">
                {(c.recommended.length ? c.recommended : ["General"]).map((r) => <span key={r} className="reward">{r}</span>)}
              </div>
            </div>
          </div>
          {avail(c).detail && <p className={`note avail-note ${avail(c).state}`}>{avail(c).detail}</p>}
          <dl className="item-lines facts">
            <div><dt>Favorite gifts</dt><dd>{c.gift || "Not specified"}</dd></div>
            <div><dt>Region</dt><dd>{c.region || "—"}</dd></div>
            <div><dt>Unlock</dt><dd>{c.unlock.label}</dd></div>
            <div><dt>From</dt><dd>{c.unlock.sources.join(", ") || "Client condition"}</dd></div>
          </dl>

          <label className="field friendship">
            <span>Friendship level: {lv}</span>
            <input type="range" min={1} max={c.maxLevel} value={lv} onChange={(e) => setLevel(+e.target.value)} />
          </label>
          <p className="hint">
            {lv < c.maxLevel ? `Next level needs ${(c.exp[lv] || 0).toLocaleString()} cumulative friendship EXP.` : "Maximum friendship level."}
          </p>
          <h3 className="subhead">Core stats</h3>
          {statRows(entries.filter(([n]) => CORE.has(n)))}
          <h3 className="subhead">Special stats</h3>
          {statRows(entries.filter(([n]) => !CORE.has(n) && !TRAVEL.has(n)))}
          <h3 className="subhead">Travel</h3>
          {statRows(entries.filter(([n]) => TRAVEL.has(n)))}
        </section>
      </div>
    </div>
  );
}

import { CharacterForm, type Character } from "../../components/CharacterForm";
import { Field, Section } from "../../components/Field";
import { getRule } from "../../data/seasons";
import type { Material, PlannerResult, RealmMaterial } from "../../lib/planner/plan";
import type { SlotCategory } from "../../lib/planner/score";
import { REALM_MATERIALS } from "../../lib/planner/plan";
import { formatDuration, formatEta, getSeason } from "../../lib/xp";
import {
  DEFAULT_EXP_PER_TREAT,
  GEAR_NAMES,
  STAMINA_YIELD_DEFAULTS,
  effectiveSeasonEnd,
  type PlannerForm,
  type TimeDefaults,
} from "./form";
import { SlotTable } from "./SlotTable";
import { Summary } from "./Summary";

interface Props {
  character: Character;
  onCharacterChange: (c: Character) => void;
  form: PlannerForm;
  onChange: (f: PlannerForm) => void;
  result: PlannerResult | null;
  now: Date;
  defaults: TimeDefaults;
  /** The player's server from the calendar, if set. */
  server: { name: string; season: number; seasonEnds: Date | null } | null;
}

const MATERIAL_LABELS: Record<Material, string> = {
  ore: "Ore",
  rola: "Rola",
  essence: "Essence",
  sand: "Sand (White eq.)",
  treats: "Treats",
};
const REALM_TOOLS: Record<RealmMaterial, string> = { ore: "Hammers", rola: "Rola entries", essence: "Gloves", sand: "Shovels" };
const fmt = (x: number) => Math.round(x).toLocaleString();

export function PlannerPage({ character, onCharacterChange, form, onChange, result, now, defaults, server }: Props) {
  const season = Number(character.season);
  const rule = getRule(season);
  const table = getSeason(season);
  const set = <K extends keyof PlannerForm>(key: K, value: PlannerForm[K]) => onChange({ ...form, [key]: value });
  const floor = rule?.floor ?? 0;
  const caps = result?.caps;
  const t = result?.time;
  const staminaDefaults = STAMINA_YIELD_DEFAULTS[season];
  const range = (count: number, label: (i: number) => string) => Array.from({ length: count }, (_, i) => label(i));

  const capNote = (cap: number | null | undefined, prefix = "") =>
    cap != null && caps ? (
      <p className="hint">
        Cap at your season-end level: {prefix}
        {cap}
        {caps.nextAt !== null && <> · next increase at Lv {caps.nextAt}</>}
      </p>
    ) : null;

  const weightChip = (w?: number) => w !== undefined && <span className="chip">+{w} pts / level</span>;

  /** "Fill minimum ... for my goal": the button and the cap warning for one section. */
  const fillMinimum = (key: SlotCategory, field: "gear" | "skills" | "fantomons" | "relics", noun: string) => {
    if (!result) return null;
    const plan = result.minimum[key];
    return (
      <>
        {result.score.scoreNeeded > 0 && (
          <button
            type="button"
            className="secondary"
            onClick={() => onChange({ ...form, [field]: form[field].map((g, i) => ({ ...g, planned: String(plan.planned[i]) })) })}
          >
            Fill minimum {noun} for my goal
          </button>
        )}
        {plan.limited && (
          <p className="hint warn">
            {noun[0].toUpperCase() + noun.slice(1)} alone can't make up the rest of the goal under the current cap.
          </p>
        )}
      </>
    );
  };

  return (
    <div className="planner">
      <div className="planner-form">
        <Section step={1} title="Season & time">
          <div className="fields">
            <Field
              className="span-2"
              type="datetime-local"
              label="Season ends"
              value={effectiveSeasonEnd(form, defaults, now)}
              onChange={(v) => set("seasonEnd", v)}
              hint={
                form.seasonEnd ? (
                  defaults.seasonEnd ? (
                    <button type="button" className="link-button" onClick={() => set("seasonEnd", "")}>
                      Use {server?.name || "my server"}'s season end
                    </button>
                  ) : undefined
                ) : defaults.seasonEnd ? (
                  <>From {server?.name || "your server"}'s calendar (Season {server?.season} ends at the 13:00 UTC reset).</>
                ) : (
                  <>
                    Defaulting to 14 days from now. <a href="#/calendar">Pick your server</a> to fill in the real date.
                  </>
                )
              }
            />
            <Field
              type="time"
              label="Daily reset"
              value={form.resetTime || defaults.resetTime}
              onChange={(v) => set("resetTime", v)}
              hint={form.resetTime ? undefined : "13:00 UTC in your time."}
            />
            <Field label="Boost hours per reset" value={form.boostHours} onChange={(v) => set("boostHours", v)} placeholder="2" />
            <label className="check span-2">
              <input type="checkbox" checked={form.saveBed} onChange={(e) => set("saveBed", e.target.checked)} />
              <span>
                Save bed EXP for next season
                <small>The last natural bed hours are held back. Reset boosts inside that window still count.</small>
              </span>
            </label>
            {form.saveBed && (
              <Field label="Hours to save" value={form.saveBedHours} onChange={(v) => set("saveBedHours", v)} placeholder="36" hint="Max 36." />
            )}
          </div>
          {t && (
            <dl className="stats compact">
              <div><dt>Time left</dt><dd>{formatDuration(t.realHours)}</dd></div>
              <div><dt>Resets</dt><dd>{t.resets.length}</dd></div>
              <div><dt>Production hours</dt><dd>{fmt(t.productionHours)}h</dd></div>
              {t.saveStart && <div><dt>Start saving</dt><dd>{formatEta(0, t.saveStart)}</dd></div>}
            </dl>
          )}
        </Section>

        <Section step={2} title="Character EXP">
          {server && server.season !== season && server.season <= 5 && (
            <p className="note warn">
              {server.name || "Your server"} is in Season {server.season}, but Season {season} is selected.{" "}
              <button type="button" className="link-button" onClick={() => onCharacterChange({ ...character, season: String(server.season) })}>
                Switch to Season {server.season}
              </button>
            </p>
          )}
          <CharacterForm character={character} onChange={onCharacterChange} onReset={() => onCharacterChange({ ...character, level: "", currentXp: "", percent: "", rate: "" })} table={table} compact />
          <details className="advanced">
            <summary>EXP rate growth (goddess statues)</summary>
            <div className="fields">
              <Field label="Statues now" value={form.statues} onChange={(v) => set("statues", v)} placeholder="0" hint="Each adds 1% EXP." />
              <Field label="New statues per day" value={form.statuesPerDay} onChange={(v) => set("statuesPerDay", v)} placeholder="0" />
            </div>
          </details>
          {result && (
            <div className="projection">
              {result.character.ok ? (
                <>
                  <p className="eyebrow">At season end</p>
                  <p className="big-time">Lv {result.character.decimalLevel.toFixed(2)}</p>
                  <p className="eta">
                    {fmt(result.character.xpGained)} EXP gained
                    {result.character.xpSaved > 0 && <> · {fmt(result.character.xpSaved)} saved in bed</>}
                  </p>
                  {result.character.stoppedAt !== undefined && (
                    <p className="error">EXP data runs out at level {result.character.stoppedAt}.</p>
                  )}
                </>
              ) : (
                <p className="error">No EXP data for that level in Season {season}.</p>
              )}
            </div>
          )}
        </Section>

        <Section step={3} title="Primostar goal">
          <div className="fields">
            <Field label="Primostars you have" value={form.primostarsNow} onChange={(v) => set("primostarsNow", v)} placeholder="0" />
            <Field label="Total you want" value={form.primostarGoal} onChange={(v) => set("primostarGoal", v)} placeholder="0" />
          </div>
          {rule && (
            <p className="hint">
              Season {season} scoring starts at Lv {floor + 1} (relics above +{rule.relicFloor}). You get {rule.fixedStars} Primostars
              for the season, plus 1 per {rule.pointsPerStar} points. Primostars carry over between seasons.
              {result && result.score.scoreNeeded > 0 && <> This season needs <b>{fmt(result.score.scoreNeeded)}</b> points.</>}
            </p>
          )}
        </Section>

        <Section
          step={4}
          title="Gear · Ore & Rola"
          aside={weightChip(rule?.weights.gear)}
        >
          <SlotTable names={GEAR_NAMES} rows={form.gear} onChange={(rows) => set("gear", rows)} baseline={String(floor)} cap={caps?.gear ?? null} />
          {capNote(caps?.gear)}
          {fillMinimum("gear", "gear", "gear")}
        </Section>

        <Section step={5} title="Skills · Essence" aside={weightChip(rule?.weights.skill)}>
          <SlotTable names={range(8, (i) => `Skill ${i + 1}`)} rows={form.skills} onChange={(rows) => set("skills", rows)} baseline={String(floor)} cap={caps?.skill ?? null} />
          {capNote(caps?.skill)}
          {fillMinimum("skill", "skills", "skills")}
        </Section>

        <Section step={6} title="Fantomons · Treats" aside={weightChip(rule?.weights.fantomon)}>
          <SlotTable names={range(4, (i) => `#${i + 1}`)} rows={form.fantomons} onChange={(rows) => set("fantomons", rows)} baseline={String(floor)} cap={caps?.fantomon ?? null} />
          {capNote(caps?.fantomon)}
          {fillMinimum("fantomon", "fantomons", "Fantomons")}
        </Section>

        <Section step={7} title="Relics · Sand" aside={weightChip(rule?.weights.relic)}>
          <SlotTable names={range(20, (i) => `#${i + 1}`)} rows={form.relics} onChange={(rows) => set("relics", rows)} baseline={String(rule?.relicFloor ?? 0)} cap={caps?.relic ?? null} prefix="+" />
          {capNote(caps?.relic, "+")}
          {fillMinimum("relic", "relics", "relics")}
        </Section>

        <Section step={8} title="Materials">
          <div className="table-wrap flat">
            <table className="input-table">
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col">Have now</th>
                  <th scope="col">Cart / hr</th>
                  <th scope="col">Shop + other / day</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(MATERIAL_LABELS) as Material[]).map((k) => (
                  <tr key={k}>
                    <th scope="row">{MATERIAL_LABELS[k]}</th>
                    {(["have", "cartPerHour", "perDay"] as const).map((col) => (
                      <td key={col}>
                        <input
                          aria-label={`${MATERIAL_LABELS[k]} ${col}`}
                          value={form.income[k][col]}
                          onChange={(e) => set("income", { ...form.income, [k]: { ...form.income[k], [col]: e.target.value } })}
                          placeholder="0"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">
            Sand is counted as White Sand (1 Blue = 5 White, 1 Purple = 25 White). Cart output includes the daily reset boosts.
          </p>
          <Field
            label="Fantomon EXP per treat"
            value={form.expPerTreat}
            onChange={(v) => set("expPerTreat", v)}
            placeholder={String(DEFAULT_EXP_PER_TREAT)}
          />

          <h3 className="subhead">Overworld</h3>
          <p className="hint">
            Stamina refills 140 a day, plus 50 from the daily quest. Big nodes cost 5 stamina and give 10× a regular node (50 a week in total).
          </p>
          <div className="table-wrap flat">
            <table className="input-table">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">Stamina %</th>
                  <th scope="col">Big nodes / wk</th>
                  <th scope="col">Per stamina</th>
                </tr>
              </thead>
              <tbody>
                {(["rola", "ore", "sand"] as const).map((k) => (
                  <tr key={k}>
                    <th scope="row">{MATERIAL_LABELS[k]}</th>
                    <td><input aria-label={`${k} stamina percent`} value={form.staminaSplit[k]} onChange={(e) => set("staminaSplit", { ...form.staminaSplit, [k]: e.target.value })} placeholder="0" /></td>
                    <td><input aria-label={`${k} big nodes per week`} value={form.bigNodes[k]} onChange={(e) => set("bigNodes", { ...form.bigNodes, [k]: e.target.value })} placeholder="0" /></td>
                    <td><input aria-label={`${k} per stamina`} value={form.staminaYield[k]} onChange={(e) => set("staminaYield", { ...form.staminaYield, [k]: e.target.value })} placeholder={staminaDefaults ? String(staminaDefaults[k]) : "?"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!staminaDefaults && <p className="hint">Per-stamina yields are only known for Season 2. Enter what a regular node gives you.</p>}
          <Field label="Dungeon Ore per day" value={form.dungeonOrePerDay} onChange={(v) => set("dungeonOrePerDay", v)} placeholder="0" />

          <h3 className="subhead">Material Realms</h3>
          <p className="hint">
            Enter your normal daily refreshes per Realm (0–10). Each gives 5 entries; the 5 free daily-quest entries per type are added
            automatically.
          </p>
          <div className="table-wrap flat">
            <table className="input-table">
              <thead>
                <tr>
                  <th scope="col"></th>
                  <th scope="col">Refreshes / day</th>
                  <th scope="col">Saved entries</th>
                </tr>
              </thead>
              <tbody>
                {REALM_MATERIALS.map((k) => (
                  <tr key={k}>
                    <th scope="row">{MATERIAL_LABELS[k]} <small>({REALM_TOOLS[k]})</small></th>
                    <td><input aria-label={`${k} refreshes per day`} value={form.refreshes[k]} onChange={(e) => set("refreshes", { ...form.refreshes, [k]: e.target.value })} placeholder="0" /></td>
                    <td><input aria-label={`${k} saved entries`} value={form.savedEntries[k]} onChange={(e) => set("savedEntries", { ...form.savedEntries, [k]: e.target.value })} placeholder="0" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rule && (
            <label className="field">
              <span>Realm rank</span>
              <select value={form.realmTier} onChange={(e) => set("realmTier", e.target.value as PlannerForm["realmTier"])}>
                <option value="auto">Auto ({rule.realmRankName} III)</option>
                {[1, 2, 3].map((tier) => (
                  <option key={tier} value={tier}>
                    {rule.realmRankName} {"I".repeat(tier)}
                  </option>
                ))}
              </select>
              <small>Scoring starts after rank III, so Auto uses III.</small>
            </label>
          )}
        </Section>
      </div>

      <aside className="planner-summary" id="summary">
        <Summary result={result} now={now} />
      </aside>

      {result && (
        <a className="mobile-bar" href="#summary" onClick={(e) => {
          e.preventDefault();
          document.getElementById("summary")?.scrollIntoView({ behavior: "smooth" });
        }}>
          <b>+{result.score.earned.toLocaleString()} Primostars</b>
          {result.character.ok && <span>Lv {result.character.decimalLevel.toFixed(2)}</span>}
          <span>
            {result.realmEntriesNeeded === null ? "Realms ?" : `${result.realmEntriesNeeded.toLocaleString()} Realm runs`}
          </span>
        </a>
      )}
    </div>
  );
}

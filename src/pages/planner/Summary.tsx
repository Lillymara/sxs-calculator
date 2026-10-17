import type { PlannerResult } from "../../lib/planner/plan";
import { formatXpShort } from "../../lib/xp";

const fmt = (x: number) => Math.round(x).toLocaleString();
const short = (x: number) => formatXpShort(Math.round(x));
const when = (d: Date | null, now: Date) =>
  d === null
    ? "not by season end"
    : d <= now
      ? "now"
      : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function Summary({ result, now }: { result: PlannerResult | null; now: Date }) {
  if (!result) {
    return (
      <section className="card results empty">
        <p>Enter your season and character level to see your plan.</p>
      </section>
    );
  }

  const { score, costs, materials, rule } = result;
  const goalSet = score.goal > 0;
  const short_ = -score.difference;

  return (
    <section className="card results" aria-live="polite">
      <p className="eyebrow">Season {rule.season} Primostars</p>
      <p className="big-time">+{fmt(score.earned)}</p>
      <p className="eta">
        {fmt(score.starsFromScore)} from {fmt(score.total)} points + {score.fixedStars} fixed · total {fmt(score.projectedTotal)}
        {score.rating && <> · rating {score.rating}</>}
      </p>
      {goalSet &&
        (score.difference >= 0 ? (
          <p className="note good">Goal of {fmt(score.goal)} reached, with {fmt(score.difference)} to spare.</p>
        ) : (
          <p className="note warn">
            {fmt(short_)} Primostars short of {fmt(score.goal)}. You need about {fmt(short_ * rule.pointsPerStar)} more points.
          </p>
        ))}

      <h3 className="subhead">Score</h3>
      <table>
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">Levels</th>
            <th scope="col">× pts</th>
            <th scope="col">Points</th>
          </tr>
        </thead>
        <tbody>
          {score.categories.map((c) => (
            <tr key={c.key}>
              <th scope="row">{c.label}</th>
              <td>{c.key === "character" ? c.seasonLevels.toFixed(2) : fmt(c.seasonLevels)}</td>
              <td>{c.weight}</td>
              <td>{fmt(c.points)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="subhead">Upgrade costs</h3>
      <dl className="stats two">
        <div><dt>Ore</dt><dd>{short(costs.ore)}</dd></div>
        <div><dt>Rola</dt><dd>{short(costs.rola)}</dd></div>
        <div><dt>Forging stones</dt><dd>{fmt(costs.forgeStones)}</dd></div>
        <div><dt>Essence</dt><dd>{short(costs.essence)}</dd></div>
        <div><dt>Fantomon EXP</dt><dd>{short(costs.fantomonExp)}</dd></div>
        <div>
          <dt>{costs.blueSand ? "Blue Sand" : "Purple Sand"}</dt>
          <dd>{fmt(costs.blueSand || costs.purpleSand)}</dd>
        </div>
      </dl>
      {Object.entries(costs.unknownFrom).some(([, v]) => v !== undefined) && (
        <p className="note warn">
          Some planned levels have no cost data yet (
          {Object.entries(costs.unknownFrom)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k} from ${v}`)
            .join(", ")}
          ). Those steps aren't counted.
        </p>
      )}

      <h3 className="subhead">Materials by season end</h3>
      <div className="table-wrap flat">
        <table>
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">Need</th>
              <th scope="col">Passive</th>
              <th scope="col">Short</th>
              <th scope="col">Realm runs</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.label.replace(" (White eq.)", "")}</th>
                <td>{m.unknownCost ? `${short(m.need)}+?` : short(m.need)}</td>
                <td>{short(m.passive)}</td>
                <td className={m.shortfall > 0 ? "bad" : "ok"}>{m.shortfall > 0 ? short(m.shortfall) : "—"}</td>
                <td>
                  {m.realmEntriesNeeded === null
                    ? m.key === "treats"
                      ? "—"
                      : "?"
                    : m.realmEntriesNeeded > 0
                      ? `${fmt(m.realmEntriesNeeded)}/${fmt(m.entriesAvailable ?? 0)}`
                      : "0"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">Sand is in White Sand. Realm runs: entries you must use / entries you'll have.</p>

      {(() => {
        const shortEntries = materials.filter((m) => m.entriesLeft !== null && m.entriesLeft < 0);
        const treats = materials.find((m) => m.key === "treats");
        return (
          <>
            {result.realmEntriesNeeded === null ? (
              <p className="note warn">Realm yields are unknown for this season, so entry counts can't be worked out.</p>
            ) : result.realmEntriesNeeded === 0 ? (
              <p className="note good">No Material Realm runs needed. Passive income covers the plan.</p>
            ) : (
              <p className={`note ${shortEntries.length ? "warn" : ""}`}>
                Use <b>{fmt(result.realmEntriesNeeded)}</b> Realm entries in total.
                {shortEntries.length > 0 && <> Not enough entries for {shortEntries.map((m) => m.label).join(", ")}.</>}
              </p>
            )}
            {treats && treats.shortfall > 0 && (
              <p className="note warn">{fmt(treats.shortfall)} more treats needed for the Fantomon plan.</p>
            )}
          </>
        );
      })()}

      {materials.some((m) => m.need > 0 && !m.unknownCost) && (
        <>
          <h3 className="subhead">Covered by passive income</h3>
          <ul className="ready-list">
            {materials
              .filter((m) => m.need > 0 && !m.unknownCost)
              .map((m) => (
                <li key={m.key}>
                  <span>{m.label}</span>
                  <span>{when(m.readyAt, now)}</span>
                </li>
              ))}
          </ul>
        </>
      )}

      <dl className="stats two">
        <div><dt>Dawnium / day</dt><dd>{fmt(result.dawniumPerDay)}</dd></div>
        <div><dt>Stamina this season</dt><dd>{fmt(result.stamina)}</dd></div>
      </dl>
    </section>
  );
}

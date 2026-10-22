// Where to spend Dawnium. Advice lives in src/data/dawnium.ts; Realm prices come from the client data.
import { AVOID, GOLD_TIPS, PRIORITIES, REALM_PRESETS } from "../../data/dawnium";
import { DAWNIUM_REFRESH_COSTS, ENTRIES_PER_REFRESH } from "../../data/seasons";
import { usePersistentState } from "../../lib/storage";

const REALMS = [
  ["ore", "Ore"],
  ["rola", "Rola"],
  ["essence", "Essence"],
  ["sand", "Sand"],
] as const;
type Realm = (typeof REALMS)[number][0];

/** Dawnium for the first `n` refreshes of one Realm in a day. */
const costOf = (n: number) => DAWNIUM_REFRESH_COSTS.slice(0, n).reduce((a, b) => a + b, 0);

export function DawniumPage() {
  const [plan, setPlan] = usePersistentState<Record<Realm, number>>("sxs.dawnium", { ore: 2, rola: 2, essence: 2, sand: 2 });
  const perDay = REALMS.reduce((a, [k]) => a + costOf(plan[k]), 0);
  const entries = REALMS.reduce((a, [k]) => a + plan[k] * ENTRIES_PER_REFRESH, 0);
  let running = 0;

  return (
    <div className="tool dawnium">
      <section className="card">
        <h2 className="subhead">Best uses, in order</h2>
        <ol className="dawn-uses">
          {PRIORITIES.map((u, i) => (
            <li key={u.title}>
              <span className="dawn-rank" aria-hidden>{i + 1}</span>
              <div>
                <div className="dawn-title">
                  <h3>{u.title}</h3>
                  <span className="chip">{u.cost}</span>
                </div>
                <p className="deal-verdict">{u.advice}</p>
                <ul>
                  {u.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
                {u.link && <p className="hint deal-link"><a href={u.link.href}>{u.link.label} →</a></p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="tool-grid dawn-grid">
        <section className="card">
          <h2 className="subhead">Realm refresh prices</h2>
          <p className="hint">Each Realm can be refreshed up to 10 times a day, for {ENTRIES_PER_REFRESH} entries each. The price climbs with every refresh.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Refresh</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Per entry</th>
                  <th scope="col">Day total</th>
                </tr>
              </thead>
              <tbody>
                {DAWNIUM_REFRESH_COSTS.map((c, i) => {
                  running += c;
                  const per = c / ENTRIES_PER_REFRESH;
                  return (
                    <tr key={i} className={per <= 12 ? "dawn-cheap" : per >= 50 ? "rough" : undefined}>
                      <td>#{i + 1}</td>
                      <td>{c}</td>
                      <td>{per}</td>
                      <td>{running.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="hint">Day total is for one Realm. Highlighted rows are the best value.</p>
        </section>

        <section className="card">
          <h2 className="subhead">Your daily refreshes</h2>
          <div className="filter-row" role="group" aria-label="Presets">
            {REALM_PRESETS.map((p) => {
              const on = REALMS.every(([k]) => plan[k] === p.plan[k]);
              return (
                <button key={p.label} type="button" aria-pressed={on} onClick={() => setPlan({ ...p.plan })}>
                  {p.label} · {REALMS.map(([k]) => p.plan[k]).join("/")}
                </button>
              );
            })}
          </div>
          <div className="fields">
            {REALMS.map(([k, label]) => (
              <label key={k} className="field">
                <span>{label} Realm</span>
                <select value={plan[k]} onChange={(e) => setPlan((p) => ({ ...p, [k]: +e.target.value }))}>
                  {Array.from({ length: 11 }, (_, n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "None" : `${n} refresh${n > 1 ? "es" : ""} · ${costOf(n)}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <dl className="stats compact">
            <div><dt>Dawnium / day</dt><dd>{perDay.toLocaleString()}</dd></div>
            <div><dt>Per week</dt><dd>{(perDay * 7).toLocaleString()}</dd></div>
            <div><dt>Extra entries / day</dt><dd>{entries}</dd></div>
          </dl>
          <p className="hint">On top of the 5 free entries per Realm from the daily quest.</p>
        </section>
      </div>

      <div className="tool-grid dawn-grid">
        <section className="card">
          <h2 className="subhead">Gold tips</h2>
          <ul className="buy-check">
            {GOLD_TIPS.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </section>
        <section className="card">
          <h2 className="subhead">Don't spend it on</h2>
          <ul className="buy-check">
            {AVOID.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </section>
      </div>
      <p className="hint spending-fine-print">Advice, not official. Costs other than the Realm prices can change, so check in game.</p>
    </div>
  );
}

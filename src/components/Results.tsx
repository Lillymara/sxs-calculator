import type { CalcOutcome } from "../lib/xp";
import { formatDuration, formatEta, formatXpShort } from "../lib/xp";
import type { Character } from "./CharacterForm";

interface Props {
  character: Character;
  outcome: CalcOutcome | undefined;
  now: Date;
}

const fmt = (n: number) => Math.ceil(n).toLocaleString();

/** Your XP rate keeps climbing as you level, so estimates past this many levels drift badly. */
const RELIABLE_LEVELS = 5;

export function Results({ character, outcome, now }: Props) {
  if (!outcome) {
    return (
      <section className="card results empty" aria-live="polite">
        <p>Fill in your level and XP rate to see your next level-up time.</p>
      </section>
    );
  }

  if (!outcome.ok) {
    return (
      <section className="card results" aria-live="polite">
        <p className="error" role="alert">{outcome.error}</p>
      </section>
    );
  }

  const r = outcome.result;
  const pct = Math.min(100, r.progress * 100);

  return (
    <section className="card results" aria-live="polite">
      <p className="eyebrow">{character.name ? `${character.name} → ` : ""}Level {r.nextLevel}</p>
      <p className="big-time">{formatDuration(r.hoursToNext)}</p>
      <p className="eta">Around {formatEta(r.hoursToNext, now)}</p>

      <div className="bar" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <dl className="stats">
        <div>
          <dt>Progress</dt>
          <dd>{pct.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>XP to go</dt>
          <dd title={fmt(r.xpRemaining)}>{formatXpShort(r.xpRemaining)}</dd>
        </div>
        <div>
          <dt>Level needs</dt>
          <dd title={fmt(r.xpRequired)}>{formatXpShort(r.xpRequired)}</dd>
        </div>
      </dl>

      {r.goal && (
        <div className="goal">
          <h3>
            Level {r.goal.level}: {formatDuration(r.goal.hours)}
          </h3>
          <p className="eta">
            {formatXpShort(r.goal.xpRemaining)} XP · around {formatEta(r.goal.hours, now)}
          </p>
          <p className="note">
            Your XP rate keeps climbing as you level, so only the next 2–{RELIABLE_LEVELS} levels are
            close to accurate. Anything further out will likely come sooner than shown.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">XP</th>
                  <th scope="col">Time</th>
                  <th scope="col">Reached</th>
                </tr>
              </thead>
              <tbody>
                {r.goal.steps.map((s, i) => (
                  <tr key={s.level} className={i >= RELIABLE_LEVELS ? "rough" : undefined}>
                    <td>{s.level}</td>
                    <td title={fmt(s.xpRemaining)}>{formatXpShort(s.xpRemaining)}</td>
                    <td>{formatDuration(s.hours)}</td>
                    <td>{formatEta(s.cumulativeHours, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

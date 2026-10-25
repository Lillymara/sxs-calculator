import type { SeasonTable } from "../lib/xp";
import { seasons } from "../lib/xp";

export interface Character {
  name: string;
  season: string;
  level: string;
  progressMode: "xp" | "percent";
  currentXp: string;
  percent: string;
  rate: string;
  goalLevel: string;
  /** Count the free daily bed boost (2 hours of EXP) in the Level Timer. */
  bedBoost?: boolean;
  /** Whether today's bed boost is still unused (counts it now). Defaults to true. */
  bedToday?: boolean;
  /** Temporal Crystals to use now, 2 hours of EXP each. */
  crystals?: string;
}

interface Props {
  character: Character;
  onChange: (character: Character) => void;
  onReset: () => void;
  table: SeasonTable | undefined;
  /** Hide the name and goal-level fields (used inside the Season Planner). */
  compact?: boolean;
}

export function CharacterForm({ character, onChange, onReset, table, compact }: Props) {
  const set = <K extends keyof Character>(key: K, value: Character[K]) =>
    onChange({ ...character, [key]: value });

  return (
    <section className={compact ? undefined : "card"} aria-labelledby={compact ? undefined : "form-heading"}>
      {!compact && (
        <div className="card-head">
          <h2 id="form-heading">Your character</h2>
          <button type="button" className="link-button" onClick={onReset}>
            Clear
          </button>
        </div>
      )}

      <form className="fields" onSubmit={(e) => e.preventDefault()}>
        {!compact && (
          <label className="field span-2">
            <span>Name <em>(optional)</em></span>
            <input
              value={character.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Character name"
              maxLength={40}
            />
          </label>
        )}

        <label className="field">
          <span>Season</span>
          <select value={character.season} onChange={(e) => set("season", e.target.value)}>
            {seasons.map((s) => (
              <option key={s.season} value={s.season}>
                Season {s.season}
              </option>
            ))}
          </select>
          {table && (
            <small>
              Levels {table.minLevel}–{table.maxLevel}
            </small>
          )}
        </label>

        <label className="field">
          <span>Current level</span>
          <input
            inputMode="numeric"
            value={character.level}
            onChange={(e) => set("level", e.target.value)}
            placeholder={table ? String(table.minLevel) : ""}
          />
        </label>

        <fieldset className="field span-2">
          <legend>Progress toward next level</legend>
          <div className="with-toggle">
            {character.progressMode === "xp" ? (
              <input
                inputMode="text"
                aria-label="Current XP"
                value={character.currentXp}
                onChange={(e) => set("currentXp", e.target.value)}
                placeholder="As shown in game, e.g. 4.13k or 1.52B"
              />
            ) : (
              <input
                inputMode="decimal"
                aria-label="Percent complete"
                value={character.percent}
                onChange={(e) => set("percent", e.target.value)}
                placeholder="Percent of the bar, e.g. 42.5"
              />
            )}
            <div className="segmented" role="group" aria-label="Progress unit">
              <button
                type="button"
                aria-pressed={character.progressMode === "xp"}
                onClick={() => set("progressMode", "xp")}
              >
                XP
              </button>
              <button
                type="button"
                aria-pressed={character.progressMode === "percent"}
                onClick={() => set("progressMode", "percent")}
              >
                %
              </button>
            </div>
          </div>
        </fieldset>

        <label className="field span-2">
          <span>XP per hour</span>
          <input
            inputMode="text"
            value={character.rate}
            onChange={(e) => set("rate", e.target.value)}
            placeholder="e.g. 150M"
          />
          <small>Check the bed in your house for your current rate.</small>
        </label>

        {!compact && (
          <fieldset className="field span-2 boosts">
            <legend>Boosts <em>(optional)</em></legend>
            <label className="check boost-row">
              <input type="checkbox" checked={!!character.bedBoost} onChange={(e) => set("bedBoost", e.target.checked)} />
              <span className="boost-icon" aria-hidden>🛏️</span>
              <span>
                Use my free daily bed boost
                <small>2 hours of EXP once a day, after each daily reset.</small>
              </span>
            </label>
            {character.bedBoost && (
              <label className="check boost-sub">
                <input type="checkbox" checked={character.bedToday !== false} onChange={(e) => set("bedToday", e.target.checked)} />
                <span>
                  Include today's boost
                  <small>Untick if you've already used it today.</small>
                </span>
              </label>
            )}
            <label className="boost-row crystals">
              <img src={`${import.meta.env.BASE_URL}art/items/item_120.png`} alt="" className="boost-icon" />
              <span>
                Temporal Crystals to use
                <small>Each grants 2 hours of EXP instantly.</small>
              </span>
              <input
                inputMode="numeric"
                aria-label="Temporal Crystals to use"
                value={character.crystals ?? ""}
                onChange={(e) => set("crystals", e.target.value)}
                placeholder="0"
              />
            </label>
          </fieldset>
        )}

        {!compact && (
          <label className="field span-2">
            <span>Goal level <em>(optional)</em></span>
            <input
              inputMode="numeric"
              value={character.goalLevel}
              onChange={(e) => set("goalLevel", e.target.value)}
              placeholder="e.g. 205"
            />
            <small>Rough guide only: estimates more than a few levels out run long.</small>
          </label>
        )}
      </form>
    </section>
  );
}

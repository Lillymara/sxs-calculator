import { useState } from "react";
import type { SlotForm } from "./form";

interface Props {
  names: string[];
  rows: SlotForm[];
  onChange: (rows: SlotForm[]) => void;
  /** Shown as placeholders: the season baseline, e.g. "130" or "+13". */
  baseline: string;
  /** Highest planned level the character can reach; null when there is no known cap. */
  cap: number | null;
  prefix?: string;
  /** Inputs that can't happen in the game, as "index:current" / "index:planned". */
  invalid?: Set<string>;
}

/** Current → planned levels for a group of slots, with "set all" shortcuts. */
export function SlotTable({ names, rows, onChange, baseline, cap, prefix = "", invalid }: Props) {
  const [allCurrent, setAllCurrent] = useState("");
  const [allPlanned, setAllPlanned] = useState("");

  const update = (i: number, key: keyof SlotForm, value: string) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  const setAll = (key: keyof SlotForm, value: string) => onChange(rows.map((r) => ({ ...r, [key]: value })));

  return (
    <div className="slots">
      <div className="slot-all">
        <span>All</span>
        <div className="inline-set">
          <input aria-label="Set every current level" value={allCurrent} onChange={(e) => setAllCurrent(e.target.value)} placeholder={baseline} />
          <button type="button" onClick={() => setAll("current", allCurrent)}>Set</button>
        </div>
        <span aria-hidden>→</span>
        <div className="inline-set">
          <input aria-label="Set every planned level" value={allPlanned} onChange={(e) => setAllPlanned(e.target.value)} placeholder={baseline} />
          <button type="button" onClick={() => setAll("planned", allPlanned)}>Set</button>
        </div>
      </div>
      <div className="slot-grid">
        {rows.map((r, i) => {
          const over = cap !== null && r.planned !== "" && Number(r.planned.replace(/^\+/, "")) > cap;
          const badCurrent = invalid?.has(`${i}:current`);
          const badPlanned = invalid?.has(`${i}:planned`);
          return (
            <div className="slot-row" key={i}>
              <span>{names[i]}</span>
              <input aria-label={`${names[i]} current`} aria-invalid={badCurrent || undefined} className={badCurrent ? "silly" : undefined} value={r.current} onChange={(e) => update(i, "current", e.target.value)} placeholder={`${prefix}${baseline}`} />
              <span aria-hidden>→</span>
              <input
                aria-label={`${names[i]} planned`}
                aria-invalid={over || badPlanned || undefined}
                className={badPlanned ? "silly" : over ? "over-cap" : undefined}
                value={r.planned}
                onChange={(e) => update(i, "planned", e.target.value)}
                placeholder="same"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

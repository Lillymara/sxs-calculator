// Daily and weekly checklist. Ticks clear themselves at the game's resets.
import { useState } from "react";
import { usePersistentState } from "../../lib/storage";
import { countdown, lastDailyReset, lastWeeklyReset, nextDailyReset, nextWeeklyReset } from "../../lib/resets";
import type { ToolProps } from "./props";

type Period = "daily" | "weekly";

interface Task {
  id: string;
  label: string;
  note?: string;
  period: Period;
}

/** Starting tasks. Players can hide any of them and add their own. */
const DEFAULT_TASKS: Task[] = [
  { id: "afk", period: "daily", label: "Claim AFK rewards", note: "They stop filling once capped, so twice a day is safest." },
  { id: "daily-quest", period: "daily", label: "Finish the daily quest", note: "+50 stamina and 5 free entries for each Material Realm." },
  { id: "realms", period: "daily", label: "Use your free Material Realm entries", note: "Ore, Rola, Essence and Sand." },
  { id: "stamina", period: "daily", label: "Spend stamina on overworld nodes", note: "It refills 140 a day. Don't let it sit at the cap." },
  { id: "dungeons", period: "daily", label: "Run dungeons", note: "2 free runs a day. Unused runs bank up to 6." },
  { id: "shop", period: "daily", label: "Check the shop", note: "Buy the discounted items you actually use." },
  { id: "monthly-card", period: "daily", label: "Claim Monthly Card Dawnium", note: "Only if you have the card. Hide this if you don't." },
  { id: "arena", period: "weekly", label: "Arena: use your saved tickets", note: "Early in the week, while ranks are easiest to climb." },
  { id: "big-nodes", period: "weekly", label: "Clear the big overworld nodes", note: "50 a week across Rola, Ore and Sand, worth 10 regular nodes each." },
  { id: "weekly-event", period: "weekly", label: "Weekly event", note: "Grand Treasure Hunt plus this week's Bingo, Scratch or Fennec's Riddle." },
];

interface ChecklistState {
  /** Task id → the reset (ISO time) it was ticked after. A tick only counts for that period. */
  done: Record<string, string>;
  hidden: string[];
  custom: Task[];
  /** UTC weekday of the weekly reset, 0 = Sunday. */
  weekday: number;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ChecklistPage({ now }: ToolProps) {
  const [state, setState] = usePersistentState<ChecklistState>("sxs.checklist", { done: {}, hidden: [], custom: [], weekday: 1 });
  const [draft, setDraft] = useState<{ label: string; period: Period }>({ label: "", period: "daily" });

  const periodKey: Record<Period, string> = {
    daily: lastDailyReset(now).toISOString(),
    weekly: lastWeeklyReset(now, state.weekday).toISOString(),
  };
  const tasks = [...DEFAULT_TASKS, ...state.custom];
  const visible = tasks.filter((t) => !state.hidden.includes(t.id));
  const hidden = tasks.filter((t) => state.hidden.includes(t.id));
  const isDone = (t: Task) => state.done[t.id] === periodKey[t.period];

  const toggle = (t: Task) =>
    setState((s) => {
      const done = { ...s.done };
      if (done[t.id] === periodKey[t.period]) delete done[t.id];
      else done[t.id] = periodKey[t.period];
      return { ...s, done };
    });
  const hide = (t: Task) => setState((s) => ({ ...s, hidden: [...s.hidden, t.id] }));
  const remove = (t: Task) => setState((s) => ({ ...s, custom: s.custom.filter((c) => c.id !== t.id) }));
  const add = () => {
    const label = draft.label.trim();
    if (!label) return;
    setState((s) => ({ ...s, custom: [...s.custom, { id: `custom-${Date.now()}`, label, period: draft.period }] }));
    setDraft({ ...draft, label: "" });
  };

  const section = (period: Period, title: string, resetsIn: string) => {
    const list = visible.filter((t) => t.period === period);
    const count = list.filter(isDone).length;
    const pct = list.length ? (count / list.length) * 100 : 0;
    return (
      <section className="card checklist">
        <div className="checklist-head">
          <h2>{title}</h2>
          <span className="chip">{count} / {list.length}</span>
        </div>
        <p className="hint">Resets in {resetsIn}</p>
        <div className="bar" role="progressbar" aria-label={`${title} progress`} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        {list.length === 0 && <p className="hint">Nothing here. Add a task below or restore a hidden one.</p>}
        <ul className="task-list">
          {list.map((t) => (
            <li key={t.id} className={isDone(t) ? "done" : undefined}>
              <label className="check">
                <input type="checkbox" checked={isDone(t)} onChange={() => toggle(t)} />
                <span>
                  {t.label}
                  {t.note && <small>{t.note}</small>}
                </span>
              </label>
              {t.id.startsWith("custom-") ? (
                <button type="button" className="task-x" onClick={() => remove(t)} aria-label={`Delete ${t.label}`} title="Delete">×</button>
              ) : (
                <button type="button" className="task-x" onClick={() => hide(t)} aria-label={`Hide ${t.label}`} title="Hide">×</button>
              )}
            </li>
          ))}
        </ul>
        {count === list.length && list.length > 0 && <p className="note good">All done. Nice work! 🎉</p>}
      </section>
    );
  };

  return (
    <div className="tool">
      <div className="tool-grid checklist-grid">
        {section("daily", "Today", countdown(now, nextDailyReset(now)))}
        {section("weekly", "This week", countdown(now, nextWeeklyReset(now, state.weekday)))}
      </div>

      <section className="card">
        <h2 className="subhead">Your list</h2>
        <form
          className="add-task"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <label className="field">
            <span>Add a task</span>
            <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Feed Fantomons" maxLength={80} />
          </label>
          <label className="field">
            <span>Repeats</span>
            <select value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value as Period })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <button type="submit" className="secondary" disabled={!draft.label.trim()}>Add</button>
        </form>

        <label className="field weekday">
          <span>Weekly reset</span>
          <select value={state.weekday} onChange={(e) => setState((s) => ({ ...s, weekday: +e.target.value }))}>
            {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
          <small>At the 13:00 UTC daily reset. Change it if your server's week turns over on another day.</small>
        </label>

        {hidden.length > 0 && (
          <div className="hidden-tasks">
            <p className="hint">Hidden tasks:</p>
            <div className="chips">
              {hidden.map((t) => (
                <button key={t.id} type="button" className="reward" onClick={() => setState((s) => ({ ...s, hidden: s.hidden.filter((h) => h !== t.id) }))}>
                  + {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="hint">Ticks clear themselves at the 13:00 UTC reset (your local time: {lastDailyReset(now).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}). Everything is saved in this browser.</p>
      </section>
    </div>
  );
}

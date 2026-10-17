import { useMemo, useState } from "react";
import type { EventType } from "../../data/calendar";
import { SERVERS, ServerSearch } from "../../components/ServerSearch";
import { buildEntries, dungeonDifficulties, seasonStatus, type Entry } from "../../lib/calendar";
import { effectiveDay1, type ServerChoice } from "./server";


const FILTERS: { id: EventType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "season", label: "Seasons" },
  { id: "dungeon", label: "Dungeons" },
  { id: "feature", label: "Unlocks" },
  { id: "weekly", label: "Weekly" },
  { id: "global", label: "Global events" },
];
const ICONS: Record<EventType, string> = { season: "🏁", dungeon: "⚔️", weekly: "🎁", feature: "✦", global: "✨" };

interface Props {
  choice: ServerChoice;
  onChange: (c: ServerChoice) => void;
  now: Date;
}

function zones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];
  }
}
const deviceZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

export function CalendarPage({ choice, onChange, now }: Props) {
  const [filter, setFilter] = useState<EventType | "all">("all");
  const [full, setFull] = useState(false);
  const tz = choice.timezone || deviceZone();

  const server = SERVERS.find((s) => s.id === choice.serverId) ?? null;
  const day1 = effectiveDay1(choice);
  const status = day1 ? seasonStatus(day1, now) : null;
  const day1Time = day1?.getTime();
  const entries = useMemo(() => (day1Time !== undefined ? buildEntries(new Date(day1Time), server) : []), [day1Time, server]);

  const fmtDate = (d: Date, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric", year: "numeric" }) =>
    new Intl.DateTimeFormat(undefined, { timeZone: tz, ...opts }).format(d);
  const dateKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const resetLocal = new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13)),
  );
  const daysUntil = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
  const relative = (days: number) => (days <= 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`);

  // Timeline: group by local date, limited to a week back and 100 days ahead unless "full".
  const today = status?.day ?? 0;
  const visible = entries.filter(
    (e) => (filter === "all" || e.type === filter) && (full || (e.serverDay >= today - 7 && e.serverDay <= today + 100)),
  );
  const groups = new Map<string, { date: Date; day: number; events: Entry[] }>();
  for (const e of visible) {
    const key = dateKey(e.date);
    if (!groups.has(key)) groups.set(key, { date: e.date, day: e.serverDay, events: [] });
    groups.get(key)!.events.push(e);
  }
  const todayKey = dateKey(now);
  // Always mark today so the timeline has an anchor, even with no events.
  if (status && status.day > 0 && !groups.has(todayKey)) groups.set(todayKey, { date: now, day: status.day, events: [] });
  const ordered = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const next = entries.find((e) => e.date.getTime() >= now.getTime() - 3_600_000);

  return (
    <div className="calendar">
      <section className="card" aria-labelledby="server-heading">
        <div className="card-head">
          <h2 id="server-heading">Your server</h2>
          {server && <span className="chip">Nexus {server.nexus} · #{server.number}</span>}
        </div>
        <div className="fields">
          <ServerSearch choice={choice} onChange={onChange} className="span-2" />

          <label className="field">
            <span>Day 1 (opening date)</span>
            <input
              type="date"
              value={choice.day1}
              onChange={(e) => onChange({ ...choice, day1: e.target.value, serverId: server && e.target.value === server.opened ? server.id : "", name: server && e.target.value === server.opened ? server.name : choice.name })}
            />
            <small>{server ? (server.opened ? "From the roster." : "Not in the roster; enter it yourself.") : "Custom date."}</small>
          </label>

          <div className="field">
            <span>Adjust Day 1</span>
            <div className="stepper">
              <button type="button" onClick={() => onChange({ ...choice, offset: Math.max(-30, choice.offset - 1) })} aria-label="One day earlier">−</button>
              <output>{choice.offset === 0 ? "0 days" : `${choice.offset > 0 ? "+" : ""}${choice.offset} day${Math.abs(choice.offset) === 1 ? "" : "s"}`}</output>
              <button type="button" onClick={() => onChange({ ...choice, offset: Math.min(30, choice.offset + 1) })} aria-label="One day later">+</button>
            </div>
            <small>Use this if your in-game server day doesn't match.</small>
          </div>

          <label className="field span-2">
            <span>Timezone</span>
            <select value={choice.timezone} onChange={(e) => onChange({ ...choice, timezone: e.target.value })}>
              <option value="">Device timezone ({deviceZone()})</option>
              {zones().map((z) => (
                <option key={z} value={z}>{z.replaceAll("_", " ")}</option>
              ))}
            </select>
            <small>Daily reset is 13:00 UTC ({resetLocal}).</small>
          </label>
        </div>
      </section>

      {status && day1 ? (
        <>
          <section className="status-grid" aria-label="Server status">
            <div className="card tile">
              <p className="eyebrow">{choice.name || "Your server"}</p>
              <p className="tile-big">{status.day > 0 ? `Day ${status.day}` : "Not open"}</p>
              <p className="eta">Day 1: {fmtDate(day1, { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <div className="card tile">
              <p className="eyebrow">Season</p>
              <p className="tile-big">S{status.season.number}</p>
              <p className="eta">{status.season.name} · day {status.dayOfSeason}</p>
            </div>
            <div className="card tile">
              <p className="eyebrow">Season ends</p>
              <p className="tile-big small">{status.seasonEnds ? fmtDate(status.seasonEnds, { month: "short", day: "numeric" }) : "Not confirmed"}</p>
              <p className="eta">
                {status.seasonEnds && status.nextSeason
                  ? `S${status.nextSeason.number} starts ${relative(daysUntil(status.seasonEnds))} at reset`
                  : "No later season date yet"}
              </p>
            </div>
            <div className="card tile">
              <p className="eyebrow">Next up</p>
              <p className="tile-big small">{next ? relative(daysUntil(next.date)).replace(/^./, (c) => c.toUpperCase()) : "—"}</p>
              <p className="eta">{next ? `Day ${next.serverDay} · ${next.title}` : ""}</p>
            </div>
          </section>

          <section className="card">
            <div className="card-head wrap">
              <h2>Timeline</h2>
              <div className="filter-row" role="group" aria-label="Filter events">
                {FILTERS.map((f) => (
                  <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                    {f.label}
                  </button>
                ))}
                <button type="button" className="range" aria-pressed={full} onClick={() => setFull(!full)}>
                  {full ? "Full timeline" : "Week back · 100 days ahead"}
                </button>
              </div>
            </div>

            {groups.size === 0 ? (
              <p className="hint">No events match this filter and range.</p>
            ) : (
              <ol className="timeline">
                {ordered.map(([key, g]) => (
                  <li key={key} className={key === todayKey ? "today" : key < todayKey ? "past" : undefined}>
                    <h3>
                      <span>Day {g.day}</span> {fmtDate(g.date)}
                      {key === todayKey && <em>Today</em>}
                    </h3>
                    {g.events.length === 0 && <p className="event-meta">No events today.</p>}
                    {g.events.map((e, i) => (
                      <EventCard key={i} e={e} serverName={choice.name} fmtDate={fmtDate} />
                    ))}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      ) : (
        <section className="card results empty">
          <p>Find your server or enter its Day 1 date to build its calendar.</p>
        </section>
      )}
    </div>
  );
}

function EventCard({ e, serverName, fmtDate }: { e: Entry; serverName: string; fmtDate: (d: Date, o?: Intl.DateTimeFormatOptions) => string }) {
  const difficulties = e.type === "dungeon" ? dungeonDifficulties(e.meta) : [];
  const meta = e.type === "dungeon" ? `Dungeon release · ${difficulties.length} difficult${difficulties.length === 1 ? "y" : "ies"}` : e.meta;
  const tag = e.major ? "Major" : e.tag ?? { season: "Season", dungeon: "Dungeon", feature: "Unlock", weekly: "Weekly", global: "Global" }[e.type];
  return (
    <article className={`event event-${e.type}${e.major ? " major" : ""}`}>
      <header>
        <span className="event-icon" aria-hidden>{ICONS[e.type]}</span>
        <div>
          <p className="event-tag">{tag}</p>
          <p className="event-title">{e.title}</p>
          <p className="event-meta">
            {meta}
            {e.end && <> · through {fmtDate(e.end, { month: "short", day: "numeric" })}</>}
          </p>
        </div>
      </header>
      {e.mergeServers?.length ? (
        <div className="event-body">
          <p className="event-label">Joining Nexus {e.nexus}{serverName ? ` with ${serverName}` : ""}</p>
          <div className="chips">{e.mergeServers.map((s) => <span key={s} className="reward">{s}</span>)}</div>
        </div>
      ) : difficulties.length ? (
        <div className="event-body">
          <dl className="difficulties">
            {difficulties.map((d) => (
              <div key={d.name}>
                <dt>{d.name}</dt>
                <dd>{d.requirement}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : e.rewards?.length ? (
        <div className="event-body">
          <p className="event-label">{e.rewardLabel ?? "Rewards"}</p>
          <div className="chips">
            {e.rewards.map((r) => {
              const m = /^(.*?)\s((?:×|≈).*)$/.exec(r);
              return (
                <span key={r} className="reward">
                  {m ? <>{m[1]} <b>{m[2]}</b></> : <b>{r}</b>}
                </span>
              );
            })}
          </div>
          {e.tasks?.length ? <div className="chips tasks">{e.tasks.map((t) => <span key={t}>{t}</span>)}</div> : null}
          {e.note && <p className="event-meta">{e.note}</p>}
        </div>
      ) : null}
    </article>
  );
}

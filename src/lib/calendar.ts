// Server calendar math.
import {
  CALENDAR_SEASONS,
  GLOBAL_EVENTS,
  MILESTONES,
  RESET_UTC_HOUR,
  publicServerDay,
  weeklyEvents,
  type CalendarEvent,
  type EventType,
} from "../data/calendar";

const DAY = 86_400_000;

export interface Server {
  id: string;
  name: string;
  /** Public opening date (YYYY-MM-DD) = Calendar Day 1, or "" if unknown. */
  opened: string;
  nexus: string;
  number: number;
  /** Servers that join this one's Nexus at the start of Season 1, 2, 3, 4+. */
  merges: string[][];
}

type ServerRow = [string, string, string, number, string[][]];

export function loadServers(rows: ServerRow[]): Server[] {
  return rows.map(([name, opened, nexus, number, merges]) => ({ id: `${nexus}-${number}`, name, opened, nexus, number, merges }));
}

/** A YYYY-MM-DD date at the 13:00 UTC reset, or null if invalid. */
export function parseDay(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d, RESET_UTC_HOUR));
  return date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null;
}

export const dayDate = (day1: Date, day: number) => new Date(day1.getTime() + (day - 1) * DAY);
export const serverDayAt = (day1: Date, at: Date) => Math.floor((at.getTime() - day1.getTime()) / DAY) + 1;

export function seasonForDay(day: number) {
  let found = CALENDAR_SEASONS[0];
  for (const s of CALENDAR_SEASONS) if (day >= s.start) found = s;
  return found;
}

export interface SeasonStatus {
  day: number;
  season: (typeof CALENDAR_SEASONS)[number];
  dayOfSeason: number;
  /** When the next season starts (the current one ends), if known. */
  seasonEnds: Date | null;
  nextSeason: (typeof CALENDAR_SEASONS)[number] | null;
}

export function seasonStatus(day1: Date, now: Date): SeasonStatus {
  const day = serverDayAt(day1, now);
  const season = seasonForDay(Math.max(1, day));
  const nextSeason = CALENDAR_SEASONS.find((s) => s.start > day) ?? null;
  return {
    day,
    season,
    dayOfSeason: day - season.start + 1,
    seasonEnds: nextSeason ? dayDate(day1, nextSeason.start) : null,
    nextSeason,
  };
}

export interface Entry extends Omit<CalendarEvent, "day"> {
  date: Date;
  /** Last day shown for multi-day events. */
  end: Date | null;
  serverDay: number;
  mergeServers?: string[];
  nexus?: string;
}

const RELATIVE_EVENTS = [...MILESTONES, ...weeklyEvents()]
  .map((e) => ({ ...e, day: publicServerDay(e.day) }))
  .sort((a, b) => a.day - b.day);

const PRIORITY: Record<EventType, number> = { season: 0, global: 1, dungeon: 2, feature: 3, weekly: 4 };

export function buildEntries(day1: Date, server: Server | null): Entry[] {
  const entries: Entry[] = RELATIVE_EVENTS.map((e) => {
    const date = dayDate(day1, e.day);
    const entry: Entry = { ...e, date, end: e.durationHours ? new Date(date.getTime() + e.durationHours * 3_600_000) : null, serverDay: e.day };
    if (e.type === "season" && server) {
      const n = Number(/Season\s+(\d+)/i.exec(e.title)?.[1] ?? 0);
      const joins = server.merges[Math.min(n, 4) - 1] ?? [];
      if (joins.length) {
        entry.mergeServers = joins;
        entry.nexus = server.nexus;
      }
    }
    return entry;
  });
  for (const g of GLOBAL_EVENTS) {
    const date = parseDay(g.date)!;
    entries.push({ ...g, date, end: parseDay(g.end), serverDay: serverDayAt(day1, date) });
  }
  return entries.sort((a, b) => a.date.getTime() - b.date.getTime() || PRIORITY[a.type] - PRIORITY[b.type] || a.title.localeCompare(b.title));
}

/** Splits "Normal 3.55M + Lv130 · Hard 5M" into difficulty requirements. */
export function dungeonDifficulties(meta = ""): { name: string; requirement: string }[] {
  return meta
    .split("·")
    .map((part) => /^(Normal|Hard|Nightmare|Purgatory|Abyss)\s*(.*)$/i.exec(part.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => {
      let requirement = m[2].replace(/^\(|\)$/g, "").trim() || "Opens this day";
      const compact = /^([\d.]+[KMB])(?:\s*(?:Power)?)?(?:\s*\+\s*Lv\s*(\d+))?$/i.exec(requirement);
      if (compact) requirement = `${compact[1]} Power${compact[2] ? ` · Lv ${compact[2]}` : ""}`;
      return { name: m[1], requirement };
    });
}

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const hold = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = hold;
    }
  }
  return row[b.length];
}

/** Server names matching a typed query, tolerating small typos. */
export function searchServers(servers: Server[], query: string, limit = 8): Server[] {
  const q = normalize(query);
  if (!q) return [];
  const score = (s: Server) => {
    const name = normalize(s.name);
    if (name.startsWith(q)) return 0;
    const inside = name.indexOf(q);
    if (inside >= 0) return 10 + inside;
    const tolerance = Math.max(1, Math.floor(q.length / 4));
    let d = editDistance(q, name);
    for (const part of name.split(" ")) d = Math.min(d, editDistance(q, part.slice(0, q.length + 1)));
    return d <= tolerance ? 30 + d : Infinity;
  };
  return servers
    .map((s) => ({ s, score: score(s) }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => a.score - b.score || a.s.name.localeCompare(b.s.name))
    .slice(0, limit)
    .map((x) => x.s);
}

// Daily and weekly reset boundaries for the checklist. The game resets at 13:00 UTC.
import { RESET_UTC_HOUR } from "../data/calendar";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The most recent daily reset at or before `now`. */
export function lastDailyReset(now: Date): Date {
  const r = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), RESET_UTC_HOUR));
  return r.getTime() > now.getTime() ? new Date(r.getTime() - DAY) : r;
}

export const nextDailyReset = (now: Date) => new Date(lastDailyReset(now).getTime() + DAY);

/** The most recent weekly reset: the daily reset on `weekday` (0 = Sunday, UTC). */
export function lastWeeklyReset(now: Date, weekday: number): Date {
  const daily = lastDailyReset(now);
  const back = (daily.getUTCDay() - weekday + 7) % 7;
  return new Date(daily.getTime() - back * DAY);
}

export const nextWeeklyReset = (now: Date, weekday: number) => new Date(lastWeeklyReset(now, weekday).getTime() + 7 * DAY);

/** "5h 12m" / "2d 4h" until `then`. */
export function countdown(now: Date, then: Date): string {
  const mins = Math.max(0, Math.ceil((then.getTime() - now.getTime()) / 60_000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

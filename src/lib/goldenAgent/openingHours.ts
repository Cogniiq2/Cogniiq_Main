// Golden Agent — opening hours resolution from configuration.
//
// Pure functions over ClientConfig. "Open today?" and "when are you open?" are answered from
// configured data; they never guess and never derive availability (a location being open does not
// mean a slot is free — that is get_available_slots' job).

import type { ClientLocation, SpecialClosure, TimeRange, Weekday } from './clientConfig.ts';
import { WEEKDAYS } from './clientConfig.ts';

export interface DayHours {
  date: string;
  open: boolean;
  ranges: TimeRange[];
  closureReason?: string;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function weekdayOf(isoDate: string): Weekday {
  const match = ISO_DATE.exec(isoDate);
  if (!match) throw new Error(`Invalid ISO date: ${isoDate}`);
  const day = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))).getUTCDay();
  // JS: 0 = Sunday. Our week starts on Monday.
  return WEEKDAYS[(day + 6) % 7];
}

export function addDays(isoDate: string, days: number): string {
  const match = ISO_DATE.exec(isoDate);
  if (!match) throw new Error(`Invalid ISO date: ${isoDate}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  return date.toISOString().slice(0, 10);
}

function closureFor(location: ClientLocation, isoDate: string): SpecialClosure | undefined {
  return (location.specialClosures ?? []).find((closure) => {
    const to = closure.to ?? closure.from;
    return closure.from <= isoDate && isoDate <= to;
  });
}

export function hoursForDate(location: ClientLocation, isoDate: string): DayHours {
  const closure = closureFor(location, isoDate);
  if (closure) {
    if (closure.hours && closure.hours.length > 0) {
      return { date: isoDate, open: true, ranges: closure.hours, closureReason: closure.reason };
    }
    return { date: isoDate, open: false, ranges: [], closureReason: closure.reason };
  }
  const ranges = location.hours[weekdayOf(isoDate)] ?? [];
  return { date: isoDate, open: ranges.length > 0, ranges };
}

/** Whether a local wall-clock time (HH:MM) on a date falls inside the location's hours. */
export function isOpenAt(location: ClientLocation, isoDate: string, hhmm: string): boolean {
  const day = hoursForDate(location, isoDate);
  return day.open && day.ranges.some((range) => range.open <= hhmm && hhmm < range.close);
}

const WEEKDAY_DE: Record<Weekday, string> = {
  mon: 'Montag', tue: 'Dienstag', wed: 'Mittwoch', thu: 'Donnerstag', fri: 'Freitag', sat: 'Samstag', sun: 'Sonntag',
};

/** Compact German rendering for prompts: "Mo–Fr 07:30–19:30 Uhr, Sa 09:00–13:00 Uhr". */
export function formatWeeklyHoursDe(location: ClientLocation): string {
  const parts: string[] = [];
  let runStart: Weekday | null = null;
  let runKey = '';
  const keyOf = (day: Weekday) => (location.hours[day] ?? []).map((r) => `${r.open}-${r.close}`).join(',');
  const flush = (end: Weekday) => {
    if (runStart === null) return;
    const label = runStart === end ? WEEKDAY_DE[runStart].slice(0, 2) : `${WEEKDAY_DE[runStart].slice(0, 2)}–${WEEKDAY_DE[end].slice(0, 2)}`;
    const ranges = (location.hours[runStart] ?? []).map((r) => `${r.open}–${r.close} Uhr`).join(' und ');
    parts.push(`${label} ${ranges || 'geschlossen'}`);
  };
  let previous: Weekday | null = null;
  for (const day of WEEKDAYS) {
    const key = keyOf(day);
    if (runStart === null) { runStart = day; runKey = key; previous = day; continue; }
    if (key !== runKey) { flush(previous!); runStart = day; runKey = key; }
    previous = day;
  }
  flush(previous!);
  return parts.filter((part) => !part.endsWith('geschlossen')).join(', ') || 'keine regulären Öffnungszeiten hinterlegt';
}

export function weekdayNameDe(day: Weekday): string {
  return WEEKDAY_DE[day];
}

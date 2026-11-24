// Perth has no daylight saving, so UTC+08:00 is fixed and safe to hard-code.
export const TIME_ZONE = 'Australia/Perth';
const PERTH_OFFSET = '+08:00';

const dateFmt = new Intl.DateTimeFormat('en-AU', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFmt = new Intl.DateTimeFormat('en-AU', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('en-AU', {
  timeZone: TIME_ZONE,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const stampFmt = new Intl.DateTimeFormat('en-AU', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export const formatDate = (d: Date) => dateFmt.format(d);
export const formatShortDate = (d: Date) => shortDateFmt.format(d);
export const formatTime = (d: Date) => timeFmt.format(d).replace(' ', '').toLowerCase();
export const formatStamp = (d: Date) => stampFmt.format(d);

export function formatRange(start: Date, end: Date): string {
  return `${formatDate(start)}, ${formatTime(start)} to ${formatTime(end)}`;
}

/** `<input type="datetime-local">` value, read as Perth time. */
export function parsePerthLocal(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error(`Bad date and time: ${value}`);
  return new Date(`${value}:00${PERTH_OFFSET}`);
}

/** The inverse of parsePerthLocal, for prefilling a form. */
export function toPerthLocal(d: Date): string {
  const shifted = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export function formatMoney(cents: number, currency = 'aud'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

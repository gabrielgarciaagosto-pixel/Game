/** 24-hour hour + minute as "h:mm AM/PM". 0:00 is 12:00 AM, 12:00 is 12:00 PM. */
export function formatClock12(hour24: number, minute: number): string {
  const h24 = ((Math.trunc(hour24) % 24) + 24) % 24;
  const min = Math.min(59, Math.max(0, Math.trunc(minute)));
  const meridiem = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${hour12}:${String(min).padStart(2, '0')} ${meridiem}`;
}

export function formatTimeOf(date: Date): string {
  return formatClock12(date.getHours(), date.getMinutes());
}

/** Calendar date plus a 12-hour clock. Avoids the browser's 24-hour locale. */
export function formatDateTime12(ms: number): string {
  const d = new Date(ms);
  return `${d.toLocaleDateString()} · ${formatTimeOf(d)}`;
}

export function hour12Parts(hour24: number): {
  hour: number;
  meridiem: 'AM' | 'PM';
} {
  const h24 = ((Math.trunc(hour24) % 24) + 24) % 24;
  return {
    hour: h24 % 12 === 0 ? 12 : h24 % 12,
    meridiem: h24 >= 12 ? 'PM' : 'AM',
  };
}

/** 12-hour clock face back to 0–23. 12 AM is 0, 12 PM is 12. */
export function hour24From12(hour12: number, meridiem: 'AM' | 'PM'): number {
  const face = ((Math.trunc(hour12) - 1) % 12) + 1;
  if (meridiem === 'AM') return face === 12 ? 0 : face;
  return face === 12 ? 12 : face + 12;
}

export type Meridiem = 'AM' | 'PM';

/** Hour / minute / AM-PM as shown on the VR-441 selects. */
export interface TodFields {
  /** '' while the hour select is still on its blank option. Otherwise '1'–'12'. */
  hour: string;
  /** '00'–'59'. */
  minute: string;
  mer: Meridiem;
}

const EMPTY_TOD: TodFields = { hour: '', minute: '00', mer: 'AM' };

/**
 * Read a VR-441 time-of-death draft.
 * A complete value is "4:15 PM". An hour that has not been picked yet is
 * ":15 PM" (or "" when the minute is still 00 and the meridiem is still AM),
 * so choosing minute or AM/PM first is not thrown away.
 */
export function readTodFields(raw: string): TodFields {
  const text = raw.trim();
  const partial = text.match(/^:(\d{2})\s*([AaPp][Mm])$/);
  if (partial) return fieldsFrom('', partial[1], partial[2]);
  const match = text.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (!match) return { ...EMPTY_TOD };
  return fieldsFrom(match[1], match[2], match[3]);
}

/**
 * Write the VR-441 selects back to the draft string.
 * Blank hour keeps the minute and meridiem. "00" + AM with no hour stays "".
 * That empty string and any ":mm AM/PM" fragment do not match a permit.
 */
export function writeTod(hour: string, minute: string, mer: Meridiem): string {
  const minuteText = minuteToken(minute);
  if (!minuteText) return '';
  const merSafe: Meridiem = mer === 'PM' ? 'PM' : 'AM';
  if (!hour) {
    if (minuteText === '00' && merSafe === 'AM') return '';
    return `:${minuteText} ${merSafe}`;
  }
  const hourNum = hourToken(hour);
  if (hourNum == null) return '';
  return `${hourNum}:${minuteText} ${merSafe}`;
}

function fieldsFrom(hour: string, minute: string, mer: string): TodFields {
  const minuteText = minuteToken(minute);
  const merSafe: Meridiem = mer.toUpperCase() === 'PM' ? 'PM' : 'AM';
  if (!minuteText) return { ...EMPTY_TOD };
  if (!hour) return { hour: '', minute: minuteText, mer: merSafe };
  const hourNum = hourToken(hour);
  if (hourNum == null) return { ...EMPTY_TOD };
  return { hour: String(hourNum), minute: minuteText, mer: merSafe };
}

function minuteToken(minute: string): string | null {
  if (!/^\d{1,2}$/.test(minute)) return null;
  const min = Number(minute);
  if (!Number.isInteger(min) || min < 0 || min > 59) return null;
  return String(min).padStart(2, '0');
}

function hourToken(hour: string): number | null {
  if (!/^\d{1,2}$/.test(hour)) return null;
  const hourNum = Number(hour);
  if (!Number.isInteger(hourNum) || hourNum < 1 || hourNum > 12) return null;
  return hourNum;
}

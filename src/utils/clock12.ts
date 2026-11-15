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

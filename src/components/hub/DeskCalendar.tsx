import React, { useMemo, useRef, useState } from 'react';
import { SERVICE_GRACE_MS, addLocalDays, serviceTiming, startOfLocalDay } from '../../data/pacing';
import { displayCaseName, type DecedentCase } from '../../types/game';
import { formatTimeOf } from '../../utils/clock12';
import { gameNow } from '../../utils/gameNow';
import { useGameStore } from '../../store/useGameStore';
import { useSheetOpen } from '../useSheetOpen';

const MIN_OFFSET = -7;
const MAX_OFFSET = 13;

function sameDay(a: number, b: number): boolean {
  return startOfLocalDay(a) === startOfLocalDay(b);
}

function dayAppointments(cases: DecedentCase[], dayMs: number) {
  return cases
    .filter((c) => c.serviceDateMs != null && sameDay(c.serviceDateMs, dayMs))
    .slice()
    .sort((a, b) => (a.serviceDateMs ?? 0) - (b.serviceDateMs ?? 0));
}

function PageFace({
  dayMs,
  now,
  cases,
  today,
}: {
  dayMs: number;
  now: number;
  cases: DecedentCase[];
  today: number;
}) {
  const date = new Date(dayMs);
  const appts = dayAppointments(cases, dayMs);
  const isToday = sameDay(dayMs, today);
  return (
    <div className="desk-cal-face flex h-full flex-col bg-[#f4efe4] text-[#2a241c]">
      <div className="flex items-center justify-between border-b border-[#e4d3b5] px-2.5 pt-1.5 pb-1">
        <span className="text-[9px] font-black tracking-[0.18em] text-[#8a5a2b]">
          {isToday ? 'TODAY' : date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
        </span>
        <span className="text-[9px] font-semibold text-[#8d7b66]">
          {date.toLocaleDateString(undefined, { month: 'short' })}
        </span>
      </div>
      <div className="px-2.5 pt-0.5 font-serif text-[1.35rem] leading-none text-[#1c1612]">
        {date.getDate()}
      </div>
      <ul className="mt-0.5 min-h-0 flex-1 overflow-hidden px-2.5">
        {appts.length === 0 ? (
          <li className="truncate text-[10px] italic text-[#8d7b66]">No services on the book.</li>
        ) : (
          <li className="truncate text-[10px] leading-tight text-[#3d342b]">
            <span className="font-semibold text-[#6b3f1d]">
              {formatTimeOf(new Date(appts[0].serviceDateMs ?? now))}
            </span>{' '}
            {displayCaseName(appts[0])}
            {appts.length > 1 ? (
              <span className="text-[#8a5a2b]"> · +{appts.length - 1}</span>
            ) : null}
          </li>
        )}
      </ul>
      <p className="px-2.5 pb-1 text-[8px] tracking-wide text-[#8d7b66]">
        Swipe the page · tap for the month
      </p>
    </div>
  );
}

export const DeskCalendar: React.FC = () => {
  const cases = useGameStore((s) => s.cases);
  const [now, setNow] = useState(() => gameNow());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(gameNow()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  useSheetOpen(open);
  React.useEffect(() => {
    if (!open) return;
    window.__ossuarianCloseFiles?.();
    window.__ossuarianClosePhone?.();
    const close = () => setOpen(false);
    window.__ossuarianCloseCalendar = close;
    return () => {
      if (window.__ossuarianCloseCalendar === close) {
        delete window.__ossuarianCloseCalendar;
      }
    };
  }, [open]);
  const [monthCursor, setMonthCursor] = useState(() => new Date(gameNow()));
  const [flip, setFlip] = useState<{ deg: number; dir: 1 | -1; animMs: number } | null>(
    null
  );
  const drag = useRef<{
    x: number;
    y: number;
    t: number;
    lastY: number;
    lastT: number;
    dir: 1 | -1;
  } | null>(null);

  const today = startOfLocalDay(now);
  const dayMs = addLocalDays(today, offset);
  const nextMs = addLocalDays(today, Math.min(MAX_OFFSET, offset + 1));
  const prevMs = addLocalDays(today, Math.max(MIN_OFFSET, offset - 1));

  const commit = (dir: 1 | -1) => {
    setOffset((n) => Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, n + dir)));
    setFlip(null);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (open) return;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      lastY: e.clientY,
      lastT: performance.now(),
      dir: 1,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* optional */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    d.lastY = e.clientY;
    d.lastT = performance.now();
    if (Math.abs(dy) < 6) return;
    const dir: 1 | -1 = dy < 0 ? 1 : -1;
    d.dir = dir;
    const span = dir === 1 ? offset < MAX_OFFSET : offset > MIN_OFFSET;
    if (!span) {
      setFlip({ deg: 0, dir, animMs: 0 });
      return;
    }
    const progress = Math.min(1, Math.abs(dy) / 150);
    const deg = dir === 1 ? -progress * 180 : -180 + progress * 180;
    setFlip({ deg, dir, animMs: 0 });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!d) return;
    const dy = e.clientY - d.y;
    const dt = Math.max(1, performance.now() - d.lastT);
    const vy = (e.clientY - d.lastY) / dt;
    if (Math.abs(dy) < 10 && Math.abs(e.clientX - d.x) < 14) {
      setFlip(null);
      setOpen(true);
      setMonthCursor(new Date(addLocalDays(today, offset)));
      return;
    }
    const dir: 1 | -1 = dy < 0 ? 1 : -1;
    const allowed = dir === 1 ? offset < MAX_OFFSET : offset > MIN_OFFSET;
    const progress = Math.min(1, Math.abs(dy) / 150);
    const flick = dir === 1 ? vy < -0.45 : vy > 0.45;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!allowed || (!flick && progress < 0.38)) {
      setFlip({ deg: dir === 1 ? 0 : -180, dir, animMs: reduced ? 0 : 220 });
      window.setTimeout(() => setFlip(null), reduced ? 0 : 230);
      return;
    }
    const speed = Math.min(1.6, Math.abs(vy));
    const animMs = reduced ? 0 : Math.max(140, 420 - speed * 180);
    const end = dir === 1 ? -180 : 0;
    setFlip({ deg: end, dir, animMs });
    window.setTimeout(() => commit(dir), animMs);
  };

  const sheetDeg = flip?.deg ?? 0;
  const underMs = !flip || flip.dir === 1 ? nextMs : dayMs;
  const sheetMs = !flip || flip.dir === 1 ? dayMs : prevMs;

  return (
    <>
      <div className="pointer-events-auto w-[10.6rem]" data-desk-calendar>
        <button
          type="button"
          className="desk-cal relative block h-[5.6rem] w-full text-left"
          style={{ perspective: '900px', touchAction: 'none' }}
          aria-label="Desk calendar. Swipe up for the next day, down for the previous. Tap for the schedule."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="absolute inset-x-3 top-1 h-2 rounded-sm bg-[#c4b49a]" aria-hidden />
          <div className="absolute inset-x-0 top-2 bottom-0 overflow-hidden rounded-md shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            <PageFace dayMs={underMs} now={now} cases={cases} today={today} />
          </div>
          <div
            className="absolute inset-x-0 top-2 bottom-0 overflow-hidden rounded-md shadow-[0_8px_18px_rgba(0,0,0,0.28)]"
            style={{
              transformOrigin: 'top center',
              transform: `rotateX(${sheetDeg}deg)`,
              transition: flip && flip.animMs > 0 ? `transform ${flip.animMs}ms ease` : 'none',
              backfaceVisibility: 'hidden',
            }}
          >
            <PageFace dayMs={sheetMs} now={now} cases={cases} today={today} />
          </div>
        </button>
      </div>
      {open ? (
        <ScheduleBook
          now={now}
          cases={cases}
          selected={dayMs}
          monthCursor={monthCursor}
          onMonth={setMonthCursor}
          onSelect={(ms) => {
            const diff = Math.round((startOfLocalDay(ms) - today) / 86_400_000);
            setOffset(Math.min(MAX_OFFSET, Math.max(MIN_OFFSET, diff)));
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
};

function ScheduleBook({
  now,
  cases,
  selected,
  monthCursor,
  onMonth,
  onSelect,
  onClose,
}: {
  now: number;
  cases: DecedentCase[];
  selected: number;
  monthCursor: Date;
  onMonth: (d: Date) => void;
  onSelect: (ms: number) => void;
  onClose: () => void;
}) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const cells = useMemo(() => {
    const firstDow = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const out: Array<number | null> = Array.from({ length: firstDow }, () => null);
    for (let d = 1; d <= count; d += 1) out.push(new Date(year, month, d).getTime());
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month]);
  const appts = dayAppointments(cases, selected);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center"
      style={{
        paddingTop: '0.75rem',
        paddingLeft: 'max(0.75rem, var(--safe-left))',
        paddingRight: 'max(0.75rem, var(--safe-right))',
        paddingBottom: 'calc(var(--safe-bottom) + 0.85rem)',
      }}
    >
      <div
        className="flex max-h-full min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl border border-amber-900/40 bg-[#121820] text-slate-100 shadow-2xl"
        data-calendar-open
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-amber-200/80">Schedule</p>
            <h2 className="font-serif text-lg text-[#f6efe4]">
              {new Date(selected).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-bold text-amber-100"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <section>
            <h3 className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
              This day
            </h3>
            {appts.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Nothing is booked.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {appts.map((c) => {
                  const ms = c.serviceDateMs ?? now;
                  const timing = serviceTiming(ms, now);
                  const lateMin = Math.max(0, Math.round((now - ms) / 60_000));
                  const graceLeft = Math.max(
                    0,
                    Math.ceil((SERVICE_GRACE_MS - (now - ms)) / 60_000)
                  );
                  return (
                    <li
                      key={c.id}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-amber-100">
                          {formatTimeOf(new Date(ms))}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          {timing === 'grace'
                            ? `${graceLeft}m grace`
                            : timing === 'missed'
                              ? `${lateMin}m past`
                              : 'On the book'}
                        </span>
                      </div>
                      <p className="text-sm">
                        {displayCaseName(c)}
                        {c.familyRelation ? ` · ${c.familyRelation}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {timing === 'missed'
                          ? 'Reschedule from the case file. The family takes a little reputation, not a $900 failure.'
                          : timing === 'grace'
                            ? 'Still inside the grace window. Holding it now costs a small courtesy.'
                            : 'Family is expected at this hour.'}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded border border-white/10 px-2 py-1 text-[11px]"
                  onClick={() => onMonth(new Date(year, month - 1, 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="rounded border border-white/10 px-2 py-1 text-[11px]"
                  onClick={() => onMonth(new Date(year, month + 1, 1))}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={`${d}${i}`}>{d}</div>
              ))}
              {cells.map((ms, i) => {
                if (ms == null) return <div key={`e${i}`} />;
                const booked = cases.some(
                  (c) => c.serviceDateMs != null && sameDay(c.serviceDateMs, ms)
                );
                const on = sameDay(ms, selected);
                return (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => onSelect(ms)}
                    className={`relative rounded-md py-1.5 text-[12px] ${
                      on ? 'bg-amber-500 font-bold text-slate-950' : 'bg-white/5 text-slate-200'
                    }`}
                  >
                    {new Date(ms).getDate()}
                    {booked ? (
                      <span
                        className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                          on ? 'bg-slate-950' : 'bg-amber-300'
                        }`}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

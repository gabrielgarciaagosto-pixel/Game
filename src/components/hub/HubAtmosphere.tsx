import React, { useEffect, useState } from 'react';
import {
  BANK_WARNING_AFTER_MS,
} from '../../data/bankForeclosure';
import { gameNow } from '../../utils/gameNow';
import { useGameStore } from '../../store/useGameStore';

const SPIRIT_CAP = 6;
const FUME_LINGER_MS = 90_000;

const SPIRIT_SLOTS = [
  { x: 22, y: 42, dx: 36, dur: 16 },
  { x: 58, y: 30, dx: -28, dur: 18 },
  { x: 40, y: 62, dx: 22, dur: 14 },
  { x: 74, y: 54, dx: -34, dur: 17 },
  { x: 14, y: 72, dx: 30, dur: 15 },
  { x: 48, y: 24, dx: 18, dur: 19 },
];

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Hub wash behind the room buttons. Reads live case, retort, inbox, and debt
 * state. Nothing here receives taps.
 */
export const HubAtmosphere: React.FC = () => {
  const cases = useGameStore((s) => s.cases);
  const retort = useGameStore((s) => s.retort);
  const inboxFiles = useGameStore((s) => s.inboxFiles);
  const cash = useGameStore((s) => s.cash);
  const negativeCashSinceMs = useGameStore((s) => s.negativeCashSinceMs);
  const bankWarningIssued = useGameStore((s) => s.bankWarningIssued);
  const bankForeclosed = useGameStore((s) => s.bankForeclosed);
  const embalmingLeftAtMs = useGameStore((s) => s.embalmingLeftAtMs);
  const [tick, setTick] = useState(0);

  const needsClock =
    embalmingLeftAtMs != null ||
    cases.some((c) => c.serviceDateMs != null || c.location === 'CHAPEL') ||
    (cash < 0 && negativeCashSinceMs != null);

  useEffect(() => {
    if (!needsClock) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [needsClock]);

  const nowWall = Date.now();
  const nowGame = gameNow();
  void tick;

  const crematoryOn =
    retort.phase === 'BURN' || retort.primaryOn || retort.heated;
  const embalmingTable = cases.some((c) => c.location === 'EMBALMING');
  const embalmingLinger =
    embalmingLeftAtMs != null && nowWall - embalmingLeftAtMs < FUME_LINGER_MS;
  const fumes = embalmingTable || embalmingLinger;
  const coolerOn = cases.some((c) => c.location === 'COOLER');
  const urnOn = cases.some((c) => c.location === 'URN_FILLING');
  const chapelOn = cases.some(
    (c) =>
      c.location === 'CHAPEL' ||
      (c.serviceDateMs != null && c.serviceDateMs >= nowGame - 30 * 60_000)
  );
  const computerUnread = inboxFiles.some((f) => !f.isRead);
  const debtWarn =
    !bankForeclosed &&
    cash < 0 &&
    negativeCashSinceMs != null &&
    (bankWarningIssued ||
      nowGame - negativeCashSinceMs >= BANK_WARNING_AFTER_MS);

  const spiritCount =
    cases.length >= 3 ? Math.min(SPIRIT_CAP, cases.length) : 0;
  const spirits = cases.slice(0, spiritCount).map((c, i) => {
    const slot = SPIRIT_SLOTS[i % SPIRIT_SLOTS.length];
    const h = hashId(c.id);
    return {
      id: c.id,
      x: slot.x + (h % 7) - 3,
      y: slot.y + ((h >> 3) % 6) - 2,
      dx: slot.dx,
      dur: slot.dur,
      delay: -((h >> 5) % slot.dur),
      alpha: 0.62 + (h % 4) * 0.06,
    };
  });

  return (
    <div className="hub-atmo pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {crematoryOn && (
        <div className="hub-atmo-flame">
          <span />
          <span />
          <span />
        </div>
      )}
      {fumes && (
        <div className="hub-atmo-fume">
          <span />
          <span />
          <span />
        </div>
      )}
      {coolerOn && (
        <div className="hub-atmo-frost">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
      {urnOn && (
        <div className="hub-atmo-dust">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} style={{ ['--i' as string]: i }} />
          ))}
        </div>
      )}
      {chapelOn && (
        <div className="hub-atmo-chapel">
          <span className="hub-candle" />
          <span className="hub-candle hub-candle-b" />
          <span className="hub-petal" />
          <span className="hub-petal hub-petal-b" />
        </div>
      )}
      {computerUnread && <div className="hub-atmo-crt" />}
      {debtWarn && <div className="hub-atmo-debt" />}
      {spirits.map((s) => (
        <div
          key={s.id}
          className="hub-spirit"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            ['--dx' as string]: `${s.dx}px`,
            ['--dur' as string]: `${s.dur}s`,
            ['--delay' as string]: `${s.delay}s`,
            ['--a' as string]: String(s.alpha),
          }}
        >
          <span className="hub-spirit-wisp" />
          <span className="hub-spirit-body" />
          <span className="hub-spirit-head" />
        </div>
      ))}
    </div>
  );
};

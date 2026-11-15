import React, { useEffect, useState } from 'react';
import { headlineById } from '../../data/newsHeadlines';
import { trendFor, wireLine, type NewsTrend } from '../../news/newsWire';
import { useGameStore } from '../../store/useGameStore';

function TrendMark({ trend }: { trend: NewsTrend }) {
  if (trend === 'none') return null;
  const up = trend === 'up';
  return (
    <span
      aria-label={up ? 'Up' : 'Down'}
      className={`shrink-0 text-[10px] leading-none ${
        up ? 'text-emerald-300/85' : 'text-rose-300/80'
      }`}
    >
      {up ? '▲' : '▼'}
    </span>
  );
}

/**
 * Replaces the hub title. One headline is on screen, then the next slides in.
 * Volume and price lines carry a small arrow. Rival lines do not.
 */
export const NewsTicker: React.FC = () => {
  const wire = useGameStore((s) => s.newsWire);
  const lines = wire
    .map((item) => ({
      id: item.headlineId + String(item.startedAt),
      text: wireLine(item),
      trend: trendFor(item.headlineId),
      celeb: headlineById(item.headlineId)?.category === 'CELEBRITY',
    }))
    .filter((line) => line.text);
  const [index, setIndex] = useState(0);
  const count = lines.length;

  useEffect(() => {
    if (count < 2) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setInterval(() => {
      setIndex((n) => (n + 1) % count);
    }, reduced ? 8000 : 6500);
    return () => window.clearInterval(id);
  }, [count]);

  const safeIndex = count === 0 ? 0 : index % count;
  const line = lines[safeIndex];

  return (
    <div
      data-hub-news
      className="overflow-hidden rounded-lg border border-amber-900/50 bg-black/45"
    >
      <div className="flex items-start gap-1.5 px-2 py-1.5">
        <span className="shrink-0 pt-0.5 text-[9px] font-black tracking-[0.16em] text-amber-200/90">
          NEWS
        </span>
        {line ? <TrendMark trend={line.trend} /> : null}
        {line?.celeb ? (
          <span aria-hidden className="shrink-0 pt-0.5 text-[9px] text-amber-200/70">
            ◆
          </span>
        ) : null}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p
            key={line?.id ?? 'quiet'}
            data-news-text={line?.text ?? ''}
            title={line?.text}
            className="news-swap text-[12px] leading-snug text-slate-100 line-clamp-3"
          >
            {line?.text ?? 'The wire is quiet.'}
          </p>
        </div>
      </div>
      <div className="news-track" aria-hidden />
    </div>
  );
};

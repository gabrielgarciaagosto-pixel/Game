import React, { useEffect, useRef, useState } from 'react';
import { headlineById } from '../../data/newsHeadlines';
import { preferMiscIndex, trendFor, wireLine, type NewsTrend } from '../../news/newsWire';
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

function MiscTag() {
  return (
    <span className="shrink-0 rounded bg-slate-700/80 px-1 py-0.5 text-[8px] font-black tracking-[0.12em] text-slate-200">
      MISC
    </span>
  );
}

type TickerLine = {
  id: string;
  text: string;
  trend: NewsTrend;
  misc: boolean;
  spawn: boolean;
};

/**
 * Replaces the hub title. One headline is on screen, then the next slides in.
 * Price and volume lines carry an arrow. Miscellaneous lines carry a MISC tag.
 * A celebrity case keeps its own mark. The crawl prefers miscellaneous lines.
 */
export const NewsTicker: React.FC = () => {
  const wire = useGameStore((s) => s.newsWire);
  const lines: TickerLine[] = wire
    .map((item) => {
      const headline = headlineById(item.headlineId);
      return {
        id: item.headlineId + String(item.startedAt),
        text: wireLine(item),
        trend: trendFor(item.headlineId),
        misc: headline?.group === 'MISCELLANEOUS',
        spawn: headline?.category === 'CELEBRITY' && headline.spawnsCase === true,
      };
    })
    .filter((line) => line.text);
  const linesRef = useRef(lines);
  const [index, setIndex] = useState(0);
  const count = lines.length;

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    if (count < 2) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setInterval(() => {
      setIndex((n) => preferMiscIndex(linesRef.current, n, Math.random()));
    }, reduced ? 8000 : 6500);
    return () => window.clearInterval(id);
  }, [count]);

  const safeIndex = count === 0 ? 0 : index % count;
  const line = lines[safeIndex];
  const showArrow = !!line && !line.misc && !line.spawn && line.trend !== 'none';

  return (
    <div
      data-hub-news
      className="flex h-[3.25rem] flex-col overflow-hidden rounded-lg border border-amber-900/50 bg-black/45"
    >
      <div className="flex h-[2.9rem] min-h-[2.9rem] items-start gap-1.5 px-2 pt-1.5">
        <span className="shrink-0 pt-0.5 text-[9px] font-black tracking-[0.16em] text-amber-200/90">
          NEWS
        </span>
        {line?.misc ? <MiscTag /> : null}
        {showArrow && line ? <TrendMark trend={line.trend} /> : null}
        {line?.spawn ? (
          <span aria-hidden className="shrink-0 pt-0.5 text-[9px] text-amber-200/70">
            ◆
          </span>
        ) : null}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p
            key={line?.id ?? 'quiet'}
            data-news-text={line?.text ?? ''}
            data-news-kind={line?.misc ? 'misc' : line?.spawn ? 'case' : 'effect'}
            title={line?.text}
            className="news-swap h-[2.3rem] text-[12px] leading-[1.15rem] text-slate-100 line-clamp-2"
          >
            {line?.text ?? 'The wire is quiet.'}
          </p>
        </div>
      </div>
      <div className="news-track mt-auto shrink-0" aria-hidden />
    </div>
  );
};

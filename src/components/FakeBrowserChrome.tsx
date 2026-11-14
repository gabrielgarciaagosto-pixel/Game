import React, { useState } from 'react';

type Props = {
  title: string;
  url: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Period faux browser chrome — tab, nav, fictional URL, close → desktop.
 */
export const FakeBrowserChrome: React.FC<Props> = ({
  title,
  url,
  onClose,
  children,
}) => {
  const [address, setAddress] = useState(url);
  const [spin, setSpin] = useState(0);

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[#1a1f2a] text-slate-100 select-none">
      <div className="shrink-0 flex items-end gap-1 px-2 pt-2 bg-[#0e1218] border-b border-slate-700">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-md bg-[#243044] border border-b-0 border-slate-600 text-[11px] font-semibold max-w-[70%]">
          <span className="truncate">{title}</span>
          <button
            type="button"
            onPointerDown={onClose}
            className="shrink-0 text-slate-400 active:text-white text-xs px-1"
            aria-label="Close tab"
          >
            ×
          </button>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onPointerDown={onClose}
          className="mb-1 px-2 py-1 text-[10px] rounded border border-slate-600 bg-slate-900"
        >
          − Desktop
        </button>
      </div>

      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1.5 bg-[#151a24] border-b border-slate-700">
        <button
          type="button"
          className="w-7 h-7 rounded border border-slate-600 bg-slate-900 text-slate-400 text-sm disabled:opacity-40"
          disabled
          aria-label="Back"
        >
          ←
        </button>
        <button
          type="button"
          className="w-7 h-7 rounded border border-slate-600 bg-slate-900 text-slate-400 text-sm disabled:opacity-40"
          disabled
          aria-label="Forward"
        >
          →
        </button>
        <button
          type="button"
          onPointerDown={() => {
            setSpin((n) => n + 1);
            setAddress(url);
          }}
          className="w-7 h-7 rounded border border-slate-600 bg-slate-900 text-slate-200 text-sm active:bg-slate-800"
          aria-label="Refresh"
        >
          ↻
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-1.5 rounded-full border border-slate-600 bg-[#0b0f16] px-3 py-1 font-mono text-[10px] text-emerald-200/90">
          <span className="text-slate-500 shrink-0">🔒</span>
          <span className="truncate">{address}</span>
        </div>
      </div>

      <div key={spin} className="relative flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

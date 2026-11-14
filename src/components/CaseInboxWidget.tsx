import React, { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addDays(ms: number, days: number): number {
  return ms + days * 86_400_000;
}

export const CaseInboxWidget: React.FC = () => {
  const { inboxFiles, markFileRead, setServiceDate, cases } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickHour, setPickHour] = useState(14);

  const unreadCount = inboxFiles.filter((f) => !f.isRead).length;
  const activeFile =
    inboxFiles.find((f) => f.id === selectedFileId) || inboxFiles[0];

  const linkedCase = cases.find((c) => c.id === activeFile?.id);

  const calendarDays = useMemo(() => {
    const today = startOfDay(Date.now());
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, [isOpen, calendarOpen]);

  const confirmServiceDate = (dayMs: number) => {
    if (!activeFile) return;
    const d = new Date(dayMs);
    d.setHours(pickHour, 0, 0, 0);
    setServiceDate(activeFile.id, d.getTime());
    setCalendarOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onPointerDown={() => setIsOpen(!isOpen)}
        className="fixed bottom-3 right-3 z-50 bg-amber-500 active:bg-amber-400 text-slate-950 font-extrabold px-3 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border-2 border-amber-200 text-sm"
      >
        <span>FILES</span>
        {unreadCount > 0 && (
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
            {unreadCount} NEW
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-16 left-3 right-3 z-50 h-[min(70vh,28rem)] bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl flex overflow-hidden text-slate-100 select-none">
          <div className="w-[38%] max-w-[9.5rem] border-r border-slate-800 overflow-y-auto bg-slate-950/60">
            <div className="p-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              Family Directives
            </div>
            {inboxFiles.length === 0 && (
              <p className="p-3 text-xs text-slate-500">Inbox empty</p>
            )}
            {inboxFiles.map((file) => (
              <button
                key={file.id}
                type="button"
                onPointerDown={() => {
                  setSelectedFileId(file.id);
                  markFileRead(file.id);
                  setCalendarOpen(false);
                }}
                className={`w-full text-left p-2.5 border-b border-slate-800/80 text-xs ${
                  activeFile?.id === file.id ? 'bg-slate-800' : ''
                }`}
              >
                <div className="font-bold text-amber-300 truncate">
                  {!file.isRead && '● '}
                  {file.decedentName}
                </div>
                <div className="text-[10px] text-slate-400">
                  Recorded Wt: {file.weightLbs} lbs
                </div>
                {file.serviceDateMs && (
                  <div className="text-[10px] text-sky-300 mt-0.5">
                    Service{' '}
                    {new Date(file.serviceDateMs).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between text-xs overflow-y-auto">
            {activeFile ? (
              <div>
                <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      CASE FILE: {activeFile.decedentName}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Case ID #{activeFile.id} ·{' '}
                      {new Date(activeFile.intakeTimestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onPointerDown={() => setIsOpen(false)}
                    className="text-slate-400 active:text-white font-bold px-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <p>
                    <span className="text-slate-400">Weight & Tissue:</span>{' '}
                    <strong className="text-white">
                      {activeFile.weightLbs} lbs ({activeFile.tissueCondition})
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Family Directive:</span>{' '}
                    <strong className="text-amber-300 font-mono">
                      {activeFile.directive}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Flower Arrangement:</span>{' '}
                    <strong className="text-emerald-300">
                      {activeFile.preferredFlowers}
                    </strong>
                  </p>
                  {linkedCase && (
                    <p>
                      <span className="text-slate-400">Status:</span>{' '}
                      <strong className="text-sky-300">
                        {linkedCase.location}
                        {linkedCase.embalmRank
                          ? ` · Embalm ${linkedCase.embalmRank}`
                          : ''}
                        {linkedCase.cremationRank
                          ? ` · Cremation ${linkedCase.cremationRank}`
                          : ''}
                      </strong>
                    </p>
                  )}

                  {activeFile.serviceDateMs ? (
                    <div className="p-2 bg-sky-950/60 border border-sky-700 rounded text-[11px]">
                      Viewing / service set for{' '}
                      <strong>
                        {new Date(activeFile.serviceDateMs).toLocaleString()}
                      </strong>
                      {Date.now() > activeFile.serviceDateMs ? (
                        <span className="text-red-400 font-bold"> — OVERDUE</span>
                      ) : (
                        <span className="text-amber-300">
                          {' '}
                          —{' '}
                          {Math.max(
                            0,
                            Math.ceil(
                              (activeFile.serviceDateMs - Date.now()) / 60_000
                            )
                          )}{' '}
                          min remaining
                        </span>
                      )}
                      <button
                        type="button"
                        onPointerDown={() => setCalendarOpen(true)}
                        className="block mt-2 text-sky-300 underline"
                      >
                        Reschedule
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onPointerDown={() => setCalendarOpen(true)}
                      className="w-full py-2.5 bg-sky-600 active:bg-sky-500 rounded font-bold text-sm"
                    >
                      Set Date for Viewing / Service
                    </button>
                  )}

                  {calendarOpen && (
                    <div className="mt-2 p-2 bg-slate-950 border border-slate-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-300">
                          Pick service day
                        </span>
                        <label className="text-[10px] text-slate-400 flex items-center gap-1">
                          Hour
                          <select
                            value={pickHour}
                            onChange={(e) => setPickHour(Number(e.target.value))}
                            className="bg-slate-800 rounded px-1 py-0.5"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 9).map(
                              (h) => (
                                <option key={h} value={h}>
                                  {h}:00
                                </option>
                              )
                            )}
                          </select>
                        </label>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {calendarDays.map((day) => {
                          const label = new Date(day).toLocaleDateString(
                            undefined,
                            { weekday: 'short', month: 'numeric', day: 'numeric' }
                          );
                          const isToday = day === startOfDay(Date.now());
                          return (
                            <button
                              key={day}
                              type="button"
                              onPointerDown={() => confirmServiceDate(day)}
                              className={`py-2 rounded text-[10px] font-semibold ${
                                isToday
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-800 active:bg-slate-700'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onPointerDown={() => setCalendarOpen(false)}
                        className="mt-2 text-[10px] text-slate-500 underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300 mt-2">
                    Ensure remains are tagged on Cooler intake. Keep unembalmed
                    cases refrigerated — decay outside the cooler tanks family
                    satisfaction. Cremating a Burial-Viewing decedent triggers
                    legal action.
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 m-auto">No case files in inbox.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

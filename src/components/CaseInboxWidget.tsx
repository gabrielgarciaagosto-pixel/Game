import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export const CaseInboxWidget: React.FC = () => {
  const { inboxFiles, markFileRead } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const unreadCount = inboxFiles.filter((f) => !f.isRead).length;
  const activeFile =
    inboxFiles.find((f) => f.id === selectedFileId) || inboxFiles[0];

  return (
    <>
      <button
        type="button"
        onPointerDown={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-amber-500 active:bg-amber-400 text-slate-950 font-extrabold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border-2 border-amber-200"
      >
        <span>CASE FILES</span>
        {unreadCount > 0 && (
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
            {unreadCount} NEW
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[min(460px,calc(100vw-2rem))] h-80 bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl flex overflow-hidden text-slate-100 select-none">
          <div className="w-40 md:w-44 border-r border-slate-800 overflow-y-auto bg-slate-950/60">
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
                  <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-300 mt-2">
                    Ensure remains are properly tagged upon Cooler intake.
                    Cremating a Burial-Viewing decedent will result in immediate
                    legal action. Cross-check weight if the cooler label reads
                    UNIDENTIFIED REMAINS.
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

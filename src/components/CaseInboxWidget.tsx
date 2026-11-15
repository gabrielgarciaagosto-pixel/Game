import React, { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  caseStatusLabel,
  directiveBlurb,
  directiveLabel,
  friendlyToken,
} from '../types/game';
import {
  formatTod,
  formatVitalsDob,
  formatVitalsDod,
  permitStatusLabel,
} from '../data/decedentVitals';
import {
  decorPrefLabel,
  serviceMusicLabel,
} from '../data/familyChapelPrefs';
import { getUrnById } from '../data/urnCatalog';
import { gameNow } from '../utils/gameNow';
import { audioManager } from '../utils/audioManager';
import { DEV_TOOLS } from '../dev';
import { UrnVessel } from './urns/UrnVessel';

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addDays(ms: number, days: number): number {
  return ms + days * 86_400_000;
}

export const CaseInboxWidget: React.FC = () => {
  const {
    inboxFiles,
    markFileRead,
    setServiceDate,
    cases,
    finalizeServiceAndNextCase,
  } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickHour, setPickHour] = useState(14);

  const unreadCount = inboxFiles.filter((f) => !f.isRead).length;
  const activeFile =
    inboxFiles.find((f) => f.id === selectedFileId) || inboxFiles[0];

  const linkedCase = cases.find((c) => c.id === activeFile?.id);
  const directPickup =
    linkedCase?.directive === 'CREMATION_DIRECT' && linkedCase.isCremated;
  const urnInHand = directPickup && linkedCase.isUrnFilled;

  const openSchedule = () => {
    if (directPickup) {
      setPickupOpen(true);
      setCalendarOpen(false);
      return;
    }
    setPickupOpen(false);
    setCalendarOpen(true);
  };

  const handUrnToFamily = () => {
    if (!linkedCase || !urnInHand) return;
    finalizeServiceAndNextCase('CREMATION', linkedCase.id);
    setIsOpen(false);
    setPickupOpen(false);
    setCalendarOpen(false);
  };

  const calendarDays = useMemo(() => {
    const today = startOfDay(gameNow());
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
        onClick={() => {
          audioManager.playUiClick('tick');
          setIsOpen(!isOpen);
        }}
        style={{
          bottom: 'var(--files-fab-bottom)',
          right: 'var(--safe-right)',
          touchAction: 'manipulation',
        }}
        className="fixed z-50 bg-amber-500 active:bg-amber-400 text-slate-950 font-extrabold px-3.5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border-2 border-amber-200 text-sm min-h-12"
      >
        <span>FILES</span>
        {unreadCount > 0 && (
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
            {unreadCount} NEW
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            bottom: 'var(--files-panel-bottom)',
            left: 'var(--safe-left)',
            right: 'var(--safe-right)',
          }}
          className="fixed z-50 h-[min(62vh,26rem)] bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl flex overflow-hidden text-slate-100 select-none"
        >
          <div className="w-[38%] max-w-[9.5rem] border-r border-slate-800 overflow-y-auto bg-slate-950/60">
            <div className="p-2 border-b border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Family Directives
              </div>
              {DEV_TOOLS ? (
                <button
                  type="button"
                  aria-label="Developer tools"
                  onClick={() =>
                    window.dispatchEvent(new Event('ossuarian-dev-open'))
                  }
                  className="mt-1 font-mono text-[9px] font-bold tracking-wider text-lime-300 border border-lime-400/70 bg-zinc-950 rounded px-1 py-0.5"
                >
                  DEV
                </button>
              ) : null}
            </div>
            {inboxFiles.length === 0 && (
              <p className="p-3 text-xs text-slate-500">Inbox empty</p>
            )}
            {inboxFiles.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => {
                  setSelectedFileId(file.id);
                  markFileRead(file.id);
                  setCalendarOpen(false);
                  setPickupOpen(false);
                }}
                style={{ touchAction: 'manipulation' }}
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
                    {cases.some(
                      (c) =>
                        c.id === file.id &&
                        c.directive === 'CREMATION_DIRECT' &&
                        c.isCremated
                    )
                      ? 'Pickup'
                      : 'Service'}{' '}
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
                    onClick={() => setIsOpen(false)}
                    style={{ touchAction: 'manipulation' }}
                    className="text-slate-400 active:text-white font-bold px-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="paper-sheet p-2.5 rounded-lg border border-stone-400 space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      Vital records
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-500">DOB</span>
                        <div className="font-mono text-slate-100">
                          {activeFile.dateOfBirthMs
                            ? formatVitalsDob(activeFile)
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">DOD</span>
                        <div className="font-mono text-slate-100">
                          {activeFile.dateOfDeathMs
                            ? formatVitalsDod(activeFile)
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">TOD</span>
                        <div className="font-mono text-amber-200">
                          {activeFile.dateOfDeathMs != null
                            ? (() => {
                                const colon = formatTod(
                                  activeFile.timeOfDeathHour ?? 0,
                                  activeFile.timeOfDeathMinute ?? 0
                                );
                                // HHMM first so paste into VR-441 yields 4 digits cleanly
                                return `${colon.replace(':', '')} · ${colon}`;
                              })()
                            : '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Place of birth</span>
                        <div className="text-emerald-200 leading-snug">
                          {activeFile.placeOfBirth || '—'}
                        </div>
                      </div>
                    </div>
                    {activeFile.cremationPermitStatus &&
                      activeFile.cremationPermitStatus !== 'NOT_REQUIRED' && (
                        <div className="pt-1 border-t border-slate-800 text-[11px]">
                          <span className="text-slate-500">Cremation permit: </span>
                          <strong
                            className={
                              activeFile.cremationPermitStatus === 'APPROVED'
                                ? 'text-emerald-300'
                                : activeFile.cremationPermitStatus === 'REJECTED'
                                  ? 'text-red-300'
                                  : activeFile.cremationPermitStatus === 'PENDING'
                                    ? 'text-amber-300'
                                    : 'text-slate-200'
                            }
                          >
                            {permitStatusLabel(activeFile.cremationPermitStatus)}
                          </strong>
                          {activeFile.cremationPermitRejectReason && (
                            <p className="text-[10px] text-red-300/90 mt-0.5 leading-snug">
                              {activeFile.cremationPermitRejectReason}
                            </p>
                          )}
                          {activeFile.cremationPermitStatus !== 'APPROVED' && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              File / correct on the Computer (VR-441). Cremating
                              without approval risks a state fine.
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                  <p>
                    <span className="text-slate-400">Weight & Tissue:</span>{' '}
                    <strong className="text-white">
                      {activeFile.weightLbs} lbs ({friendlyToken(activeFile.tissueCondition)})
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Family Directive:</span>{' '}
                    <strong className="text-amber-300">
                      {directiveLabel(activeFile.directive)}
                    </strong>
                    <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">
                      {directiveBlurb(activeFile.directive)}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Flower Arrangement:</span>{' '}
                    <strong className="text-emerald-300">
                      {friendlyToken(activeFile.preferredFlowers)}
                    </strong>
                  </p>
                  {(() => {
                    const prefs =
                      linkedCase?.familyChapelPrefs ??
                      activeFile.familyChapelPrefs;
                    if (!prefs) return null;
                    return (
                      <div className="p-2 rounded-lg border border-violet-800/60 bg-violet-950/40 space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-violet-300/80">
                          Family chapel preferences
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-violet-100/90">
                          <span>Walls · {decorPrefLabel(prefs.wallId)}</span>
                          <span>Floor · {decorPrefLabel(prefs.floorId)}</span>
                          <span>
                            Drapery · {decorPrefLabel(prefs.draperyId)}
                          </span>
                          <span>
                            Lighting · {decorPrefLabel(prefs.lightingId)}
                          </span>
                          <span>Pews · {decorPrefLabel(prefs.pewsId)}</span>
                          <span>
                            Music · {serviceMusicLabel(prefs.musicTrackId)}
                          </span>
                          <span className="col-span-2">
                            Flowers · {friendlyToken(prefs.flowers)}
                          </span>
                        </div>
                        <p className="text-[9px] text-violet-400/80">
                          Matching is a bonus only — no penalty if you miss.
                        </p>
                      </div>
                    );
                  })()}
                  {(() => {
                    const requestedId =
                      linkedCase?.familyRequestedUrnId ??
                      activeFile.familyRequestedUrnId;
                    const urn = getUrnById(requestedId);
                    return (
                      <div className="p-2 rounded-lg border border-slate-700 bg-slate-950/70">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                          Family vessel
                        </div>
                        {urn ? (
                          <div className="flex items-center gap-2">
                            <UrnVessel
                              urn={urn}
                              size="sm"
                              showPlaque={false}
                              className="shrink-0 h-12 w-12"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-amber-200 truncate">
                                {urn.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {friendlyToken(urn.material)} · ${urn.cost}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            Awaiting family selection
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  {linkedCase && (
                    <p>
                      <span className="text-slate-400">Status:</span>{' '}
                      <strong className="text-sky-300">
                        {caseStatusLabel(linkedCase)}
                      </strong>
                    </p>
                  )}

                  {activeFile.serviceDateMs ? (
                    <div className="p-2 bg-sky-950/60 border border-sky-700 rounded text-[11px]">
                      {directPickup
                        ? 'Family urn pickup set for '
                        : 'Viewing / service set for '}
                      <strong>
                        {new Date(activeFile.serviceDateMs).toLocaleString()}
                      </strong>
                      {gameNow() > activeFile.serviceDateMs ? (
                        <span className="text-red-400 font-bold"> — OVERDUE</span>
                      ) : (
                        <span className="text-amber-300">
                          {' '}
                          —{' '}
                          {Math.max(
                            0,
                            Math.ceil(
                              (activeFile.serviceDateMs - gameNow()) / 60_000
                            )
                          )}{' '}
                          min remaining
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={openSchedule}
                        style={{ touchAction: 'manipulation' }}
                        className="block mt-2 text-sky-300 underline"
                      >
                        {directPickup ? 'Reschedule pickup' : 'Reschedule'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openSchedule}
                      style={{ touchAction: 'manipulation' }}
                      className="w-full py-2.5 bg-sky-600 active:bg-sky-500 rounded font-bold text-sm"
                    >
                      {directPickup
                        ? 'Schedule Family Urn Pickup'
                        : 'Set Date for Viewing / Service'}
                    </button>
                  )}

                  {directPickup && pickupOpen && (
                    <div className="mt-2 p-2 bg-slate-950 border border-amber-700/70 rounded-lg space-y-2">
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Cremation is finished. Hand the sealed urn to the
                        family now, or set a day for them to collect it.
                      </p>
                      <button
                        type="button"
                        disabled={!urnInHand}
                        onClick={handUrnToFamily}
                        style={{ touchAction: 'manipulation' }}
                        className={`w-full py-2.5 rounded font-bold text-sm ${
                          urnInHand
                            ? 'bg-amber-500 text-slate-950 active:bg-amber-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        Hand the urn to the family now
                      </button>
                      {!urnInHand && (
                        <p className="text-[10px] text-amber-200/80 leading-snug">
                          Seal the urn in processing before handing it over.
                          A pickup day can still be set.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setCalendarOpen(true)}
                        style={{ touchAction: 'manipulation' }}
                        className="w-full py-2 rounded bg-sky-800 active:bg-sky-700 font-semibold text-xs"
                      >
                        Choose a pickup day
                      </button>
                    </div>
                  )}

                  {calendarOpen && (
                    <div className="mt-2 p-2 bg-slate-950 border border-slate-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-300">
                          {directPickup ? 'Pick pickup day' : 'Pick service day'}
                        </span>
                        <label className="text-[10px] text-slate-400 flex items-center gap-1">
                          Hour (24h)
                          <select
                            value={pickHour}
                            onChange={(e) => setPickHour(Number(e.target.value))}
                            className="bg-slate-800 rounded px-1 py-0.5 max-h-40"
                          >
                            {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                              <option key={h} value={h}>
                                {String(h).padStart(2, '0')}:00
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {calendarDays.map((day) => {
                          const label = new Date(day).toLocaleDateString(
                            undefined,
                            { weekday: 'short', month: 'numeric', day: 'numeric' }
                          );
                          const isToday = day === startOfDay(gameNow());
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => confirmServiceDate(day)}
                              style={{ touchAction: 'manipulation' }}
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
                        onClick={() => setCalendarOpen(false)}
                        style={{ touchAction: 'manipulation' }}
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

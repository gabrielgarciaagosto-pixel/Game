import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  caseStatusLabel,
  directiveBlurb,
  directiveLabel,
  friendlyToken,
  type ArchivedCaseFile,
} from '../types/game';
import {
  formatTod,
  formatVitalsDob,
  formatVitalsDod,
  permitStatusLabel,
} from '../data/decedentVitals';
import {
  formatDateTime12,
  formatTimeOf,
  hour12Parts,
  hour24From12,
} from '../utils/clock12';
import { getUrnById } from '../data/urnCatalog';
import { getCasketById } from '../data/casketCatalog';
import {
  directiveNeedsCasket,
  directiveNeedsUrn,
} from '../data/familyUrnPick';
import { inventoryUnits } from '../data/caseRating';
import { FamilyPreferenceCard } from './FamilyPreferenceCard';
import { gameNow } from '../utils/gameNow';
import { audioManager } from '../utils/audioManager';
import { DEV_TOOLS } from '../dev/flags';
import { useDevSummoned } from '../dev/devSummon';
import { PhoneFab } from './PhoneFab';
import { UrnVessel } from './urns/UrnVessel';

const FILE_FAB_CLASS =
  'bg-amber-500 active:bg-amber-400 text-slate-950 font-extrabold px-3.5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border-2 border-amber-200 text-sm min-h-12';

function FilesDevButton() {
  if (import.meta.env.VITE_PUBLIC_DEMO === '1') return null;
  return <FilesDevButtonLive />;
}

function FilesDevButtonLive() {
  const devSummoned = useDevSummoned();
  if (!DEV_TOOLS || !devSummoned) return null;
  return (
    <button
      type="button"
      aria-label="Developer tools"
      onClick={() => window.dispatchEvent(new Event('ossuarian-dev-open'))}
      className="mt-1 font-mono text-[9px] font-bold tracking-wider text-lime-300 border border-lime-400/70 bg-zinc-950 rounded px-1 py-0.5"
    >
      DEV
    </button>
  );
}

function moneyLabel(amount: number): string {
  const abs = Math.abs(Math.round(amount)).toLocaleString();
  return amount < 0 ? `−$${abs}` : `$${abs}`;
}

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
    archivedCases,
    markFileRead,
    setServiceDate,
    setCaseFilePanels,
    noteTutorialFile,
    cases,
    finalizeServiceAndNextCase,
    urnInventory,
    casketInventory,
  } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [archivesOpen, setArchivesOpen] = useState(false);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(
    null
  );
  const archivesOpenRef = useRef(false);
  archivesOpenRef.current = archivesOpen;

  useEffect(() => {
    setCaseFilePanels(isOpen, archivesOpen);
    return () => setCaseFilePanels(false, false);
  }, [isOpen, archivesOpen, setCaseFilePanels]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickHour, setPickHour] = useState(14);
  const [scheduleNote, setScheduleNote] = useState<string | null>(null);
  const activeStation = useGameStore((s) => s.activeStation);
  const stationRef = useRef(activeStation);
  useEffect(() => {
    if (stationRef.current === activeStation) return;
    stationRef.current = activeStation;
    setIsOpen(false);
    setPhoneOpen(false);
    setArchivesOpen(false);
    setPickupOpen(false);
    setCalendarOpen(false);
    setScheduleNote(null);
  }, [activeStation]);

  useEffect(() => {
    if (!isOpen) {
      setArchivesOpen(false);
      return;
    }
    const close = () => {
      if (archivesOpenRef.current) {
        setArchivesOpen(false);
        return;
      }
      setIsOpen(false);
      setPickupOpen(false);
      setCalendarOpen(false);
    };
    window.__ossuarianCloseFiles = close;
    return () => {
      if (window.__ossuarianCloseFiles === close) {
        delete window.__ossuarianCloseFiles;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!phoneOpen) return;
    const close = () => setPhoneOpen(false);
    window.__ossuarianClosePhone = close;
    return () => {
      if (window.__ossuarianClosePhone === close) {
        delete window.__ossuarianClosePhone;
      }
    };
  }, [phoneOpen]);

  const openPhone = (next: boolean) => {
    setPhoneOpen(next);
    if (!next) return;
    setIsOpen(false);
    setArchivesOpen(false);
    setPickupOpen(false);
    setCalendarOpen(false);
    setScheduleNote(null);
  };

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
    finalizeServiceAndNextCase('CREMATION', linkedCase.id, {
      urnHandoff: true,
    });
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
    if (d.getTime() <= gameNow()) {
      setScheduleNote(
        'That hour has already passed. Pick a later time. Nothing was booked.'
      );
      return;
    }
    setScheduleNote(null);
    setServiceDate(activeFile.id, d.getTime());
    setCalendarOpen(false);
  };

  return (
    <>
      <div
        className="files-fab-anchor fixed z-[52] flex flex-col items-end"
        style={{
          bottom: 'var(--files-fab-bottom)',
          right: 'var(--safe-right)',
          gap: 'var(--fab-gap)',
        }}
      >
        <PhoneFab open={phoneOpen} onOpenChange={openPhone} />
        <div className="flex items-end gap-2">
        {isOpen && (
          <button
            type="button"
            aria-label="Archives"
            onClick={() => {
              audioManager.playUiClick('tick');
              setArchivesOpen((open) => !open);
            }}
            style={{ touchAction: 'manipulation' }}
            className={FILE_FAB_CLASS}
            data-tutorial-target="archives"
          >
            ARCHIVES
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            audioManager.playUiClick('tick');
            setIsOpen((open) => {
              if (open) {
                setArchivesOpen(false);
                return false;
              }
              setPhoneOpen(false);
              return true;
            });
          }}
          style={{ touchAction: 'manipulation' }}
          className={FILE_FAB_CLASS}
          data-tutorial-target="files"
        >
          <span>FILES</span>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
              {unreadCount} NEW
            </span>
          )}
        </button>
        </div>
      </div>

      {isOpen && (
        <div
          data-files-panel
          className="hub-fab-sheet fixed z-50 bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl flex overflow-hidden text-slate-100 select-none"
        >
          <div className="w-[38%] max-w-[9.5rem] border-r border-slate-800 overflow-y-auto bg-slate-950/60">
            <div className="p-2 border-b border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Family Directives
              </div>
              <FilesDevButton />
            </div>
            {inboxFiles.length === 0 && (
              <p className="p-3 text-xs text-slate-500">Inbox empty</p>
            )}
            {inboxFiles.map((file) => (
              <button
                key={file.id}
                type="button"
                data-tutorial-target="directive"
                onClick={() => {
                  setSelectedFileId(file.id);
                  markFileRead(file.id);
                  noteTutorialFile(file.id);
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
                      {formatTimeOf(new Date(activeFile.intakeTimestamp))}
                    </span>
                    {activeFile.headlineNote && (
                      <p
                        data-headline-case
                        className="mt-1 text-[11px] leading-snug text-amber-200"
                      >
                        {activeFile.headlineNote}
                      </p>
                    )}
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
                        <div className="font-mono text-amber-200 whitespace-nowrap">
                          {activeFile.dateOfDeathMs != null
                            ? formatTod(
                                activeFile.timeOfDeathHour ?? 0,
                                activeFile.timeOfDeathMinute ?? 0
                              )
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
                          <strong className="case-permit-ink">
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
                  {(() => {
                    const prefs =
                      linkedCase?.familyChapelPrefs ??
                      activeFile.familyChapelPrefs;
                    if (!prefs) return null;
                    return <FamilyPreferenceCard prefs={prefs} />;
                  })()}
                  {(() => {
                    const requestedUrnId =
                      linkedCase?.familyRequestedUrnId ??
                      activeFile.familyRequestedUrnId;
                    const requestedCasketId =
                      linkedCase?.familyRequestedCasketId ??
                      activeFile.familyRequestedCasketId;
                    const urn = getUrnById(requestedUrnId);
                    const casket = getCasketById(requestedCasketId);
                    const needsUrn = linkedCase
                      ? directiveNeedsUrn(linkedCase.directive)
                      : false;
                    const needsCasket = linkedCase
                      ? directiveNeedsCasket(linkedCase.directive)
                      : false;
                    const urnStock = inventoryUnits(
                      urnInventory,
                      linkedCase?.offeredUrnId ?? null
                    );
                    const casketStock = inventoryUnits(
                      casketInventory,
                      linkedCase?.offeredCasketId ?? null
                    );
                    const waitingUrn = needsUrn && !urn;
                    const waitingCasket = needsCasket && !casket;
                    const missing: string[] = [];
                    if (waitingUrn && urnStock < 1) missing.push('an urn');
                    if (waitingCasket && casketStock < 1) missing.push('a casket');
                    return (
                      <div
                        className="p-2 rounded-lg border border-slate-700 bg-slate-950/70 space-y-2"
                        data-family-choice
                      >
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">
                          Family choice — from your stock only
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
                                Reserved from stock · {friendlyToken(urn.material)}
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {casket ? (
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-amber-200 truncate">
                              {casket.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Reserved from stock · {friendlyToken(casket.material)}
                            </div>
                          </div>
                        ) : null}
                        {!urn && !casket && (
                          <p className="text-[11px] text-slate-400 italic">
                            Awaiting a choice from what you have stocked.
                          </p>
                        )}
                        {missing.length > 0 && (
                          <p
                            data-stock-hint
                            className="text-[11px] leading-snug text-amber-200"
                          >
                            The family is waiting on {missing.join(' and ')}.
                            Nothing suitable is in stock. Buy some in the
                            Emporium. Urns can also be shaped on the bench.
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
                        {formatDateTime12(activeFile.serviceDateMs)}
                      </strong>
                      {(() => {
                        const late = gameNow() - activeFile.serviceDateMs;
                        if (late <= 0) {
                          return (
                            <span className="text-amber-300">
                              {' '}
                              —{' '}
                              {Math.max(0, Math.ceil(-late / 60_000))} min
                            </span>
                          );
                        }
                        if (late <= 45 * 60_000) {
                          return (
                            <span className="text-amber-200 font-bold">
                              {' '}
                              — grace, $150 courtesy if held now
                            </span>
                          );
                        }
                        return (
                          <span className="text-red-300 font-bold">
                            {' '}
                            — reschedule (−6 reputation)
                          </span>
                        );
                      })()}
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
                          Time
                          <select
                            aria-label="Service hour"
                            value={hour12Parts(pickHour).hour}
                            onChange={(e) => {
                              setScheduleNote(null);
                              setPickHour(
                                hour24From12(
                                  Number(e.target.value),
                                  hour12Parts(pickHour).meridiem
                                )
                              );
                            }}
                            className="bg-slate-800 rounded px-1 py-0.5"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                              (h) => (
                                <option key={h} value={h}>
                                  {h}:00
                                </option>
                              )
                            )}
                          </select>
                          <select
                            aria-label="AM or PM"
                            value={hour12Parts(pickHour).meridiem}
                            onChange={(e) => {
                              setScheduleNote(null);
                              setPickHour(
                                hour24From12(
                                  hour12Parts(pickHour).hour,
                                  e.target.value === 'PM' ? 'PM' : 'AM'
                                )
                              );
                            }}
                            className="bg-slate-800 rounded px-1 py-0.5"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </label>
                      </div>
                      {scheduleNote ? (
                        <p
                          data-schedule-note
                          className="mb-2 text-[11px] font-semibold leading-snug text-amber-200"
                        >
                          {scheduleNote}
                        </p>
                      ) : null}
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

      {isOpen && archivesOpen && (
        <ArchivesPanel
          records={archivedCases}
          selectedId={selectedArchiveId}
          onSelect={setSelectedArchiveId}
          onClose={() => setArchivesOpen(false)}
        />
      )}
    </>
  );
};

function ArchivesPanel({
  records,
  selectedId,
  onSelect,
  onClose,
}: {
  records: ArchivedCaseFile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const active = records.find((r) => r.id === selectedId) || records[0];
  return (
    <div
      className="hub-fab-sheet fixed z-[51] bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl flex overflow-hidden text-slate-100 select-none"
    >
      <div className="w-[38%] max-w-[9.5rem] border-r border-slate-800 overflow-y-auto bg-slate-950/60">
        <div className="p-2 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
          Closed cases
        </div>
        {records.length === 0 && (
          <p className="p-3 text-xs text-slate-500">No closed cases yet</p>
        )}
        {records.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => onSelect(file.id)}
            style={{ touchAction: 'manipulation' }}
            className={`w-full text-left p-2.5 border-b border-slate-800/80 text-xs ${
              active?.id === file.id ? 'bg-slate-800' : ''
            }`}
          >
            <div className="font-bold text-amber-300 truncate">
              {file.decedentName}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {moneyLabel(file.payout)}
            </div>
          </button>
        ))}
      </div>
      <div className="flex-1 p-4 flex flex-col text-xs overflow-y-auto">
        <div className="flex justify-between items-start border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-white">ARCHIVES</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ touchAction: 'manipulation' }}
            className="text-slate-400 active:text-white font-bold px-2"
          >
            ✕
          </button>
        </div>
        {active ? (
          <div className="mt-3 space-y-2">
            <div>
              <div className="text-sm font-bold text-white">
                CASE FILE: {active.decedentName}
              </div>
              <div className="text-[11px] text-slate-400">
                Case ID #{active.id} · closed{' '}
                {formatDateTime12(active.closedAt)}
              </div>
            </div>
            <p>
              <span className="text-slate-400">Directive:</span>{' '}
              <strong className="text-amber-300">
                {directiveLabel(active.directive)}
              </strong>
              <span className="block text-[10px] text-slate-500 mt-0.5 leading-snug">
                {directiveBlurb(active.directive)}
              </span>
            </p>
            <p>
              <span className="text-slate-400">Outcome:</span>{' '}
              <strong className="text-white">{active.outcome}</strong>
            </p>
            <p>
              <span className="text-slate-400">Payout:</span>{' '}
              <strong className="text-white">{moneyLabel(active.payout)}</strong>
            </p>
            <p>
              <span className="text-slate-400">Weight & Tissue:</span>{' '}
              <strong className="text-white">
                {active.weightLbs} lbs ({friendlyToken(active.tissueCondition)})
              </strong>
            </p>
            <p>
              <span className="text-slate-400">Flower Arrangement:</span>{' '}
              <strong className="text-white">
                {friendlyToken(active.preferredFlowers)}
              </strong>
            </p>
            <div className="paper-sheet p-2.5 rounded-lg border border-stone-400 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider">
                Vital records
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                <div>
                  <span>DOB</span>
                  <div className="font-mono">
                    {active.dateOfBirthMs
                      ? formatVitalsDob(active)
                      : '—'}
                  </div>
                </div>
                <div>
                  <span>DOD</span>
                  <div className="font-mono">
                    {active.dateOfDeathMs
                      ? formatVitalsDod(active)
                      : '—'}
                  </div>
                </div>
                <div>
                  <span>TOD</span>
                  <div className="font-mono whitespace-nowrap">
                    {formatTod(active.timeOfDeathHour, active.timeOfDeathMinute)}
                  </div>
                </div>
                <div>
                  <span>Place of birth</span>
                  <div className="leading-snug">{active.placeOfBirth || '—'}</div>
                </div>
              </div>
              {active.cremationPermitStatus !== 'NOT_REQUIRED' && (
                <div className="pt-1 border-t border-stone-400/70 text-[11px]">
                  <span>Cremation permit: </span>
                  <strong className="case-permit-ink">
                    {permitStatusLabel(active.cremationPermitStatus)}
                  </strong>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-500 m-auto">
            Finished case files land here.
          </p>
        )}
      </div>
    </div>
  );
}

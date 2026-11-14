import { CASKET_CATALOG } from '../data/casketCatalog';
import { CHAPEL_DECOR_CATALOG } from '../data/chapelDecor';
import {
  DEFAULT_FACILITY_LEVELS,
  FACILITY_UPGRADES,
  type FacilityUpgradeId,
  type FacilityUpgradeLevels,
} from '../data/facilityUpgrades';
import {
  directiveNeedsUrn,
  pickFamilyUrnRequest,
} from '../data/familyUrnPick';
import {
  createShopRotation,
  RARE_SCHEDULE,
  type RareTone,
} from '../data/shopRotation';
import { FLEET_CATALOG } from '../data/funeralFleets';
import { URN_CATALOG } from '../data/urnCatalog';
import { IDLE_RETORT } from '../retort/retortTypes';
import {
  generateRandomCase,
  pauseGamePersistWrites,
  resumeGamePersistWrites,
  toInboxFile,
  useGameStore,
} from '../store/useGameStore';
import { initialPermitStatus } from '../data/cremationPermits';
import type { DispositionDirective } from '../types/game';
import { audioManager } from '../utils/audioManager';
import {
  advanceClockBy,
  clearClockOffsetStorage,
  gameNow,
  setClockOffsetMs,
  getClockOffsetMs,
} from '../utils/gameNow';

function toast(msg: string) {
  useGameStore.setState({ intakeToast: `[DEV] ${msg}` });
}

export function addCash(amount: number) {
  useGameStore.setState((s) => ({ cash: Math.max(0, s.cash + amount) }));
  toast(`Cash ${amount >= 0 ? '+' : ''}${amount}`);
}

export function addReputation(amount: number) {
  useGameStore.setState((s) => ({
    reputation: Math.max(0, s.reputation + amount),
  }));
  toast(`Reputation ${amount >= 0 ? '+' : ''}${amount}`);
}

export function setCash(value: number) {
  const n = Math.round(value); // allow negative for bank foreclosure tests
  useGameStore.setState({ cash: n });
  // Toast first so tickBankForeclosure can overwrite with BANK NOTICE / FORECLOSURE.
  toast(`Cash = $${n}`);
  useGameStore.getState().tickBankForeclosure();
}

export function setCashNegative(amount = -500) {
  setCash(amount);
}

export function fastForwardBankHours(familyHours: number) {
  const ms = familyHours * 60 * 6_000; // FAMILY_MINUTE_MS = 6s
  advanceClockBy(ms);
  // Toast first so tickBankForeclosure can overwrite with BANK NOTICE / FORECLOSURE.
  toast(`Clock +${familyHours} family hour(s) (bank tick)`);
  useGameStore.getState().tickBankLoans();
  useGameStore.getState().tickBankForeclosure();
}

export function setReputation(value: number) {
  const n = Math.max(0, Math.round(value));
  useGameStore.setState({ reputation: n });
  toast(`Reputation = ${n}`);
}

export function spawnDirective(directive: DispositionDirective) {
  const state = useGameStore.getState();
  const coolerCount = state.cases.filter((c) => c.location === 'COOLER').length;
  const cap = state.coolerCapacity();
  if (coolerCount >= cap) {
    toast(`Cooler full (${coolerCount}/${cap})`);
    return;
  }
  const now = gameNow();
  const base = generateRandomCase(now);
  const next = {
    ...base,
    directive,
    familyUrnDueAt: directiveNeedsUrn(directive)
      ? now + 45_000
      : null,
    familyRequestedUrnId: null as string | null,
    basePayout:
      directive === 'CREMATION_DIRECT'
        ? 950
        : directive === 'BURIAL_VIEWING'
          ? 1350
          : directive === 'CREMATION_THEN_VIEWING'
            ? 1550
            : 1650,
    cremationPermitStatus: initialPermitStatus(directive),
    cremationPermitSubmittedAt: null,
    cremationPermitEvaluatesAt: null,
    cremationPermitRejectReason: null,
    unpermittedCremation: false,
  };
  useGameStore.setState({
    cases: [...state.cases, next],
    inboxFiles: [toInboxFile(next), ...state.inboxFiles],
    intakeToast: `[DEV] Spawned ${directive}`,
    activeCaseId: state.activeCaseId ?? next.id,
  });
}

export function advanceHours(hours: number) {
  advanceClockBy(hours * 3_600_000);
  useGameStore.getState().tickFamilyUrnChoices();
  useGameStore.getState().expireUntaggedNames();
  useGameStore.getState().tickDecay();
  const d = new Date(gameNow());
  toast(
    `+${hours}h → ${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} (offset ${(getClockOffsetMs() / 3_600_000).toFixed(1)}h)`
  );
}

export function skipToNextDay() {
  const now = gameNow();
  const d = new Date(now);
  d.setHours(24, 0, 5, 0); // just after local midnight tomorrow
  const delta = d.getTime() - now;
  advanceClockBy(delta);
  useGameStore.getState().tickFamilyUrnChoices();
  useGameStore.getState().expireUntaggedNames();
  toast(`Skipped to next day (${new Date(gameNow()).toLocaleString()})`);
}

export function jumpToRareTone(tone: RareTone) {
  const entry = RARE_SCHEDULE.find((e) => e.tone === tone);
  if (!entry) {
    toast(`No ${tone} rare schedule`);
    return;
  }
  const now = gameNow();
  const target = new Date(now);
  target.setMinutes(5, 0, 0);
  target.setHours(entry.startHour);
  if (target.getTime() <= now) {
    target.setDate(target.getDate() + 1);
    target.setHours(entry.startHour);
  }
  setClockOffsetMs(getClockOffsetMs() + (target.getTime() - now));
  useGameStore.setState({ shopRotation: createShopRotation() });
  toast(`Jumped to ${tone} window ~${entry.startHour}:00 (${entry.id})`);
}

export function forceRareRotation() {
  useGameStore.setState({ shopRotation: createShopRotation() });
  toast('Rare stock windows cleared — next Emporium open refreshes');
}

export function forceFamilyUrnNow() {
  const now = gameNow();
  useGameStore.setState((s) => ({
    cases: s.cases.map((c) => {
      if (!directiveNeedsUrn(c.directive)) return c;
      if (c.familyRequestedUrnId) return c;
      return { ...c, familyUrnDueAt: now - 1 };
    }),
  }));
  useGameStore.getState().tickFamilyUrnChoices();
  toast('Family urn requests forced');
}

export function instantFinishBurn() {
  const state = useGameStore.getState();
  const r = state.retort;
  // Only the case actually loaded in the retort — never fall back to hub
  // selection (that wrongly cremated cooler/chapel / burial-viewing bodies).
  const caseId = r.caseId;
  if (!caseId) {
    toast('Retort empty — load a burn first');
    return;
  }
  if (r.phase === 'IDLE') {
    toast('No burn in progress');
    return;
  }
  const active = state.cases.find((c) => c.id === caseId);
  if (!active) {
    toast('Retort case missing from cooler/station list');
    return;
  }

  useGameStore.setState({
    retort: {
      ...r,
      caseId,
      phase: 'DONE',
      primaryOn: false,
      secondaryOn: false,
      blowerOn: false,
      purging: false,
      audioMode: 'OFF',
      elapsedSec: Math.max(r.elapsedSec, 999),
      largeBonesLeft: 0,
      mediumBonesLeft: 0,
      fineAshLeft: 0,
      doorOpen: 1,
      doorMoving: null,
    },
    cremationBurnActive: false,
    cremationBurnProgress: 1,
    cremationDecayArrested: true,
  });

  if (!active.isCremated) {
    state.completeCremation(
      'A',
      Math.round(active.weightLbs * 0.035 * 453.6),
      caseId
    );
  }
  state.markUrnAshReady(caseId);
  toast('Burn + cremulator finished');
}

export function unlockAllCollection() {
  const urnInventory: Record<string, number> = {};
  for (const u of URN_CATALOG) urnInventory[u.id] = Math.max(1, 3);
  const casketInventory: Record<string, number> = {};
  for (const c of CASKET_CATALOG) casketInventory[c.id] = Math.max(1, 3);
  const chapelOwnedDecor = CHAPEL_DECOR_CATALOG.map((d) => d.id);
  useGameStore.setState({ urnInventory, casketInventory, chapelOwnedDecor });
  toast('Owned all urns, caskets, décor');
}

export function maxFacilityUpgrades() {
  const facilityLevels = { ...DEFAULT_FACILITY_LEVELS } as FacilityUpgradeLevels;
  for (const def of FACILITY_UPGRADES) {
    facilityLevels[def.id as FacilityUpgradeId] = def.tiers.length;
  }
  const state = useGameStore.getState();
  // Expand pad so maxed upgrades aren't soft-locked on starter space.
  const ownedProperty = {
    ...state.ownedProperty,
    spaceTotal: Math.max(state.ownedProperty.spaceTotal, 120),
  };
  useGameStore.setState({
    facilityLevels,
    ownedProperty,
    cremulatorOwned: true,
    cremulatorDamaged: false,
  });
  toast('Facility upgrades maxed (+space 120)');
}

export function markActiveEmbalmed() {
  const ok = useGameStore.getState().markActiveCaseEmbalmed();
  toast(ok ? 'Active case marked embalmed' : 'No active case / already embalmed');
}

export function grantFleetCash() {
  setCash(90_000);
  toast('Cash set $90000 for fleet showroom');
}

export function ownAllFleets() {
  useGameStore.setState({
    ownedFleetIds: FLEET_CATALOG.map((v) => v.id),
  });
  toast(`Garage owns all ${FLEET_CATALOG.length} cortege vehicles`);
}

export function clearFleets() {
  useGameStore.setState({
    ownedFleetIds: [],
    fleetAssignment: { recovery: null, escort: null, coach: null },
  });
  toast('Garage cleared (interment kept)');
}

export function zeroInterment() {
  useGameStore.setState({ intermentScore: 0 });
  toast('Interment score zeroed');
}

/** Embalmed burial so the real service payout shows cortege bonuses. */
export function completeFleetDemoService() {
  let state = useGameStore.getState();
  if (!state.cases.some((c) => c.directive === 'BURIAL_VIEWING')) {
    spawnDirective('BURIAL_VIEWING');
  }
  state = useGameStore.getState();
  const target =
    state.cases.find((c) => c.id === state.activeCaseId) ??
    state.cases.find((c) => c.directive === 'BURIAL_VIEWING') ??
    state.cases[0];
  if (!target) {
    toast('No case for fleet demo service');
    return;
  }
  useGameStore.setState({
    activeCaseId: target.id,
    cases: state.cases.map((c) =>
      c.id === target.id
        ? {
            ...c,
            directive: 'BURIAL_VIEWING' as const,
            isEmbalmed: true,
            decayLevel: 0,
            serviceDateMs: null,
          }
        : c
    ),
  });
  useGameStore.getState().finalizeServiceAndNextCase('BURIAL', target.id);
  toast('Demo burial finalized — cortege bonuses posted');
}

export function grantBankTestCash() {
  setCash(80_000);
  toast('Cash set $80000 for property/loan QA');
}

export function resetFacilityUpgrades() {
  useGameStore.setState({
    facilityLevels: { ...DEFAULT_FACILITY_LEVELS },
  });
  toast('Facility upgrades reset');
}

export function fillCooler() {
  const state = useGameStore.getState();
  let added = 0;
  while (state.receiveNewIntake()) added += 1;
  toast(added > 0 ? `Filled cooler (+${added})` : 'Cooler already full');
}

export function clearCooler() {
  useGameStore.setState((s) => {
    const keep = s.cases.filter((c) => c.location !== 'COOLER');
    const removed = s.cases.length - keep.length;
    const activeStill = keep.find((c) => c.id === s.activeCaseId);
    return {
      cases: keep,
      inboxFiles: s.inboxFiles.filter((f) => keep.some((c) => c.id === f.id)),
      activeCaseId: activeStill?.id ?? keep[0]?.id ?? null,
      intakeToast: `[DEV] Cleared cooler (−${removed})`,
      retort:
        s.retort.caseId && keep.some((c) => c.id === s.retort.caseId)
          ? s.retort
          : { ...IDLE_RETORT },
    };
  });
}

export function muteAllAudio() {
  audioManager.setMuted(true);
  toast('Audio muted');
}

export function unmuteAudio() {
  audioManager.setMuted(false);
  toast('Audio unmuted');
}

export function audioDebugLine(): string {
  const id = audioManager.getCurrentId();
  const muted = audioManager.isMuted();
  return `bed=${id ?? '—'} muted=${muted ? 'yes' : 'no'}`;
}

export function forcePickFamilyUrnForActive() {
  const state = useGameStore.getState();
  const active = state.getActiveCase();
  if (!active || !directiveNeedsUrn(active.directive)) {
    toast('Active case does not need a family urn');
    return;
  }
  const urnId = pickFamilyUrnRequest(active, state.reputation);
  useGameStore.setState((s) => ({
    cases: s.cases.map((c) =>
      c.id === active.id
        ? { ...c, familyRequestedUrnId: urnId, familyUrnDueAt: null }
        : c
    ),
    inboxFiles: s.inboxFiles.map((f) =>
      f.id === active.id
        ? { ...f, familyRequestedUrnId: urnId, isRead: false }
        : f
    ),
    intakeToast: `[DEV] Family urn → ${urnId}`,
  }));
}

const KNOWN_STORAGE_KEYS = [
  'ossuarian-first-urn-v1',
  'ossuarian-dev-clock-offset',
  'ossuarian-dev-fab-pos',
] as const;

function wipeBrowserStorage() {
  clearClockOffsetStorage();

  try {
    sessionStorage.removeItem('ofu-demo-urn-phase');
    const sessionKill: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('ossuarian') || k.startsWith('ofu-'))) {
        sessionKill.push(k);
      }
    }
    for (const k of sessionKill) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }

  try {
    for (const key of KNOWN_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('ossuarian') || k.startsWith('ofu-'))) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }

  // Best-effort IndexedDB wipe (Capacitor does not use Preferences for save).
  try {
    if (typeof indexedDB?.databases === 'function') {
      void indexedDB.databases().then((dbs) => {
        for (const db of dbs) {
          if (
            db.name &&
            (db.name.includes('ossuarian') || db.name.includes('ofu-'))
          ) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      });
    }
  } catch {
    /* ignore */
  }
}

/**
 * Capacitor-safe full wipe → title screen.
 *
 * v0.9.9 Android failure root causes:
 * 1) `window.confirm` often fails silently in Capacitor WebView → reset never ran
 * 2) `location.replace` flushed dirty Zustand state back into localStorage after
 *    clearStorage, so reload rehydrated the old save (no title)
 * 3) Same-URL navigation may not remount the SPA — must set hasStartedGame false
 *
 * Fix: pause persist writes → clear storage → hardReset in memory → toast.
 * No native confirm; no location.reload dependency.
 */
export function resetGame() {
  pauseGamePersistWrites();

  try {
    resumeGamePersistWrites();
    useGameStore.persist.clearStorage();
  } catch {
    /* ignore */
  }
  wipeBrowserStorage();
  pauseGamePersistWrites();

  // In-memory title screen (App.tsx gates on hasStartedGame)
  useGameStore.getState().hardResetGameState();

  // Resume persist shortly with the fresh empty state so a later cold start stays clean
  window.setTimeout(() => {
    try {
      resumeGamePersistWrites();
      // Nudge persist to write the fresh slice (hasStartedGame: false, empty cases)
      useGameStore.setState((s) => ({ intakeToast: s.intakeToast }));
    } catch {
      /* ignore */
    }
  }, 150);
}

/** @deprecated Prefer resetGame — kept as alias for older Dev Tools labels. */
export function resetSave() {
  resetGame();
}

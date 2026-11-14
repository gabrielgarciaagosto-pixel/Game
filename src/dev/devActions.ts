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
import { URN_CATALOG } from '../data/urnCatalog';
import { IDLE_RETORT } from '../retort/retortTypes';
import {
  generateRandomCase,
  useGameStore,
} from '../store/useGameStore';
import type { DispositionDirective } from '../types/game';
import { audioManager } from '../utils/audioManager';
import {
  advanceClockBy,
  gameNow,
  resetClockOffset,
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
  const n = Math.max(0, Math.round(value));
  useGameStore.setState({ cash: n });
  toast(`Cash = $${n}`);
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
  };
  useGameStore.setState({
    cases: [...state.cases, next],
    inboxFiles: [
      {
        id: next.id,
        decedentName: next.name,
        intakeTimestamp: next.arrivedAt,
        weightLbs: next.weightLbs,
        tissueCondition: next.tissueCondition,
        directive: next.directive,
        preferredFlowers: next.preferredFlowers,
        isRead: false,
        serviceDateMs: next.serviceDateMs,
        familyRequestedUrnId: null,
      },
      ...state.inboxFiles,
    ],
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
  const caseId = r.caseId ?? state.activeCaseId;
  if (!caseId) {
    toast('No active crematory case');
    return;
  }
  const active = state.cases.find((c) => c.id === caseId);
  if (!active) {
    toast('Case missing');
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
    state.completeCremation('A', Math.round(active.weightLbs * 0.035 * 453.6), caseId);
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
  useGameStore.setState({
    facilityLevels,
    cremulatorOwned: true,
    cremulatorDamaged: false,
  });
  toast('Facility upgrades maxed');
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

export function resetSave() {
  try {
    localStorage.removeItem('ossuarian-first-urn-v1');
    resetClockOffset();
  } catch {
    /* ignore */
  }
  window.location.reload();
}

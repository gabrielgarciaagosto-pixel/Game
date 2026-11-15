import type { FacilityUpgradeLevels } from '../data/facilityUpgrades';
import {
  defaultRetortBay,
  normalizeBay,
  type RetortBay,
} from '../data/crematoryCatalog';
import { IDLE_RETORT, type RetortMachine } from './retortTypes';

export function retortCount(levels: FacilityUpgradeLevels | undefined): number {
  const extra = levels?.retort_bay ?? 0;
  return 1 + Math.max(0, Math.min(2, extra));
}

export function alignMachines(
  machines: RetortMachine[] | undefined,
  active: RetortMachine,
  index: number,
  count: number
): { machines: RetortMachine[]; index: number } {
  const src = (
    machines && machines.length > 0 ? machines : [active]
  ).map((m) => ({
    ...IDLE_RETORT,
    ...m,
    fuelCharged: m.fuelCharged === true,
  }));
  const idx = Math.max(0, Math.min(Math.max(0, count - 1), index || 0));
  while (src.length <= idx) src.push({ ...IDLE_RETORT });
  src[idx] = {
    ...IDLE_RETORT,
    ...active,
    fuelCharged: active.fuelCharged === true,
  };
  while (src.length < count) src.push({ ...IDLE_RETORT });
  return { machines: src.slice(0, count), index: idx };
}

export function alignBays(
  bays: RetortBay[] | undefined,
  count: number
): RetortBay[] {
  const src = (bays ?? []).map((b) => normalizeBay(b));
  while (src.length < count) src.push(defaultRetortBay());
  return src.slice(0, count);
}

export function machineIsBusy(m: RetortMachine): boolean {
  return m.caseId != null && m.phase !== 'IDLE' && m.phase !== 'DONE';
}

export function freshLoad(
  caseId: string,
  preheat: boolean
): RetortMachine {
  return {
    ...IDLE_RETORT,
    caseId,
    phase: 'LOAD',
    primaryTemp: preheat ? 480 : IDLE_RETORT.primaryTemp,
    secondaryTemp: preheat ? 360 : IDLE_RETORT.secondaryTemp,
  };
}

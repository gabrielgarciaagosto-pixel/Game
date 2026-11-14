import type { SweepTool } from '../types/game';

export type RetortPhase = 'IDLE' | 'LOAD' | 'BURN' | 'SWEEP' | 'DONE';

export type RetortAudioMode = 'OFF' | 'START' | 'LOOP';

export interface RetortMachine {
  caseId: string | null;
  phase: RetortPhase;
  blowerOn: boolean;
  purging: boolean;
  heated: boolean;
  purgeEndsAt: number | null;
  secondaryOn: boolean;
  primaryOn: boolean;
  secondaryTemp: number;
  primaryTemp: number;
  doorOpen: number;
  doorMoving: 'UP' | 'DOWN' | null;
  elapsedSec: number;
  stirCount: number;
  earlyPrimaryStarts: number;
  thermalWarnings: number;
  audioMode: RetortAudioMode;
  /** Persists across Back so sweep isn't redone after leaving */
  largeBonesLeft: number;
  mediumBonesLeft: number;
  fineAshLeft: number;
  activeTool: SweepTool | null;
  /** Operator-calibrated Honeywell set points, °F */
  primarySetPoint: number;
  secondarySetPoint: number;
}

export const SECONDARY_SP = 1700;
export const PRIMARY_SP = 1600;
export const PRIMARY_SP_MIN = 1000;
export const PRIMARY_SP_MAX = 1800;
export const SECONDARY_SP_MIN = 1200;
export const SECONDARY_SP_MAX = 1850;
export const DOOR_STEP = 0.008;
export const BURN_TICK_MS = 250;
export const STIR_DOOR_MIN = 0.16;

export const IDLE_RETORT: RetortMachine = {
  caseId: null,
  phase: 'IDLE',
  blowerOn: false,
  purging: false,
  heated: false,
  purgeEndsAt: null,
  secondaryOn: false,
  primaryOn: false,
  secondaryTemp: 72,
  primaryTemp: 72,
  doorOpen: 0,
  doorMoving: null,
  elapsedSec: 0,
  stirCount: 0,
  earlyPrimaryStarts: 0,
  thermalWarnings: 0,
  audioMode: 'OFF',
  largeBonesLeft: 100,
  mediumBonesLeft: 100,
  fineAshLeft: 100,
  activeTool: null,
  primarySetPoint: PRIMARY_SP,
  secondarySetPoint: SECONDARY_SP,
};

export function randomPurgeMs(): number {
  return 8000 + Math.floor(Math.random() * 10001);
}

export function retortProgress(
  elapsedSec: number,
  targetDurationSec: number
): number {
  if (targetDurationSec <= 0) return 0;
  return Math.min(1, elapsedSec / targetDurationSec);
}

/**
 * Family urn-choice pacing.
 *
 * Families send a vessel request FAMILY_URN_CHOICE_MIN–MAX "family minutes"
 * after the body arrives. Scale real time with FAMILY_MINUTE_MS so a session
 * still feels snappy (default: 6s real ≈ 1 family minute → ~36–54s wait).
 */
export const FAMILY_MINUTE_MS = 6_000;

/** Inclusive window after arrival, in family minutes. */
export const FAMILY_URN_CHOICE_MIN_MINUTES = 6;
export const FAMILY_URN_CHOICE_MAX_MINUTES = 9;

export function rollFamilyUrnDueAt(arrivedAt: number): number {
  const span =
    FAMILY_URN_CHOICE_MAX_MINUTES - FAMILY_URN_CHOICE_MIN_MINUTES + 1;
  const minutes =
    FAMILY_URN_CHOICE_MIN_MINUTES + Math.floor(Math.random() * span);
  return arrivedAt + minutes * FAMILY_MINUTE_MS;
}

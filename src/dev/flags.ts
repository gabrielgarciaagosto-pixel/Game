/**
 * Developer tools overlay gate.
 *
 * Release strip: set to `false`, or build with `VITE_DEV_TOOLS=0`.
 * Demo builds leave this `true` (or `VITE_DEV_TOOLS=1`) so Gabriel can QA.
 */
const envFlag = import.meta.env.VITE_DEV_TOOLS;

export const DEV_TOOLS: boolean =
  envFlag === '0' || envFlag === 'false'
    ? false
    : envFlag === '1' || envFlag === 'true'
      ? true
      : true; // default ON for this demo branch — flip to false for store release

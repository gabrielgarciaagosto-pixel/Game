/**
 * Developer tools.
 *
 * Internal builds leave them on unless `VITE_DEV_TOOLS=0`.
 * A public itch.io package sets `VITE_PUBLIC_DEMO=1`, which forces this
 * off and lets the bundler drop the overlay, the FILES DEV button, and
 * the seven-tap summon.
 */
const envFlag = import.meta.env.VITE_DEV_TOOLS;

export const DEV_TOOLS: boolean =
  import.meta.env.VITE_PUBLIC_DEMO === '1'
    ? false
    : envFlag === '0' || envFlag === 'false'
      ? false
      : envFlag === '1' || envFlag === 'true'
        ? true
        : true;

import { lazy, Suspense } from 'react';

const Chip =
  __OSSUARIAN_ROLE__ === 'master'
    ? lazy(() => import('./dm/LiveCountChip').then((mod) => ({ default: mod.LiveCountChip })))
    : null;

/** Empty on the public build, so the monitor is not in that bundle. */
export function MasterSlot() {
  if (!Chip) return null;
  return (
    <Suspense fallback={null}>
      <Chip />
    </Suspense>
  );
}

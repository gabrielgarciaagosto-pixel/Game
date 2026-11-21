import { Capacitor, registerPlugin } from '@capacitor/core';

interface HouseExitPlugin {
  finishAndRemove(): Promise<void>;
}

const HouseExit = registerPlugin<HouseExitPlugin>('HouseExit');

/** Android removes the task. A browser closes the window when it is allowed to. */
export function leaveTheHouse(): void {
  if (Capacitor.isNativePlatform()) {
    void HouseExit.finishAndRemove().catch(() => {
      window.close();
    });
    return;
  }
  window.close();
}

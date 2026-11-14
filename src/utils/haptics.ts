import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function hapticGlug(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Web / unsupported — ignore
  }
}

export async function hapticIronRake(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // Web / unsupported — ignore
  }
}

export async function hapticHammer(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Web / unsupported — ignore
  }
}

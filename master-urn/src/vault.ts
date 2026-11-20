import { Capacitor, registerPlugin } from '@capacitor/core';

interface VaultPlugin {
  get(options: { key: string }): Promise<{ value?: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}

const NativeVault = registerPlugin<VaultPlugin>('MasterVault');

/** Android only. The web preview keeps nothing on disk. */
export function nativeVault(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export async function vaultGet(key: string): Promise<string | null> {
  if (!nativeVault()) return null;
  try {
    const result = await NativeVault.get({ key });
    return typeof result.value === 'string' ? result.value : null;
  } catch {
    return null;
  }
}

export async function vaultSet(key: string, value: string): Promise<void> {
  if (!nativeVault()) return;
  await NativeVault.set({ key, value });
}

export async function vaultRemove(key: string): Promise<void> {
  if (!nativeVault()) return;
  try {
    await NativeVault.remove({ key });
  } catch {
    /* a missing vault still counts as signed out */
  }
}

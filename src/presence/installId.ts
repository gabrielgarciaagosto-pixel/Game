const INSTALL_KEY = 'ossuarian-install-id';

/** A random id created on this install. It is not a device id and it is not the save file. */
export function getInstallId(): string {
  try {
    const existing = localStorage.getItem(INSTALL_KEY);
    if (existing && /^[A-Za-z0-9]{16,80}$/.test(existing)) return existing;
    const id = newInstallId();
    localStorage.setItem(INSTALL_KEY, id);
    return id;
  } catch {
    return newInstallId();
  }
}

function newInstallId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `ins${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

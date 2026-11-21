export type PlayPlatform = 'web' | 'android' | 'ios';

export function playPlatform(): PlayPlatform {
  const cap = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const name = cap?.getPlatform?.();
  if (name === 'android' || name === 'ios') return name;
  return 'web';
}

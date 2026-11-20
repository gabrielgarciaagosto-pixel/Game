export interface NamedPlayer {
  installId: string;
  playerName: string;
  firstSeen: number;
  lastSeen: number;
}

/** Same chosen name, in order of first appearance. A name used once stays plain. */
export function displayNameMap(players: readonly NamedPlayer[]): Map<string, string> {
  const groups = new Map<string, NamedPlayer[]>();
  for (const player of players) {
    const key = player.playerName.trim() || 'Mortician';
    const list = groups.get(key) ?? [];
    list.push(player);
    groups.set(key, list);
  }
  const names = new Map<string, string>();
  for (const [key, list] of groups) {
    list.sort(
      (a, b) =>
        (a.firstSeen || a.lastSeen) - (b.firstSeen || b.lastSeen) ||
        a.installId.localeCompare(b.installId)
    );
    if (list.length === 1) {
      names.set(list[0]!.installId, key);
      continue;
    }
    list.forEach((player, index) => {
      names.set(player.installId, `${key} ${index + 1}`);
    });
  }
  return names;
}

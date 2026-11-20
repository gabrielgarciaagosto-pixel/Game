import { HOUSE_HOLD_MS, readHouseLines } from '../news/houseLines';
import { useGameStore } from '../store/useGameStore';
import { gameNow } from '../utils/gameNow';

/** Put the newest parlor line on the wire. County lines keep their own slots. */
export function primeHouseWire(): void {
  const now = gameNow();
  const newest = readHouseLines().reduce<ReturnType<typeof readHouseLines>[number] | null>(
    (best, line) => {
      if (!best || line.createdAt > best.createdAt) return line;
      return best;
    },
    null
  );
  if (!newest) return;
  if (now < newest.createdAt - 2 * 60 * 1000) return;
  if (now >= newest.createdAt + HOUSE_HOLD_MS) return;
  const state = useGameStore.getState();
  if (state.newsWire.some((item) => item.headlineId === newest.id)) return;
  useGameStore.setState({
    newsWire: [
      {
        headlineId: newest.id,
        startedAt: newest.createdAt,
        endsAt: newest.createdAt + HOUSE_HOLD_MS,
        live: false,
      },
      ...state.newsWire.filter((item) => !item.headlineId.startsWith('house')),
    ],
  });
}

/**
 * Legendary Spirits. A quiet visit after an S+ farewell.
 * Not the Tutorial Spirit, and not spirit mischief.
 * Voice: plain, warm, funerary. No em dashes.
 */

export interface LegendarySpirit {
  id: string;
  name: string;
  hint: string;
  story: string;
  quirk: string;
  rival: string;
  /** A rare trade secret. Shown only on a small extra roll. */
  secret: string;
  vesselKind: 'urn' | 'casket';
  vesselId: string;
}

export const LEGENDARY_SPIRITS: readonly LegendarySpirit[] = [
  {
    id: 'ada-pell',
    name: 'Ada Pell',
    hint: 'She keeps smoothing a hem that is no longer there.',
    story:
      'Ada stitched linings for this house before the war. She liked a straight seam and a cup of tea left where the family could find it. She is not in a hurry. She only wants to know the room was kind.',
    quirk: 'She hums when the chapel lights go warm.',
    rival:
      'The parlor on Maple still irons the guest book. Ada says a name can be a little crooked and still be loved.',
    secret:
      'A steady retort does more for the ashes than a hot one. She learned that from the night man.',
    vesselKind: 'urn',
    vesselId: 'urn_rose_bronze_vase',
  },
  {
    id: 'holt',
    name: 'Mr. Holt',
    hint: 'A watchman. He counts the bays the way he used to count doors.',
    story:
      'Mr. Holt walked the cooler after midnight for thirty years. He tagged every stranger himself, because a lost name felt like a door left open. He nods if the bay lamp is honest.',
    quirk: 'He taps twice on the door frame, then lets it be.',
    rival:
      'The night crew across town leaves bodies in the hall. Holt would not take a coffee from them.',
    secret:
      'Two or three new arrivals, and an untagged name slips. Tag first. The paperwork can wait a minute.',
    vesselKind: 'casket',
    vesselId: 'casket_bronze_octagon',
  },
  {
    id: 'june-keel',
    name: 'June Keel',
    hint: 'She is listening for the hymn the family actually asked for.',
    story:
      'June sang at more farewells than she could count. She liked the verse the family chose, not the one the organist preferred. If the music is right, she stays through the last note and then grows quiet.',
    quirk: 'She mouths the words and does not need the book.',
    rival:
      'The chapel on Third plays the same march for everyone. June calls that a habit, not a kindness.',
    secret:
      'Roses on the bier matter more than a second spray. Put the asked flower where the family sits.',
    vesselKind: 'urn',
    vesselId: 'urn_porcelain_night',
  },
  {
    id: 'elias-porter',
    name: 'Elias Porter',
    hint: 'He keeps a hand on the coach rail, as if the horses were still there.',
    story:
      'Elias drove for a rival house and left them when they rushed a winter burial. He came here because the lane was plowed and the family was not hurried down it. He likes a slow coach and a driver who waits.',
    quirk: 'He checks the wheels, then pretends he did not.',
    rival:
      'His old barn still boasts about speed. Elias says a fast cortege is just a loud one.',
    secret:
      'The coach you send is the one the town remembers. A plain honest car beats a borrowed shine.',
    vesselKind: 'casket',
    vesselId: 'casket_bronze_octagon',
  },
  {
    id: 'captain-voss',
    name: 'Captain Voss',
    hint: 'River pilot. He talks like the water is still in the room.',
    story:
      'Voss asked to be kept simple, and his family almost talked him into marble he did not want. He is gentle about it. He likes a vessel with a plain shoulder and no speech over it.',
    quirk: 'He watches the window, not the wreath.',
    rival:
      'The riverside chapel sells the view. Voss says the river was free and the sermon was not.',
    secret:
      'A thin shelf makes a family feel rushed. Four honest choices are kinder than one grand one.',
    vesselKind: 'urn',
    vesselId: 'urn_rose_bronze_vase',
  },
  {
    id: 'miss-bramble',
    name: 'Miss Bramble',
    hint: 'She smells of cut stems and cold water.',
    story:
      'Miss Bramble kept the flower room when this block was still a boarding street. She remembers which families wanted lilies and which only said they did. She will not scold. She will notice.',
    quirk: 'She turns a vase a quarter turn, then leaves it.',
    rival:
      'The shop on King Street dyes carnations. She calls that paint, and she smiles when she says it.',
    secret:
      'If they named a song and a flower, those two things carry the whole room. The rest is welcome, not required.',
    vesselKind: 'urn',
    vesselId: 'urn_porcelain_night',
  },
];

export const LEGENDARY_CROSS_REP = 6;
export const LEGENDARY_VESSEL_CHANCE = 0.5;

export function legendarySpiritById(id: string): LegendarySpirit | null {
  return LEGENDARY_SPIRITS.find((spirit) => spirit.id === id) ?? null;
}

/**
 * One die, only after an S+ farewell. A six means someone lingered.
 * Anything else is a quiet miss. No announcement.
 */
export function rollLegendaryVisit(
  rng: () => number = Math.random
): { die: number; spirit: LegendarySpirit; showSecret: boolean } | null {
  const die = 1 + Math.floor(rng() * 6);
  if (die !== 6) return null;
  const spirit =
    LEGENDARY_SPIRITS[Math.floor(rng() * LEGENDARY_SPIRITS.length)];
  return { die, spirit, showSecret: rng() < 0.15 };
}

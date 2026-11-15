/** Lampblack Coach & Motor — cortege catalog (fictional). */

export type FleetClass = 'RECOVERY' | 'ESCORT' | 'FLOWER' | 'COACH';

export interface FleetVehicle {
  id: string;
  fleetClass: FleetClass;
  tier: 1 | 2 | 3 | 4;
  tierName: string;
  name: string;
  era: string;
  price: number;
  /** Recovery vans: reputation on a successful service */
  repBonus: number;
  /** Escorts and flower cars: extra cash on a successful service */
  moneyBonus: number;
  /** Hearses: interment points this service (also added to the house total) */
  interment: number;
  /** Parish coaches: reputation on every successful service */
  serviceRep?: number;
  /** Parish coaches: cash kept each service (cheaper upkeep) */
  upkeepSaved?: number;
  /** Parish coaches: reputation only when the service includes a viewing or burial */
  memorialRep?: number;
  /** Parish coaches: extra family tip */
  houseTip?: number;
  length: string;
  power: string;
  crew: string;
  finish: string;
  blurb: string;
  /** Coachbuilder, set only on the parish-body variants. */
  builder?: string;
  builderLine?: string;
}

export interface FleetAssignment {
  recovery: string | null;
  escort: string | null;
  flower: string | null;
  coach: string | null;
}

export const EMPTY_FLEET_ASSIGNMENT: FleetAssignment = {
  recovery: null,
  escort: null,
  flower: null,
  coach: null,
};

export const FLEET_BRAND = 'Lampblack Coach & Motor';
export const FLEET_DOMAIN = 'www.lampblackcoach.biz';

/** Catalog ids withdrawn from the line. Price is returned once on load. */
export const RETIRED_FLEET_REFUNDS: Record<string, number> = {
  rec_silent_arrival: 24000,
};

const HEARTH = {
  builder: 'Hearth & Hollis',
  builderLine:
    'Parish squares from a river-town shop that still pads roofs by hand.',
};
const MARROW = {
  builder: 'Marrow & Keene',
  builderLine: 'The same box, finished for houses that skip the shine.',
};
const VESPER = {
  builder: 'Vesper Landau Works',
  builderLine: 'One quiet iron and a smaller lamp on the 1994 footprint.',
};
const SABLE = {
  builder: 'Sable Parish Coach',
  builderLine: 'Two-tone roofs and a thin belt. The silhouette stays put.',
};
const QUILL = {
  builder: 'Quill & Rocker',
  builderLine: 'Lamp and wheel changes only. The parish body does not move.',
};

function pewterVariant(
  id: string,
  name: string,
  price: number,
  finish: string,
  blurb: string,
  house: { builder: string; builderLine: string },
  edge: {
    interment?: number;
    serviceRep?: number;
    upkeepSaved?: number;
    memorialRep?: number;
    houseTip?: number;
  } = {}
): FleetVehicle {
  return {
    id,
    fleetClass: 'COACH',
    tier: 1,
    tierName: 'Budget',
    name,
    era: '1994 square',
    price,
    repBonus: 0,
    moneyBonus: 0,
    interment: edge.interment ?? 6,
    serviceRep: edge.serviceRep ?? 0,
    upkeepSaved: edge.upkeepSaved ?? 0,
    memorialRep: edge.memorialRep ?? 0,
    houseTip: edge.houseTip ?? 0,
    length: "19'6\"",
    power: '5.7L V8',
    crew: 'Casket + 2',
    finish,
    blurb,
    builder: house.builder,
    builderLine: house.builderLine,
  };
}

export const FLEET_CATALOG: FleetVehicle[] = [
  {
    id: 'rec_parish_panel',
    fleetClass: 'RECOVERY',
    tier: 1,
    tierName: 'Budget',
    name: 'Parish Panel',
    era: '1994 municipal',
    price: 1450,
    repBonus: 3,
    moneyBonus: 0,
    interment: 0,
    length: "17'2\"",
    power: '4.3L V6',
    crew: '2 + cot',
    finish: 'Appliance white',
    blurb: 'Square first-call van. Honest, unmarked, and a little loud in the alley.',
  },
  {
    id: 'rec_night_call',
    fleetClass: 'RECOVERY',
    tier: 2,
    tierName: 'Established',
    name: 'Night Call Wagon',
    era: '2008 discreet',
    price: 4800,
    repBonus: 7,
    moneyBonus: 0,
    interment: 0,
    length: "18'4\"",
    power: '5.3L V8',
    crew: '2 + cot',
    finish: 'Midnight navy',
    blurb: 'Privacy glass and a quiet beltline. Families notice the van less, and the house more.',
  },
  {
    id: 'rec_laurel',
    fleetClass: 'RECOVERY',
    tier: 3,
    tierName: 'Formal',
    name: 'Laurel Removal',
    era: '2016 coachbuilt',
    price: 11500,
    repBonus: 12,
    moneyBonus: 0,
    interment: 0,
    length: "19'8\"",
    power: '6.0L V8',
    crew: '3 + cot',
    finish: 'Black, gold pinstripe',
    blurb: 'Skirted arches and a curtained quarter. Removal that already looks like the procession.',
  },
  {
    id: 'esc_civic_lead',
    fleetClass: 'ESCORT',
    tier: 1,
    tierName: 'Budget',
    name: 'Civic Lead',
    era: '2002 sedan',
    price: 1800,
    repBonus: 0,
    moneyBonus: 120,
    interment: 0,
    length: "15'8\"",
    power: '3.8L V6',
    crew: 'Driver + clergy',
    finish: 'Plain black',
    blurb: 'A notchback that knows the cemetery gate. Modest, but it heads the line.',
  },
  {
    id: 'esc_procession_twin',
    fleetClass: 'ESCORT',
    tier: 3,
    tierName: 'Formal',
    name: 'Procession Twin',
    era: '1966 dresser',
    price: 9400,
    repBonus: 0,
    moneyBonus: 460,
    interment: 0,
    length: "8'4\"",
    power: '74 ci twin',
    crew: 'Rider',
    finish: 'Black plate, chrome',
    blurb: 'A dresser with a funeral pennant. Clears intersections and fattens the invoice.',
  },
  {
    id: 'esc_family_landau',
    fleetClass: 'ESCORT',
    tier: 4,
    tierName: 'House',
    name: 'Family Landau',
    era: '2019 limousine',
    price: 27500,
    repBonus: 0,
    moneyBonus: 820,
    interment: 0,
    length: "24'6\"",
    power: '6.2L V8',
    crew: '8 passengers',
    finish: 'Black, opera lamps',
    blurb: 'Three-window stretch with a landau quarter. The family pays for the quiet mile.',
  },
  {
    id: 'esc_garden_deck',
    fleetClass: 'FLOWER',
    tier: 2,
    tierName: 'Established',
    name: 'Ivory Deck',
    era: '1991 flower car',
    price: 6200,
    repBonus: 0,
    moneyBonus: 280,
    interment: 0,
    length: "18'4\"",
    power: '4.5L V8',
    crew: 'Driver',
    finish: 'Ivory, chrome rails',
    blurb: 'Sedan cab and an open bed. Twin chrome moldings, a bed rail, and multi-spoke wheels. Sprays ride in the open.',
  },
  {
    id: 'flw_forty_one',
    fleetClass: 'FLOWER',
    tier: 4,
    tierName: 'House',
    name: 'Forty-One Bed',
    era: '1941 flower car',
    price: 16400,
    repBonus: 0,
    moneyBonus: 520,
    interment: 0,
    length: "18'8\"",
    power: 'Straight-8',
    crew: 'Driver',
    finish: 'Ivory, chrome disc',
    blurb: 'Rounded cab, pontoon fenders, a tall grille, and a long open bed with a low chrome rail. Whitewalls.',
  },
  {
    id: 'coa_parish_box',
    fleetClass: 'COACH',
    tier: 1,
    tierName: 'Budget',
    name: 'Pewter Parish',
    era: '1994 square',
    price: 3200,
    repBonus: 0,
    moneyBonus: 0,
    interment: 6,
    length: "19'6\"",
    power: '5.7L V8',
    crew: 'Casket + 2',
    finish: 'Pewter, black roof',
    blurb: 'Boxy landau. Rectangular lamps, a black padded roof, twin chrome irons, and wide whitewalls.',
  },
  pewterVariant(
    'coa_pewter_hollis_square',
    'Hollis Square',
    3600,
    'Cool gray, alloy wheels',
    'The parish body in cool gray, with the twin irons kept and alloy wheels in the same wells.',
    HEARTH,
    { serviceRep: 1 }
  ),
  pewterVariant(
    'coa_pewter_hollis_night',
    'Hollis Night',
    3900,
    'Near-black, rear pad',
    'Near-black paint and a rear roof pad only. Whitewalls stay where the original put them.',
    HEARTH,
    { serviceRep: 2 }
  ),
  pewterVariant(
    'coa_pewter_hollis_chapel',
    'Hollis Chapel',
    4200,
    'Warm stone, disc wheels',
    'Warm stone paint, one landau iron, and a chrome disc over the whitewall.',
    HEARTH,
    { serviceRep: 3 }
  ),
  pewterVariant(
    'coa_pewter_keene_plain',
    'Keene Plain',
    2800,
    'Charcoal, blackwalls',
    'No landau irons and no belt. Blackwall tires on the parish wells.',
    MARROW,
    { upkeepSaved: 40 }
  ),
  pewterVariant(
    'coa_pewter_keene_iron',
    'Keene Iron',
    3400,
    'Olive gray, blackwalls',
    'Olive gray, the twin irons returned, and blackwall tires.',
    MARROW,
    { upkeepSaved: 80 }
  ),
  pewterVariant(
    'coa_pewter_keene_disc',
    'Keene Disc',
    4100,
    'Slate, disc whitewall',
    'Slate paint, a single iron, and a disc hub on the whitewall.',
    MARROW,
    { upkeepSaved: 120 }
  ),
  pewterVariant(
    'coa_pewter_vesper_arch',
    'Vesper Arch',
    4500,
    'Blue-gray, arched iron',
    'One arched iron and a round tail lamp. The 1994 body is unchanged.',
    VESPER,
    { interment: 8 }
  ),
  pewterVariant(
    'coa_pewter_vesper_low',
    'Vesper Low',
    4300,
    'Pewter, low roof pad',
    'A lower roof pad, one iron, and alloy wheels in the original wells.',
    VESPER,
    { interment: 7 }
  ),
  pewterVariant(
    'coa_pewter_vesper_lantern',
    'Vesper Lantern',
    4800,
    'Warm gray, round lamp',
    'Round headlamp, an arched iron, and wire wheels. Same nose, same roof line.',
    VESPER,
    { interment: 8, serviceRep: 1 }
  ),
  pewterVariant(
    'coa_pewter_sable_split',
    'Sable Split',
    4000,
    'Light body, black quarter',
    'Light paint, a black rear roof only, and a thin belt. Whitewalls.',
    SABLE,
    { memorialRep: 2 }
  ),
  pewterVariant(
    'coa_pewter_sable_wire',
    'Sable Wire',
    4600,
    'Ivory-gray, wire wheels',
    'Ivory-gray paint, twin irons, and wire wheels. The box does not grow.',
    SABLE,
    { interment: 7, memorialRep: 3 }
  ),
  pewterVariant(
    'coa_pewter_quill_alloy',
    'Quill Alloy',
    3700,
    'Medium gray, stacked lamps',
    'Stacked lamps and alloy wheels. One iron. The parish silhouette stays.',
    QUILL,
    { houseTip: 55 }
  ),
  pewterVariant(
    'coa_pewter_quill_stack',
    'Quill Stack',
    3500,
    'Green-gray, blackwalls',
    'Stacked lamps, no extra iron, blackwall tires. The body path is the parish body.',
    QUILL,
    { houseTip: 30 }
  ),
  {
    id: 'coa_iron_landau',
    fleetClass: 'COACH',
    tier: 2,
    tierName: 'Established',
    name: 'Draper Eight',
    era: '1938 formal',
    price: 8600,
    repBonus: 0,
    moneyBonus: 0,
    interment: 14,
    length: "19'2\"",
    power: 'Straight-8',
    crew: 'Casket + attendant',
    finish: 'Lampblack, chrome disc',
    blurb: 'Pontoon fenders, a running board, and three carved drape panels on the casket compartment. Whitewalls.',
  },
  {
    id: 'coa_glass_formal',
    fleetClass: 'COACH',
    tier: 3,
    tierName: 'Formal',
    name: 'Silver Landau',
    era: '2006 formal',
    price: 16800,
    repBonus: 0,
    moneyBonus: 0,
    interment: 24,
    length: "21'4\"",
    power: '4.6L V8',
    crew: 'Full couch casket',
    finish: 'Silver, black landau',
    blurb: 'Long hood, three curtained panes, a black landau cap, and one arched chrome bar with a lantern at the break.',
  },
  {
    id: 'coa_state_landaulette',
    fleetClass: 'COACH',
    tier: 4,
    tierName: 'House',
    name: 'Crest Landau',
    era: '2018 formal',
    price: 36000,
    repBonus: 0,
    moneyBonus: 0,
    interment: 38,
    length: "21'8\"",
    power: '3.6L V6',
    crew: 'State casket',
    finish: 'Gloss lampblack',
    blurb: 'Crossover hearse. Padded landau roof, an angular chrome sash, a rear swoosh, and multi-spoke wheels. The house coach.',
  },
];

export const FLEET_CLASS_LABEL: Record<FleetClass, string> = {
  RECOVERY: 'Recovery',
  ESCORT: 'Escort',
  FLOWER: 'Flower car',
  COACH: 'Coaches',
};

export function getFleetVehicle(id: string | null | undefined): FleetVehicle | null {
  if (!id) return null;
  return FLEET_CATALOG.find((v) => v.id === id) ?? null;
}

export function fleetsByClass(fleetClass: FleetClass): FleetVehicle[] {
  return FLEET_CATALOG.filter((v) => v.fleetClass === fleetClass).sort(
    (a, b) => a.tier - b.tier
  );
}

export function normalizeFleetAssignment(raw: unknown): FleetAssignment {
  const r = (raw ?? {}) as Partial<FleetAssignment>;
  const pick = (id: unknown, fleetClass: FleetClass) => {
    if (typeof id !== 'string') return null;
    const v = getFleetVehicle(id);
    return v && v.fleetClass === fleetClass ? v.id : null;
  };
  return {
    recovery: pick(r.recovery, 'RECOVERY'),
    escort: pick(r.escort, 'ESCORT'),
    flower: pick(r.flower, 'FLOWER'),
    coach: pick(r.coach, 'COACH'),
  };
}

/** Coach rank for auto-best. Interment leads. A parish perk cannot pass the next tier. */
function classBonus(v: FleetVehicle): number {
  if (v.fleetClass === 'RECOVERY') return v.repBonus;
  if (v.fleetClass === 'ESCORT' || v.fleetClass === 'FLOWER') return v.moneyBonus;
  return (
    v.interment * 100 +
    (v.serviceRep ?? 0) * 12 +
    (v.memorialRep ?? 0) * 8 +
    Math.round((v.upkeepSaved ?? 0) / 25) +
    Math.round((v.houseTip ?? 0) / 20)
  );
}

/** Highest tier owned in a class (bonus breaks ties). */
export function bestOwnedInClass(
  ownedIds: string[],
  fleetClass: FleetClass
): FleetVehicle | null {
  const owned = new Set(ownedIds);
  const pool = FLEET_CATALOG.filter(
    (v) => v.fleetClass === fleetClass && owned.has(v.id)
  );
  if (pool.length === 0) return null;
  return pool.sort(
    (a, b) => b.tier - a.tier || classBonus(b) - classBonus(a)
  )[0];
}

export interface CortegePick {
  recovery: FleetVehicle | null;
  escort: FleetVehicle | null;
  flower: FleetVehicle | null;
  coach: FleetVehicle | null;
  /** True when that slot is an explicit assignment rather than auto-best */
  assigned: {
    recovery: boolean;
    escort: boolean;
    flower: boolean;
    coach: boolean;
  };
}

/** Explicit assignment if that vehicle is owned; otherwise the best in class. */
export function resolveCortege(
  ownedIds: string[],
  assignment: FleetAssignment | null | undefined
): CortegePick {
  const a = normalizeFleetAssignment(assignment);
  const owned = new Set(ownedIds);
  const slot = (
    fleetClass: FleetClass,
    explicitId: string | null
  ): { vehicle: FleetVehicle | null; assigned: boolean } => {
    if (explicitId && owned.has(explicitId)) {
      const v = getFleetVehicle(explicitId);
      if (v && v.fleetClass === fleetClass) return { vehicle: v, assigned: true };
    }
    return { vehicle: bestOwnedInClass(ownedIds, fleetClass), assigned: false };
  };
  const recovery = slot('RECOVERY', a.recovery);
  const escort = slot('ESCORT', a.escort);
  const flower = slot('FLOWER', a.flower);
  const coach = slot('COACH', a.coach);
  return {
    recovery: recovery.vehicle,
    escort: escort.vehicle,
    flower: flower.vehicle,
    coach: coach.vehicle,
    assigned: {
      recovery: recovery.assigned,
      escort: escort.assigned,
      flower: flower.assigned,
      coach: coach.assigned,
    },
  };
}

export function fleetBonusLine(v: FleetVehicle): string {
  if (v.fleetClass === 'RECOVERY') return `+${v.repBonus} reputation`;
  if (v.fleetClass === 'ESCORT' || v.fleetClass === 'FLOWER') {
    return `+$${v.moneyBonus.toLocaleString()} cortege`;
  }
  const parts = [`Interment +${v.interment}`];
  if (v.serviceRep) parts.push(`Family +${v.serviceRep}`);
  if (v.memorialRep) parts.push(`Memorial +${v.memorialRep}`);
  if (v.upkeepSaved) parts.push(`Saves $${v.upkeepSaved} upkeep`);
  if (v.houseTip) parts.push(`Adds $${v.houseTip} tip`);
  return parts.join(' · ');
}

/** One sentence for the coach detail sheet. Empty when the coach is interment only. */
export function coachPerkNote(v: FleetVehicle): string | null {
  if (v.fleetClass !== 'COACH') return null;
  const bits: string[] = [];
  if (v.serviceRep) {
    bits.push(
      `Adds ${v.serviceRep} family reputation on every successful service.`
    );
  }
  if (v.memorialRep) {
    bits.push(
      `Adds ${v.memorialRep} reputation on a viewing or burial.`
    );
  }
  if (v.upkeepSaved) {
    bits.push(
      `Saves $${v.upkeepSaved} upkeep on a successful service.`
    );
  }
  if (v.houseTip) {
    bits.push(`Adds $${v.houseTip} to the house tip.`);
  }
  return bits.length ? bits.join(' ') : null;
}

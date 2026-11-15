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
  length: string;
  power: string;
  crew: string;
  finish: string;
  blurb: string;
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
    id: 'rec_silent_arrival',
    fleetClass: 'RECOVERY',
    tier: 4,
    tierName: 'House',
    name: 'Silent Arrival',
    era: '2019 removal',
    price: 24000,
    repBonus: 18,
    moneyBonus: 0,
    interment: 0,
    length: "18'6\"",
    power: '3.5L V6',
    crew: '3 + cot',
    finish: 'Lampblack, chrome belt',
    blurb: 'Long-wheelbase removal SUV. Chrome belt, a thin landau swoosh on the quarter glass, and a vertical tail lamp. The reputation piece.',
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

function classBonus(v: FleetVehicle): number {
  if (v.fleetClass === 'RECOVERY') return v.repBonus;
  if (v.fleetClass === 'ESCORT' || v.fleetClass === 'FLOWER') return v.moneyBonus;
  return v.interment;
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
  return `Interment +${v.interment}`;
}

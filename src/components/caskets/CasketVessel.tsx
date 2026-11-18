import { useId } from 'react';
import { friendlyToken } from '../../types/game';
import type {
  CasketCarving,
  CasketCatalogEntry,
  CasketEmbroidery,
  CasketHardwareKind,
  CasketMaterial,
  CasketMolding,
  CasketPlateShape,
  CasketSilhouette,
  CasketTexture,
} from '../../data/casketCatalog';

/**
 * One oblique camera for every casket and coffin.
 * Length runs +x, height is straight up, depth runs up and to the right
 * so the foot end is the visible end and the head stays on the left.
 * Edges that are parallel on the box stay parallel on screen.
 */

type Pt = [number, number];
type UV = { u: number; w: number };

type FaceName = 'chamferL' | 'front' | 'chamferR' | 'end';

type Look = {
  top: string;
  topHi: string;
  topMid: string;
  front: string;
  frontHi: string;
  frontDeep: string;
  end: string;
  endDeep: string;
  grain: string;
  gap: string;
  metal: boolean;
  gloss: number;
  bar: [string, string, string];
  lug: [string, string, string];
  lining: string;
  thread: string;
  embroidery: CasketEmbroidery;
  hardware: CasketHardwareKind;
  plates: 2 | 3 | 4;
  plate: CasketPlateShape;
  texture: CasketTexture;
  molding: CasketMolding;
  carving: CasketCarving;
  /** True only when the catalog entry supplies its own cloth. */
  customCloth: boolean;
};

const LEN = 460;
const BODY = 64;
const DEPTH = { x: 86, y: -42 };
const CU = 0.09;
const CW = 0.22;
const SPLIT = 0.47;
const O = { x: 48, y: 300 };

function isCoffin(s: CasketSilhouette) {
  return s === 'TAPERED' || s === 'OCTAGON';
}

function fmt(n: number) {
  return (Math.round(n * 10) / 10).toString();
}

function dPts(pts: Pt[], close = true) {
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p[0])} ${fmt(p[1])}`).join(' ');
  return close ? `${d} Z` : d;
}

function P(u: number, v: number, w: number): Pt {
  return [O.x + u * LEN + w * DEPTH.x, O.y - v + w * DEPTH.y];
}

function finishLook(base: Omit<Look, 'lining' | 'thread' | 'embroidery' | 'hardware' | 'plates' | 'plate' | 'texture' | 'molding' | 'carving' | 'customCloth'>): Look {
  return {
    ...base,
    lining: '#f7f4f1',
    thread: '#6d8a48',
    embroidery: 'roses',
    hardware: 'swing',
    plates: 3,
    plate: 'arch',
    texture: base.metal ? 'brushed' : 'grain',
    molding: 'stepped',
    carving: base.metal ? 'none' : 'wheat',
    customCloth: false,
  };
}

function lookFor(casket: CasketCatalogEntry): Look {
  const base = finishLook(materialLook(casket.material, casket.silhouette));
  const dress = casket.dress;
  if (!dress) return base;
  return {
    ...base,
    top: dress.top,
    topHi: dress.topHi,
    topMid: dress.topMid,
    front: dress.front,
    frontHi: dress.frontHi,
    frontDeep: dress.frontDeep,
    end: dress.end,
    endDeep: dress.endDeep,
    grain: dress.grain,
    gap: dress.gap,
    metal: dress.metal,
    gloss: dress.gloss,
    bar: dress.bar,
    lug: dress.lug,
    lining: dress.lining,
    thread: dress.thread,
    embroidery: dress.embroidery,
    hardware: dress.hardware,
    plates: dress.plates,
    plate: dress.plate,
    texture: dress.texture,
    molding: dress.molding,
    carving: dress.carving,
    customCloth: true,
  };
}

function materialLook(material: CasketMaterial, silhouette: CasketSilhouette): Omit<Look, 'lining' | 'thread' | 'embroidery' | 'hardware' | 'plates' | 'plate' | 'texture' | 'molding' | 'carving' | 'customCloth'> {
  const brass: Look['lug'] = ['#f4e2a8', '#c6a15a', '#6e5420'];
  const woodBar: Look['bar'] = ['#f0d7a6', '#c4924c', '#6a4520'];
  if (material === 'PINE') {
    return {
      top: '#f6e6c0', topHi: '#fff6e4', topMid: '#e7cb96',
      front: '#e0bc80', frontHi: '#f3d7a6', frontDeep: '#c49a5c',
      end: '#a67a42', endDeep: '#6e4e2c',
      grain: '#8d6840', gap: '#6a4c2c', metal: false, gloss: 0.16,
      bar: ['#d8d2cc', '#6e6862', '#2a2622'], lug: ['#ece8e2', '#7a746c', '#2c2824'],
    };
  }
  if (material === 'OAK' && silhouette === 'OCTAGON') {
    return {
      top: '#8a5a30', topHi: '#c48a52', topMid: '#6e4422',
      front: '#7a4e28', frontHi: '#a56c3c', frontDeep: '#4e3018',
      end: '#5c3a1e', endDeep: '#3a2412',
      grain: '#2e1a0c', gap: '#241408', metal: false, gloss: 0.34,
      bar: woodBar, lug: ['#e4e0d8', '#8e8a84', '#3a3834'],
    };
  }
  if (material === 'OAK') {
    return {
      top: '#e2b168', topHi: '#f6ddb0', topMid: '#c89048',
      front: '#d09a52', frontHi: '#e8bc78', frontDeep: '#8f6230',
      end: '#b68448', endDeep: '#6e4c28',
      grain: '#7a4e24', gap: '#3a2412', metal: false, gloss: 0.46,
      bar: woodBar, lug: brass,
    };
  }
  if (material === 'CHERRY') {
    return {
      top: '#a33e40', topHi: '#d47070', topMid: '#7c2c30',
      front: '#8e3436', frontHi: '#b85052', frontDeep: '#54181c',
      end: '#6e2828', endDeep: '#3c1416',
      grain: '#3a1012', gap: '#24080a', metal: false, gloss: 0.7,
      bar: ['#f0c8a0', '#b86a40', '#5c3018'], lug: ['#f2c8a4', '#a85c34', '#5a2c14'],
    };
  }
  if (material === 'WALNUT') {
    return {
      top: '#5c4034', topHi: '#a08068', topMid: '#3e2c24',
      front: '#4a3428', frontHi: '#7a5c48', frontDeep: '#2a1c16',
      end: '#3a2820', endDeep: '#1c120e',
      grain: '#1a100c', gap: '#100a08', metal: false, gloss: 0.4,
      bar: ['#e6c888', '#a07838', '#4a3414'], lug: ['#f0d8a0', '#a07830', '#4a3010'],
    };
  }
  if (material === 'MAHOGANY') {
    return {
      top: '#8e3028', topHi: '#d06858', topMid: '#6a2018',
      front: '#7a2820', frontHi: '#a8483c', frontDeep: '#4a1410',
      end: '#5c1c16', endDeep: '#30100c',
      grain: '#2a0c08', gap: '#1a0604', metal: false, gloss: 0.82,
      bar: ['#ffe9a0', '#e2c05a', '#8a6818'], lug: ['#fff0b8', '#d4b04c', '#7a5c14'],
    };
  }
  if (material === 'STEEL' && silhouette === 'FULL_COUCH') {
    return {
      top: '#4a525c', topHi: '#9aa4b0', topMid: '#343a42',
      front: '#3c444c', frontHi: '#6a7480', frontDeep: '#22262c',
      end: '#2e343c', endDeep: '#16191e',
      grain: '#c5ced6', gap: '#101216', metal: true, gloss: 0.53,
      bar: ['#f4f7fa', '#9aa6b2', '#3a424a'], lug: ['#f8fafc', '#8e98a4', '#2a3036'],
    };
  }
  if (material === 'STEEL') {
    return {
      top: '#e7eef3', topHi: '#ffffff', topMid: '#c5d0d8',
      front: '#d5dee6', frontHi: '#f4f7fa', frontDeep: '#8b99a6',
      end: '#b7c3cc', endDeep: '#6e7c88',
      grain: '#ffffff', gap: '#5c6a76', metal: true, gloss: 0.48,
      bar: ['#ffffff', '#d5dee6', '#7d8c98'], lug: ['#ffffff', '#c5d0da', '#6a7884'],
    };
  }
  if (material === 'BRONZE') {
    return {
      top: '#c4924a', topHi: '#f0d090', topMid: '#9a6c30',
      front: '#b07e3c', frontHi: '#d4a45c', frontDeep: '#6a4818',
      end: '#8e6428', endDeep: '#4a3010',
      grain: '#3e6b34', gap: '#3a240c', metal: true, gloss: 0.7,
      bar: ['#f0d8a0', '#b88840', '#5a3c14'], lug: ['#f6e2b0', '#c09040', '#5a3810'],
    };
  }
  return {
    top: '#d4844c', topHi: '#f4c098', topMid: '#b06838',
    front: '#c47240', frontHi: '#e09060', frontDeep: '#7a3c1c',
    end: '#a05a30', endDeep: '#5c3014',
    grain: '#7a3416', gap: '#3a1c0c', metal: true, gloss: 0.66,
    bar: ['#f6d0b0', '#c07040', '#6a3418'], lug: ['#f8d4b4', '#c07040', '#6a3014'],
  };
}

function octagon(su = 1, sw = 1): UV[] {
  const raw: UV[] = [
    { u: CU, w: 0 },
    { u: 1 - CU, w: 0 },
    { u: 1, w: CW },
    { u: 1, w: 1 - CW },
    { u: 1 - CU, w: 1 },
    { u: CU, w: 1 },
    { u: 0, w: 1 - CW },
    { u: 0, w: CW },
  ];
  if (su === 1 && sw === 1) return raw;
  return raw.map((p) => ({
    u: 0.5 + (p.u - 0.5) * su,
    w: 0.5 + (p.w - 0.5) * sw,
  }));
}

function widthAt(u: number, su = 1, sw = 1): { front: number; back: number } {
  const c = octagon(su, sw);
  // front boundary and back boundary as functions of u, from the scaled octagon
  const frontL = c[7];
  const frontA = c[0];
  const frontB = c[1];
  const frontR = c[2];
  const backR = c[3];
  const backB = c[4];
  const backA = c[5];
  const backL = c[6];
  const lerp = (a: UV, b: UV, u0: number) => {
    const t = Math.abs(b.u - a.u) < 1e-6 ? 0 : (u0 - a.u) / (b.u - a.u);
    return a.w + (b.w - a.w) * t;
  };
  let front: number;
  let back: number;
  if (u <= frontA.u) {
    front = lerp(frontL, frontA, u);
    back = lerp(backL, backA, u);
  } else if (u >= frontB.u) {
    front = lerp(frontB, frontR, u);
    back = lerp(backB, backR, u);
  } else {
    front = frontA.w;
    back = backA.w;
  }
  return { front, back };
}

function clipKeep(poly: UV[], limit: number, keepHigh: boolean): UV[] {
  if (poly.length === 0) return [];
  const inside = (p: UV) => (keepHigh ? p.u >= limit - 1e-6 : p.u <= limit + 1e-6);
  const out: UV[] = [];
  for (let i = 0; i < poly.length; i++) {
    const c = poly[i];
    const n = poly[(i + 1) % poly.length];
    const cin = inside(c);
    const nin = inside(n);
    if (cin !== nin && Math.abs(n.u - c.u) > 1e-8) {
      const t = (limit - c.u) / (n.u - c.u);
      out.push({ u: limit, w: c.w + (n.w - c.w) * t });
    }
    if (nin) out.push(n);
  }
  return out;
}

function clipU(poly: UV[], a: number, b: number) {
  return clipKeep(clipKeep(poly, a, true), b, false);
}

function projectPoly(poly: UV[], v: number): Pt[] {
  return poly.map((p) => P(p.u, v, p.w));
}

type Seg = { u0: number; w0: number; u1: number; w1: number; face: FaceName };

function visibleSegs(corners: UV[]): Seg[] {
  const faces: FaceName[] = ['chamferL', 'front', 'chamferR', 'end'];
  const idx = [7, 0, 1, 2, 3];
  return faces.map((face, i) => {
    const a = corners[idx[i]];
    const b = corners[idx[i + 1]];
    return { u0: a.u, w0: a.w, u1: b.u, w1: b.w, face };
  });
}

function clipSeg(seg: Seg, a: number, b: number): Seg | null {
  if (Math.abs(seg.u1 - seg.u0) < 1e-5) {
    if (seg.u0 < a - 0.02 || seg.u0 > b + 0.02) return null;
    return seg;
  }
  const uLo = Math.min(seg.u0, seg.u1);
  const uHi = Math.max(seg.u0, seg.u1);
  const lo = Math.max(a, uLo);
  const hi = Math.min(b, uHi);
  if (hi - lo < 0.008) return null;
  const tAt = (u: number) => (u - seg.u0) / (seg.u1 - seg.u0);
  const wAt = (u: number) => seg.w0 + (seg.w1 - seg.w0) * tAt(u);
  const dir = seg.u1 >= seg.u0 ? 1 : -1;
  const u0 = dir > 0 ? lo : hi;
  const u1 = dir > 0 ? hi : lo;
  return { ...seg, u0, w0: wAt(u0), u1, w1: wAt(u1) };
}

function wallPts(seg: Seg, v0: number, v1: number): Pt[] {
  return [P(seg.u0, v0, seg.w0), P(seg.u1, v0, seg.w1), P(seg.u1, v1, seg.w1), P(seg.u0, v1, seg.w0)];
}

function faceColor(face: FaceName, look: Look, frontUrl: string) {
  if (face === 'front') return frontUrl;
  if (face === 'chamferL') return look.frontDeep;
  if (face === 'chamferR') return look.end;
  return look.endDeep;
}

/** Closed lid: one low crown, ends roll off, the middle stays up so the seam is a cut not a valley. */
function crownLift(u: number, amp: number) {
  const end = Math.min(u / 0.13, (1 - u) / 0.13, 1);
  const e = end * end * (3 - 2 * end);
  const hump = 0.86 + 0.14 * Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.06) / 0.88)));
  return amp * hump * (0.22 + 0.78 * e);
}

/** Foot half when the head is open: full height at the cut, rolls off at the foot. */
function footLift(u: number, amp: number) {
  const t = (u - SPLIT) / (1 - SPLIT);
  const arch = 0.78 + 0.22 * Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  const roll = t > 0.8 ? Math.cos(((t - 0.8) / 0.2) * (Math.PI / 2)) : 1;
  return amp * arch * (0.28 + 0.72 * roll);
}

function crownPoly(a: number, b: number, base: number, liftAt: (u: number) => number, su = 1, sw = 1): Pt[] {
  const steps = 20;
  const front: Pt[] = [];
  const back: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = a + ((b - a) * i) / steps;
    const span = widthAt(u, su, sw);
    const lift = liftAt(u);
    front.push(P(u, base + lift, span.front));
    back.push(P(u, base + lift, span.back));
  }
  return [...front, ...back.reverse()];
}

function chainLine(a: number, b: number, base: number, liftAt: (u: number) => number, tw: number, su = 1, sw = 1): Pt[] {
  const steps = 18;
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = a + ((b - a) * i) / steps;
    const span = widthAt(u, su, sw);
    const w = span.front + (span.back - span.front) * tw;
    pts.push(P(u, base + liftAt(u), w));
  }
  return pts;
}

type LidMode = 'head' | 'both' | 'none';

function resolveLid(casket: CasketCatalogEntry, lid?: 'open' | 'closed'): LidMode {
  if (lid === 'closed') return 'none';
  if (isCoffin(casket.silhouette)) return lid === 'open' ? 'both' : 'none';
  if (lid === 'open') return casket.silhouette === 'HALF_COUCH' ? 'head' : 'both';
  if (casket.silhouette === 'FULL_COUCH') return 'both';
  if (casket.silhouette === 'HALF_COUCH') return 'head';
  return 'none';
}

function lidOctagon(u0: number, u1: number): { u: number; s: number }[] {
  const cu = Math.min(0.05, (u1 - u0) * 0.18);
  const cs = 0.16;
  return [
    { u: u0 + cu, s: 1 },
    { u: u1 - cu, s: 1 },
    { u: u1, s: 1 - cs },
    { u: u1, s: cs },
    { u: u1 - cu, s: 0 },
    { u: u0 + cu, s: 0 },
    { u: u0, s: cs },
    { u: u0, s: 1 - cs },
  ];
}

function lidPoint(u: number, s: number, outer = false): Pt {
  // s=0 sits on the back rim. The panel rises and leans a little back.
  const w = 0.9 + s * 0.12 + (outer ? 0.08 : 0);
  const v = BODY - 16 + s * 158 + (outer ? 3 : 0);
  return P(u, v, w);
}

function mapLid(poly: { u: number; s: number }[], outer = false): Pt[] {
  return poly.map((p) => lidPoint(p.u, p.s, outer));
}

function insetLid(poly: { u: number; s: number }[], du: number, ds: number) {
  const cu = poly.reduce((s, p) => s + p.u, 0) / poly.length;
  const cs = poly.reduce((s, p) => s + p.s, 0) / poly.length;
  return poly.map((p) => {
    const ud = p.u - cu;
    const sd = p.s - cs;
    const ul = Math.abs(ud) < 1e-4 ? 0 : Math.max(0.15, (Math.abs(ud) - du) / Math.abs(ud));
    const sl = Math.abs(sd) < 1e-4 ? 0 : Math.max(0.15, (Math.abs(sd) - ds) / Math.abs(sd));
    return { u: cu + ud * ul, s: cs + sd * sl };
  });
}

function Rose({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <g>
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <ellipse
            key={deg}
            cx={x + Math.cos(a) * r * 0.55}
            cy={y + Math.sin(a) * r * 0.42}
            rx={r * 0.48}
            ry={r * 0.32}
            fill={fill}
            transform={`rotate(${deg} ${x + Math.cos(a) * r * 0.55} ${y + Math.sin(a) * r * 0.42})`}
            opacity="0.95"
          />
        );
      })}
      <circle cx={x} cy={y} r={r * 0.28} fill="#f6c4d0" />
      <circle cx={x - r * 0.08} cy={y - r * 0.08} r={r * 0.1} fill="#fff" opacity="0.7" />
    </g>
  );
}

function OpenLid({
  u0,
  u1,
  uid,
  look,
}: {
  u0: number;
  u1: number;
  uid: string;
  look: Look;
}) {
  const outer = lidOctagon(u0, u1);
  const frame = insetLid(outer, 0.004, 0.02);
  const satin = insetLid(outer, (u1 - u0) * 0.08, 0.1);
  const center = insetLid(outer, (u1 - u0) * 0.2, 0.24);
  const outerPts = mapLid(outer, true);
  const framePts = mapLid(frame, false);
  const satinPts = mapLid(satin, false);
  const centerPts = mapLid(center, false);
  const mid = lidPoint((u0 + u1) / 2, 0.58);
  const pleats: Pt[][] = [];
  const n = 28;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const pick = (pts: Pt[]) => {
      const f = t * pts.length;
      const i0 = Math.floor(f) % pts.length;
      const i1 = (i0 + 1) % pts.length;
      const k = f - Math.floor(f);
      return [pts[i0][0] + (pts[i1][0] - pts[i0][0]) * k, pts[i0][1] + (pts[i1][1] - pts[i0][1]) * k] as Pt;
    };
    pleats.push([pick(satinPts), pick(centerPts)]);
  }
  return (
    <g>
      <path d={dPts(outerPts)} fill={look.frontDeep} />
      <path d={dPts(framePts)} fill={`url(#${uid}-lidface)`} stroke={look.frontDeep} strokeWidth="2.4" />
      <path d={dPts(satinPts)} fill={look.lining} />
      {pleats.map((ln, i) => (
        <path
          key={i}
          d={dPts(ln, false)}
          stroke={i % 2 ? '#e4ddd6' : '#ffffff'}
          strokeWidth="1.3"
          fill="none"
        />
      ))}
      <path d={dPts(centerPts)} fill={look.customCloth ? look.lining : '#fbf9f7'} stroke="#f3eeea" strokeWidth="1" />
      {look.embroidery === 'roses' ? <RosePanel mid={mid} /> : <Motif mid={mid} look={look} />}
    </g>
  );
}

function RosePanel({ mid }: { mid: Pt }) {
  return (
    <g>
      <path
        d={`M${fmt(mid[0] - 18)} ${fmt(mid[1] + 16)} C ${fmt(mid[0] - 4)} ${fmt(mid[1] - 8)}, ${fmt(mid[0] + 8)} ${fmt(mid[1] + 6)}, ${fmt(mid[0] + 16)} ${fmt(mid[1] - 14)}`}
        stroke="#6d8a48"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        d={`M${fmt(mid[0] - 10)} ${fmt(mid[1] + 18)} C ${fmt(mid[0] + 2)} ${fmt(mid[1] + 4)}, ${fmt(mid[0] + 6)} ${fmt(mid[1] - 2)}, ${fmt(mid[0] + 20)} ${fmt(mid[1] - 6)}`}
        stroke="#7d9a52"
        strokeWidth="1.1"
        fill="none"
      />
      <ellipse cx={mid[0] - 16} cy={mid[1] + 6} rx="6" ry="3.2" fill="#6a8f46" transform={`rotate(-30 ${mid[0] - 16} ${mid[1] + 6})`} />
      <ellipse cx={mid[0] + 14} cy={mid[1] - 2} rx="5.5" ry="3" fill="#7ea456" transform={`rotate(24 ${mid[0] + 14} ${mid[1] - 2})`} />
      <Rose x={mid[0] - 8} y={mid[1] - 6} r={7.5} fill="#e48aa2" />
      <Rose x={mid[0] + 9} y={mid[1] - 2} r={6.5} fill="#d47090" />
      <Rose x={mid[0] + 1} y={mid[1] + 8} r={6.2} fill="#ee9aaf" />
    </g>
  );
}

function Motif({ mid, look }: { mid: Pt; look: Look }) {
  const x = mid[0];
  const y = mid[1];
  if (look.embroidery === 'plain') return null;
  if (look.embroidery === 'cross') {
    return (
      <g>
        <rect x={x - 3.2} y={y - 16} width="6.4" height="32" rx="1.2" fill={look.thread} />
        <rect x={x - 13} y={y - 6} width="26" height="6.2" rx="1.2" fill={look.thread} />
      </g>
    );
  }
  if (look.embroidery === 'hands') {
    return (
      <g fill={look.thread}>
        <ellipse cx={x - 5} cy={y + 3} rx="4.2" ry="11" transform={`rotate(-14 ${x - 5} ${y + 3})`} />
        <ellipse cx={x + 5} cy={y + 3} rx="4.2" ry="11" transform={`rotate(14 ${x + 5} ${y + 3})`} />
        <path d={`M${fmt(x - 3)} ${fmt(y - 6)} Q ${fmt(x)} ${fmt(y - 14)} ${fmt(x + 3)} ${fmt(y - 6)}`} fill={look.thread} />
      </g>
    );
  }
  if (look.embroidery === 'doves') {
    return (
      <g fill={look.thread}>
        <ellipse cx={x - 7} cy={y + 1} rx="9" ry="3.4" transform={`rotate(-18 ${x - 7} ${y + 1})`} />
        <ellipse cx={x + 7} cy={y + 1} rx="9" ry="3.4" transform={`rotate(18 ${x + 7} ${y + 1})`} />
        <circle cx={x} cy={y + 1} r="2.4" />
        <circle cx={x - 12} cy={y - 1} r="1.3" />
        <circle cx={x + 12} cy={y - 1} r="1.3" />
      </g>
    );
  }
  return (
    <g>
      <rect x={x - 14} y={y - 9} width="28" height="18" rx="0.6" fill="#f7f7f7" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={x - 14} y={y - 9 + i * 3} width="28" height="1.6" fill={i % 2 ? '#f7f7f7' : '#b4232c'} />
      ))}
      <rect x={x - 14} y={y - 9} width="12" height="9" fill="#243e78" />
    </g>
  );
}

function Walls({
  a,
  b,
  v0,
  v1,
  su,
  sw,
  look,
  frontUrl,
}: {
  a: number;
  b: number;
  v0: number;
  v1: number;
  su: number;
  sw: number;
  look: Look;
  frontUrl: string;
}) {
  const segs = visibleSegs(octagon(su, sw))
    .map((s) => clipSeg(s, a, b))
    .filter((s): s is Seg => s != null);
  return (
    <g>
      {segs.map((s, i) => (
        <path
          key={i}
          d={dPts(wallPts(s, v0, v1))}
          fill={faceColor(s.face, look, frontUrl)}
          stroke={look.gap}
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

function plateUs(n: 2 | 3 | 4): number[] {
  if (n === 2) return [0.32, 0.68];
  if (n === 4) return [0.18, 0.39, 0.61, 0.82];
  return [0.24, 0.5, 0.76];
}

function Hardware({
  look,
  uid,
  barUrl,
}: {
  look: Look;
  uid: string;
  barUrl: string;
}) {
  const barY = P(0.5, 22, 0)[1];
  const x0 = P(0.1, 22, 0)[0];
  const x1 = P(0.9, 22, 0)[0];
  const stations = plateUs(look.plates);
  const swing = look.hardware === 'swing';
  return (
    <g>
      {look.hardware === 'bail'
        ? stations.map((u) => {
            const p = P(u, 30, 0);
            return <Bail key={u} x={p[0]} y={p[1]} look={look} />;
          })
        : stations.map((u) => {
            const cx = P(u, 44, 0)[0];
            const cy = P(u, 44, 0)[1];
            const hw = look.plates === 4 ? 22 : look.plates === 2 ? 40 : 34;
            const hh = look.plates === 4 ? 11 : 14;
            const plateFill = look.metal ? look.frontHi : look.topMid;
            const plateShade = look.metal ? look.end : look.frontDeep;
            return (
              <g key={u}>
                {look.plate === 'oval' ? (
                  <ellipse cx={cx} cy={cy - hh * 0.35} rx={hw} ry={hh} fill={plateFill} stroke={look.gap} strokeWidth="1" />
                ) : look.plate === 'rect' ? (
                  <rect x={cx - hw} y={cy - hh} width={hw * 2} height={hh * 1.35} rx="3" fill={plateFill} stroke={look.gap} strokeWidth="1" />
                ) : (
                  <path
                    d={`M${fmt(cx - hw)} ${fmt(cy)} A ${hw} ${hh} 0 0 1 ${fmt(cx + hw)} ${fmt(cy)} Z`}
                    fill={plateFill}
                    stroke={look.gap}
                    strokeWidth="1"
                  />
                )}
                {look.plate === 'arch' && (
                  <path
                    d={`M${fmt(cx - hw + 5)} ${fmt(cy - 1)} A ${hw - 7} ${hh - 5} 0 0 1 ${fmt(cx + hw - 5)} ${fmt(cy - 1)}`}
                    fill={plateShade}
                    opacity="0.55"
                  />
                )}
                {[-14, 14].map((dx) => (
                  <g key={dx}>
                    <rect x={cx + dx - 3} y={cy - 2} width="6" height={barY - cy + 6} rx="2" fill={`url(#${uid}-lug)`} />
                    <circle cx={cx + dx} cy={cy} r="3.1" fill={look.lug[0]} stroke={look.lug[2]} strokeWidth="0.6" />
                    <circle cx={cx + dx - 0.7} cy={cy - 0.6} r="0.9" fill="#fff" opacity="0.85" />
                  </g>
                ))}
              </g>
            );
          })}
      {look.hardware !== 'bail' && (
        <g>
          <rect
            x={x0}
            y={barY - (swing ? 6 : 4)}
            width={x1 - x0}
            height={swing ? 12 : 8}
            rx={swing ? 6 : 1.5}
            fill={barUrl}
          />
          <rect x={x0 + 10} y={barY - 4} width={x1 - x0 - 26} height="2.4" rx="1" fill="#fff" opacity={look.metal ? 0.8 : 0.5} />
          {swing && (
            <g>
              <circle cx={x0} cy={barY} r="7" fill={`url(#${uid}-lug)`} />
              <circle cx={x1} cy={barY} r="7" fill={`url(#${uid}-lug)`} />
              <circle cx={x0 - 1} cy={barY - 1.4} r="1.5" fill="#fff" opacity="0.85" />
              <circle cx={x1 - 1} cy={barY - 1.4} r="1.5" fill="#fff" opacity="0.85" />
            </g>
          )}
        </g>
      )}
    </g>
  );
}

function CornerMark({ look }: { look: Look }) {
  if (look.carving === 'none' || look.metal) return null;
  if (look.carving === 'leaf') return <LeafMark look={look} />;
  if (look.carving === 'cross') return <CrossMark look={look} />;
  return <Wheat look={look} />;
}

function carvingAnchor(look: Look) {
  const a = P(1, 28, CW + 0.08);
  const b = P(1, 28, 1 - CW - 0.08);
  const top = P(1, BODY - 16, (CW + (1 - CW)) / 2);
  const cx = (a[0] + b[0]) / 2;
  const cy = (top[1] + (a[1] + b[1]) / 2) / 2 + 4;
  return { cx, cy, stroke: look.gap };
}

function LeafMark({ look }: { look: Look }) {
  const { cx, cy, stroke } = carvingAnchor(look);
  return (
    <g stroke={stroke} strokeWidth="1.15" fill="none" strokeLinecap="round" opacity="0.8">
      <path d={`M${fmt(cx)} ${fmt(cy - 12)} Q ${fmt(cx + 8)} ${fmt(cy)} ${fmt(cx)} ${fmt(cy + 12)}`} />
      <path d={`M${fmt(cx)} ${fmt(cy - 4)} Q ${fmt(cx - 8)} ${fmt(cy + 2)} ${fmt(cx)} ${fmt(cy + 6)}`} />
    </g>
  );
}

function CrossMark({ look }: { look: Look }) {
  const { cx, cy, stroke } = carvingAnchor(look);
  return (
    <g stroke={stroke} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85">
      <path d={`M${fmt(cx)} ${fmt(cy - 12)} L${fmt(cx)} ${fmt(cy + 12)}`} />
      <path d={`M${fmt(cx - 7)} ${fmt(cy - 3)} L${fmt(cx + 7)} ${fmt(cy - 3)}`} />
    </g>
  );
}

function Wheat({ look }: { look: Look }) {
  if (look.metal) return null;
  const a = P(1, 28, CW + 0.08);
  const b = P(1, 28, 1 - CW - 0.08);
  const top = P(1, BODY - 16, (CW + (1 - CW)) / 2);
  const cx = (a[0] + b[0]) / 2;
  const cy = (top[1] + (a[1] + b[1]) / 2) / 2 + 4;
  return (
    <g stroke={look.gap} strokeWidth="1.15" fill="none" strokeLinecap="round" opacity="0.8">
      <path d={`M${fmt(cx)} ${fmt(cy - 14)} L${fmt(cx)} ${fmt(cy + 12)}`} />
      <path d={`M${fmt(cx)} ${fmt(cy - 8)} L${fmt(cx - 7)} ${fmt(cy - 2)}`} />
      <path d={`M${fmt(cx)} ${fmt(cy - 4)} L${fmt(cx + 7)} ${fmt(cy + 2)}`} />
      <path d={`M${fmt(cx)} ${fmt(cy)} L${fmt(cx - 6)} ${fmt(cy + 7)}`} />
      <path d={`M${fmt(cx)} ${fmt(cy + 3)} L${fmt(cx + 6)} ${fmt(cy + 10)}`} />
      <path d={`M${fmt(cx - 2)} ${fmt(cy - 12)} L${fmt(cx + 3)} ${fmt(cy - 9)}`} />
    </g>
  );
}

const HEX: UV[] = [
  { u: 0.0, w: 0.32 },
  { u: 0.17, w: 0.0 },
  { u: 0.9, w: 0.14 },
  { u: 0.9, w: 0.86 },
  { u: 0.17, w: 1 },
  { u: 0.0, w: 0.68 },
];

function insetHex(hex: UV[], f: number): UV[] {
  const cu = hex.reduce((s, p) => s + p.u, 0) / hex.length;
  const cw = hex.reduce((s, p) => s + p.w, 0) / hex.length;
  return hex.map((p) => ({
    u: cu + (p.u - cu) * f,
    w: cw + (p.w - cw) * f,
  }));
}

/** Lid hinged on the far edge, near edge swung up. Same oblique as the closed cap. */
function coffinLidLift(p: UV): Pt {
  const front = Math.min(1, Math.max(0, (0.78 - p.w) / 0.78));
  const eased = front * front * (3 - 2 * front);
  return P(p.u, BODY + 6 + eased * 96, p.w - eased * 0.28);
}

function CoffinOpen({
  casket,
  uid,
  look,
}: {
  casket: CasketCatalogEntry;
  uid: string;
  look: Look;
}) {
  const pine = casket.material === 'PINE';
  const bed = insetHex(HEX, 0.84);
  const sheet = insetHex(HEX, 0.7);
  const outer = HEX.map(coffinLidLift);
  const inner = insetHex(HEX, 0.8).map(coffinLidLift);
  const mid = coffinLidLift({ u: 0.42, w: 0.34 });
  const pillow = P(0.14, BODY - 3, 0.5);
  return (
    <g>
      <path d={dPts(projectPoly(HEX, BODY))} fill={look.frontDeep} />
      <path d={dPts(projectPoly(bed, BODY - 1))} fill={look.lining} />
      <path d={dPts(projectPoly(sheet, BODY - 3))} fill={look.customCloth ? look.lining : '#fbf9f7'} />
      <g stroke="#e4ddd6" strokeWidth="1.05" fill="none">
        {[0.28, 0.46, 0.64].map((tw) => (
          <path key={tw} d={dPts(spanLine(sheet, BODY - 3, tw), false)} />
        ))}
      </g>
      <ellipse cx={pillow[0]} cy={pillow[1]} rx="22" ry="8" fill="#f7f4f1" />
      <ellipse cx={pillow[0]} cy={pillow[1] - 1} rx="16" ry="5" fill="#fff" opacity="0.55" />
      <path d={dPts(outer)} fill={look.frontDeep} />
      <path d={dPts(inner)} fill={`url(#${uid}-lidface)`} stroke={look.frontDeep} strokeWidth="1.6" />
      <path d={dPts(insetHex(HEX, 0.62).map(coffinLidLift))} fill={look.lining} />
      {pine && !casket.dress ? (
        <g stroke="#e6c48a" strokeWidth="2.2" strokeLinecap="round">
          <path d={`M${fmt(mid[0])} ${fmt(mid[1] - 12)} V${fmt(mid[1] + 12)}`} />
          <path d={`M${fmt(mid[0] - 8)} ${fmt(mid[1] - 2)} H${fmt(mid[0] + 8)}`} />
        </g>
      ) : look.embroidery === 'roses' ? (
        <RosePanel mid={mid} />
      ) : (
        <Motif mid={mid} look={look} />
      )}
      <Screws hex={insetHex(HEX, 0.92)} v={BODY + 8} metal={look.metal} />
    </g>
  );
}

function CoffinBody({
  casket,
  uid,
  look,
  open,
}: {
  casket: CasketCatalogEntry;
  uid: string;
  look: Look;
  open: boolean;
}) {
  const pine = casket.material === 'PINE';
  const lidHex = HEX;
  const sideIdx = [0, 1, 2];
  const lidH = BODY + 10;
  const sideColor = (i: number) => (i === 2 ? look.end : i === 0 ? look.frontDeep : `url(#${uid}-front)`);
  return (
    <g>
      <ellipse cx={O.x + LEN * 0.46} cy={O.y + 16} rx={LEN * 0.4} ry="13" fill="#000" opacity="0.22" filter={`url(#${uid}-blur)`} />
      {sideIdx.map((i) => {
        const a = HEX[i];
        const b = HEX[i + 1];
        const quad = [P(a.u, 0, a.w), P(b.u, 0, b.w), P(b.u, BODY, b.w), P(a.u, BODY, a.w)];
        const seam = (v: number): Pt[] => [P(a.u, v, a.w), P(b.u, v, b.w)];
        return (
          <g key={i}>
            <path d={dPts(quad)} fill={sideColor(i)} />
            <path d={dPts([P(a.u, 0, a.w), P(b.u, 0, b.w), P(b.u, 8, b.w), P(a.u, 8, a.w)])} fill={look.endDeep} opacity="0.45" />
            {pine && (
              <g stroke={look.grain} strokeWidth="1.1" opacity="0.55" fill="none">
                <path d={dPts(seam(BODY * 0.36), false)} />
                <path d={dPts(seam(BODY * 0.68), false)} />
              </g>
            )}
            {look.metal && (
              <g stroke="#fff" strokeWidth="0.7" opacity="0.2" fill="none">
                {Array.from({ length: 5 }, (_, k) => (
                  <path key={k} d={dPts(seam(12 + k * 10), false)} />
                ))}
              </g>
            )}
          </g>
        );
      })}
      {open ? (
        <CoffinOpen casket={casket} uid={uid} look={look} />
      ) : (
        <g>
          <path d={dPts(projectPoly(lidHex, BODY))} fill={look.frontDeep} />
          <path d={dPts(projectPoly(lidHex, lidH))} fill={`url(#${uid}-top)`} />
          <path d={dPts([P(HEX[1].u, lidH, HEX[1].w), P(HEX[2].u, lidH, HEX[2].w)], false)} stroke={look.topHi} strokeWidth="1.4" fill="none" opacity="0.55" />
          {pine && (
            <g stroke={look.grain} strokeWidth="0.9" fill="none" opacity="0.35">
              {[0.25, 0.45, 0.65].map((tw) => (
                <path key={tw} d={dPts(spanLine(lidHex, lidH, tw), false)} />
              ))}
            </g>
          )}
          {pine && (
            <g>
              <Knot x={P(0.42, lidH, 0.42)} />
              <Knot x={P(0.62, lidH, 0.58)} small />
            </g>
          )}
          {pine && !casket.dress && <CoffinCross />}
          {casket.dress && look.embroidery !== 'plain' && <CoffinEmblem look={look} />}
          {look.texture === 'hammered' && (
            <g fill={look.topHi} opacity="0.4">
              {[0.32, 0.48, 0.64, 0.78].map((u) => {
                const p = P(u, lidH, 0.46);
                return <ellipse key={u} cx={p[0]} cy={p[1]} rx="4" ry="1.8" />;
              })}
            </g>
          )}
          <Screws hex={lidHex} v={lidH} metal={look.metal} />
        </g>
      )}
      {pine && (
        <g>
          <Knot x={P(0.55, BODY * 0.55, 0.08)} />
          <Knot x={P(0.78, BODY * 0.4, 0.16)} small />
        </g>
      )}
      {casket.dress && look.hardware !== 'bail' ? (
        <CoffinRail look={look} uid={uid} />
      ) : (
        <CoffinBails look={look} plates={casket.dress ? look.plates : undefined} />
      )}
    </g>
  );
}

function spanLine(hex: UV[], v: number, tw: number): Pt[] {
  const steps = 14;
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * 0.97;
    const hits = edgesAt(hex, u);
    if (!hits) continue;
    const w = hits.lo + (hits.hi - hits.lo) * tw;
    pts.push(P(u, v, w));
  }
  return pts;
}

function edgesAt(hex: UV[], u: number): { lo: number; hi: number } | null {
  const ws: number[] = [];
  for (let i = 0; i < hex.length; i++) {
    const a = hex[i];
    const b = hex[(i + 1) % hex.length];
    const lo = Math.min(a.u, b.u);
    const hi = Math.max(a.u, b.u);
    if (u < lo - 1e-4 || u > hi + 1e-4 || Math.abs(b.u - a.u) < 1e-6) continue;
    const t = (u - a.u) / (b.u - a.u);
    ws.push(a.w + (b.w - a.w) * t);
  }
  if (ws.length < 2) return null;
  return { lo: Math.min(...ws), hi: Math.max(...ws) };
}

function Knot({ x, small }: { x: Pt; small?: boolean }) {
  const rx = small ? 5 : 8;
  const ry = small ? 3.2 : 5;
  return (
    <g>
      <ellipse cx={x[0]} cy={x[1]} rx={rx} ry={ry} fill="#c49a62" opacity="0.85" />
      <ellipse cx={x[0]} cy={x[1]} rx={rx * 0.45} ry={ry * 0.45} fill="#8d6238" />
      <ellipse cx={x[0] - 1} cy={x[1] - 0.6} rx={rx * 0.16} ry={ry * 0.16} fill="#f3e2c0" opacity="0.7" />
    </g>
  );
}

function CoffinCross() {
  const v = BODY + 11.4;
  const cu = 0.14;
  const arm = (u0: number, w0: number, u1: number, w1: number) =>
    dPts([P(u0, v, w0), P(u1, v, w0), P(u1, v, w1), P(u0, v, w1)]);
  return (
    <g>
      <path d={arm(cu - 0.055, 0.46, cu + 0.055, 0.54)} fill="#e6c48a" stroke="#a88450" strokeWidth="0.6" />
      <path d={arm(cu - 0.02, 0.38, cu + 0.02, 0.62)} fill="#efd2a0" stroke="#a88450" strokeWidth="0.6" />
    </g>
  );
}

function Screws({ hex, v, metal }: { hex: UV[]; v: number; metal: boolean }) {
  const pts: Pt[] = [];
  for (let i = 0; i < hex.length; i++) {
    const a = hex[i];
    const b = hex[(i + 1) % hex.length];
    pts.push(P(a.u, v, a.w));
    if (i === 1 || i === 4) {
      pts.push(P((a.u + b.u) / 2, v, (a.w + b.w) / 2));
      pts.push(P(a.u * 0.66 + b.u * 0.34, v, a.w * 0.66 + b.w * 0.34));
      pts.push(P(a.u * 0.34 + b.u * 0.66, v, a.w * 0.34 + b.w * 0.66));
    }
  }
  return (
    <g>
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={metal ? 1.7 : 1.45} fill={metal ? '#5c5148' : '#5a4030'} />
      ))}
    </g>
  );
}

function Bail({ x, y, look, rot = 0 }: { x: number; y: number; look: Look; rot?: number }) {
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) rotate(${rot})`}>
      <rect x={-13} y={-3} width="5" height="4" rx="0.6" fill={look.lug[1]} />
      <rect x={8} y={-3} width="5" height="4" rx="0.6" fill={look.lug[1]} />
      <path d="M-10.5 -1 v5 a10.5 8.5 0 0 0 21 0 v-5 z" fill={look.lug[2]} />
      <path d="M-7 5 a7 5 0 0 0 14 0" fill="none" stroke={look.lug[0]} strokeWidth="1.1" />
    </g>
  );
}

function CoffinEmblem({ look }: { look: Look }) {
  const p = P(0.22, BODY + 11.2, 0.5);
  return <Motif mid={p} look={look} />;
}

function CoffinRail({ look, uid }: { look: Look; uid: string }) {
  const onEdge = (i: number, t: number, v: number) => {
    const a = HEX[i];
    const b = HEX[i + 1];
    return P(a.u + (b.u - a.u) * t, v, a.w + (b.w - a.w) * t);
  };
  const a = onEdge(1, 0.16, 26);
  const b = onEdge(1, 0.84, 26);
  const swing = look.hardware === 'swing';
  return (
    <g>
      {plateUs(look.plates).map((t, i, arr) => {
        const along = arr.length === 1 ? 0.5 : 0.2 + (i / (arr.length - 1)) * 0.6;
        const p = onEdge(1, along, 38);
        return <ellipse key={t} cx={p[0]} cy={p[1]} rx="11" ry="5" fill={look.metal ? look.frontHi : look.topMid} stroke={look.gap} strokeWidth="0.7" />;
      })}
      <line
        x1={a[0]}
        y1={a[1]}
        x2={b[0]}
        y2={b[1]}
        stroke={`url(#${uid}-bar)`}
        strokeWidth={swing ? 8 : 6}
        strokeLinecap={swing ? 'round' : 'butt'}
      />
    </g>
  );
}

function CoffinBails({ look, plates }: { look: Look; plates?: 2 | 3 | 4 }) {
  const onEdge = (i: number, t: number, v: number) => {
    const a = HEX[i];
    const b = HEX[i + 1];
    return P(a.u + (b.u - a.u) * t, v, a.w + (b.w - a.w) * t);
  };
  const spots = [onEdge(0, 0.55, BODY * 0.48), onEdge(1, 0.38, BODY * 0.48), onEdge(1, 0.72, BODY * 0.48)];
  const side = plates === 2 ? [spots[1]] : plates === 3 ? [spots[0], spots[2]] : spots;
  const end = onEdge(2, 0.5, BODY * 0.5);
  return (
    <g>
      {side.map((p, i) => (
        <Bail key={i} x={p[0]} y={p[1]} look={look} />
      ))}
      <Bail x={end[0]} y={end[1]} look={look} rot={-18} />
    </g>
  );
}

function insetUV(poly: UV[], f: number): UV[] {
  const cu = poly.reduce((s, p) => s + p.u, 0) / poly.length;
  const cw = poly.reduce((s, p) => s + p.w, 0) / poly.length;
  return poly.map((p) => ({ u: cu + (p.u - cu) * f, w: cw + (p.w - cw) * f }));
}

function CrownBand({
  a,
  b,
  base,
  amp,
  lift,
  look,
  topUrl,
  seam,
}: {
  a: number;
  b: number;
  base: number;
  amp: number;
  lift: (u: number, amp: number) => number;
  look: Look;
  topUrl: string;
  seam?: boolean;
}) {
  const at = (u: number) => lift(u, amp);
  const steps = 18;
  const domeFront: Pt[] = [];
  const domeFrontTop: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const u = a + ((b - a) * i) / steps;
    const span = widthAt(u);
    domeFront.push(P(u, base, span.front));
    domeFrontTop.push(P(u, base + at(u), span.front));
  }
  const endCap = (u: number) => {
    const span = widthAt(u);
    const h = at(u);
    return [P(u, base, span.front), P(u, base + h, span.front), P(u, base + h, span.back), P(u, base, span.back)];
  };
  return (
    <g>
      <path d={dPts([...domeFront, ...domeFrontTop.reverse()])} fill={look.topMid} />
      {b > 0.9 && <path d={dPts(endCap(b))} fill={look.end} />}
      {a < 0.05 && <path d={dPts(endCap(a))} fill={look.endDeep} />}
      <path d={dPts(crownPoly(a, b, base, at))} fill={topUrl} stroke={look.topMid} strokeWidth="0.6" />
      <path d={dPts(chainLine(a, b, base, at, 0), false)} stroke={look.gap} strokeWidth="1.15" fill="none" />
      {!look.metal && (
        <g stroke={look.grain} strokeWidth="0.75" fill="none" opacity="0.32">
          {[0.32, 0.55, 0.76].map((tw) => (
            <path key={tw} d={dPts(chainLine(a, b, base, at, tw), false)} />
          ))}
        </g>
      )}
      <path
        d={dPts(chainLine(a, b, base, at, 0.14), false)}
        stroke="#fff"
        strokeWidth={2 + look.gloss * 2}
        fill="none"
        opacity={0.16 + look.gloss * 0.28}
      />
      {seam && (
        <path d={dPts(crownPoly(SPLIT - 0.007, SPLIT + 0.007, base, at))} fill={look.gap} />
      )}
    </g>
  );
}

function American({
  casket,
  uid,
  look,
  mode,
  chapel,
}: {
  casket: CasketCatalogEntry;
  uid: string;
  look: Look;
  mode: LidMode;
  chapel?: boolean;
}) {
  const frontUrl = `url(#${uid}-front)`;
  const topUrl = `url(#${uid}-top)`;
  const barUrl = `url(#${uid}-bar)`;
  const amp = casket.silhouette === 'DOME' ? 34 : 26;
  const moldSteps = look.molding === 'simple' ? 1 : look.molding === 'bead' ? 2 : 3;
  const mold = look.molding === 'simple' ? 10 : 18;
  const headOpen = mode === 'head' || mode === 'both';
  const footOpen = mode === 'both';
  const closedRanges: [number, number][] = [];
  if (!headOpen) closedRanges.push([0, SPLIT]);
  if (!footOpen) closedRanges.push([SPLIT, 1]);
  const moldA = headOpen ? SPLIT : 0;
  const moldB = footOpen ? SPLIT : 1;
  const showMold = moldA < moldB - 0.01;
  const well = clipU(octagon(), headOpen && !footOpen ? 0 : 0, footOpen || !headOpen ? 1 : SPLIT);
  const bedding = headOpen;
  const stationsDrapeTo = footOpen ? 0.92 : SPLIT;

  const drape: Pt[] = [];
  const drapeL = 0.08;
  const drapeR = stationsDrapeTo;
  for (let i = 0; i <= 10; i++) {
    const u = drapeL + ((drapeR - drapeL) * i) / 10;
    drape.push(P(u, BODY + 1, -0.03));
  }
  for (let i = 10; i >= 0; i--) {
    const u = drapeL + ((drapeR - drapeL) * i) / 10;
    const wave = Math.sin(i * 1.3) * 3.5;
    drape.push(P(u, BODY - 26 + wave, -0.04));
  }

  return (
    <g>
      {chapel && (
        <path
          d={`M${fmt(O.x - 10)} ${fmt(O.y + 6)} C ${fmt(O.x + 80)} ${fmt(O.y - 8)}, ${fmt(O.x + LEN - 40)} ${fmt(O.y + 10)}, ${fmt(O.x + LEN + 30)} ${fmt(O.y + 4)} C ${fmt(O.x + LEN)} ${fmt(O.y + 36)}, ${fmt(O.x + 40)} ${fmt(O.y + 40)}, ${fmt(O.x - 16)} ${fmt(O.y + 18)} Z`}
          fill="#4a2038"
        />
      )}
      <ellipse cx={O.x + LEN * 0.5} cy={O.y + 18} rx={LEN * 0.46} ry="14" fill="#000" opacity="0.28" filter={`url(#${uid}-blur)`} />
      <g mask={`url(#${uid}-reflmask)`} opacity="0.22">
        <path d={dPts(projectPoly(octagon(1.04, 1.12), -6))} fill={look.frontDeep} />
        <path d={dPts(wallPts({ u0: CU, w0: -0.04, u1: 1 - CU, w1: -0.04, face: 'front' }, -18, 8))} fill={look.front} />
      </g>

      {headOpen && <OpenLid u0={0.03} u1={SPLIT - 0.01} uid={uid} look={look} />}
      {footOpen && <OpenLid u0={SPLIT + 0.01} u1={0.97} uid={uid} look={look} />}

      <Walls a={-0.05} b={1.05} v0={-16} v1={7} su={1.045} sw={1.16} look={{ ...look, frontDeep: look.endDeep, end: look.endDeep, endDeep: look.gap }} frontUrl={look.endDeep} />
      <Walls a={-0.05} b={1.05} v0={-6} v1={8} su={1.04} sw={1.14} look={{ ...look, front: look.frontDeep }} frontUrl={look.frontDeep} />

      <Walls a={-0.02} b={1.02} v0={0} v1={BODY} su={1} sw={1} look={look} frontUrl={frontUrl} />

      <g clipPath={`url(#${uid}-frontclip)`}>
        {look.texture === 'brushed' ? (
          Array.from({ length: 10 }, (_, i) => (
            <line
              key={i}
              x1={O.x}
              x2={O.x + LEN}
              y1={O.y - 8 - i * 5.4}
              y2={O.y - 8 - i * 5.4}
              stroke="#fff"
              strokeOpacity="0.22"
              strokeWidth="0.8"
            />
          ))
        ) : look.texture === 'hammered' ? (
          <g fill={look.topHi} opacity="0.28">
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((u) =>
              [22, 40, 56].map((v) => {
                const p = P(u, v, 0);
                return <ellipse key={`${u}-${v}`} cx={p[0]} cy={p[1]} rx="5" ry="2" />;
              }),
            )}
          </g>
        ) : look.texture === 'lacquer' ? (
          <line
            x1={O.x + 24}
            x2={O.x + LEN - 24}
            y1={O.y - 28}
            y2={O.y - 28}
            stroke="#fff"
            strokeOpacity={0.28 + look.gloss * 0.25}
            strokeWidth="3"
          />
        ) : look.texture === 'matte' ? null : (
          <g stroke={look.grain} strokeWidth="0.9" fill="none" opacity="0.28">
            {[18, 32, 46, 58].map((v) => (
              <path key={v} d={dPts([P(0.06, v, 0), P(0.94, v, 0)], false)} />
            ))}
          </g>
        )}
        {casket.silhouette === 'PANEL' && mode === 'none' && (
          <g fill={look.endDeep} opacity="0.28" stroke={look.gap} strokeWidth="1">
            <rect x={P(0.16, 50, 0)[0]} y={P(0.16, 54, 0)[1]} width={P(0.4, 50, 0)[0] - P(0.16, 50, 0)[0]} height="28" />
            <rect x={P(0.56, 50, 0)[0]} y={P(0.56, 54, 0)[1]} width={P(0.82, 50, 0)[0] - P(0.56, 50, 0)[0]} height="28" />
          </g>
        )}
      </g>

      {bedding && well.length > 2 && (
        <g>
          <path d={dPts(projectPoly(well, BODY))} fill={look.topMid} />
          <path d={dPts(projectPoly(insetUV(well, 0.9), BODY - 3))} fill={look.customCloth ? look.lining : '#e7e1db'} />
          <path d={dPts(projectPoly(insetUV(well, 0.84), BODY - 2))} fill={look.customCloth ? look.lining : '#f7f5f3'} />
          <g stroke="#e4ddd6" strokeWidth="1.15" fill="none">
            {[0.22, 0.4, 0.58, 0.74].map((tw) => (
              <path key={tw} d={dPts(bedFold(insetUV(well, 0.84), BODY - 2, tw), false)} />
            ))}
          </g>
          <Pillow />
          <path d={dPts(drape)} fill={look.customCloth ? look.lining : '#fbfaf8'} />
          <g stroke="#e7e0da" strokeWidth="1" fill="none">
            {[8, 16, 23].map((drop) => (
              <path
                key={drop}
                d={dPts(
                  Array.from({ length: 8 }, (_, i) => {
                    const u = drapeL + ((drapeR - drapeL) * i) / 7;
                    return P(u, BODY - drop + Math.sin(i) * 1.4, -0.035);
                  }),
                  false,
                )}
              />
            ))}
          </g>
        </g>
      )}

      {showMold && (
        <g>
          {Array.from({ length: moldSteps }, (_, step) => {
            const su = 1.018 - step * 0.01;
            const sw = 1.03 - step * 0.028;
            const v0 = BODY + step * (mold / moldSteps);
            const v1 = BODY + (step + 1) * (mold / moldSteps);
            const flat = () => 0;
            return (
              <g key={step}>
                <Walls
                  a={moldA}
                  b={moldB}
                  v0={v0}
                  v1={v1}
                  su={su}
                  sw={sw}
                  look={{ ...look, front: step === 2 ? look.topMid : look.front, end: look.end }}
                  frontUrl={step === 2 ? look.topMid : frontUrl}
                />
                <path
                  d={dPts(chainLine(moldA, moldB, v1, flat, 0, su, sw), false)}
                  stroke={look.gap}
                  strokeWidth="1.05"
                  fill="none"
                />
                {look.molding === 'bead' && step === moldSteps - 1 && (
                  <path
                    d={dPts(chainLine(moldA, moldB, v1, flat, 0, su, sw), false)}
                    stroke="#fff"
                    strokeWidth="1.6"
                    fill="none"
                    opacity="0.45"
                  />
                )}
              </g>
            );
          })}
          {headOpen && !footOpen && (
            <path
              d={dPts([
                P(SPLIT, BODY, widthAt(SPLIT).front),
                P(SPLIT, BODY + mold + footLift(SPLIT + 0.02, amp), widthAt(SPLIT).front),
                P(SPLIT, BODY + mold + footLift(SPLIT + 0.02, amp), widthAt(SPLIT).back),
                P(SPLIT, BODY, widthAt(SPLIT).back),
              ])}
              fill={look.topMid}
              stroke={look.gap}
              strokeWidth="0.8"
            />
          )}
          {closedRanges.length === 2 ? (
            <CrownBand a={0.015} b={0.985} base={BODY + mold} amp={amp} lift={crownLift} look={look} topUrl={topUrl} seam />
          ) : (
            !footOpen && (
              <CrownBand a={SPLIT} b={0.99} base={BODY + mold} amp={amp} lift={footLift} look={look} topUrl={topUrl} />
            )
          )}
        </g>
      )}

      {headOpen && <LidHinge u0={0.05} u1={SPLIT - 0.02} look={look} />}
      {footOpen && <LidHinge u0={SPLIT + 0.02} u1={0.95} look={look} />}
      <Hardware look={look} uid={uid} barUrl={barUrl} />
      <CornerMark look={look} />
      {look.metal && !look.customCloth && casket.silhouette === 'FULL_COUCH' && (
        <path
          d={dPts([P(0.08, BODY - 2, 0), P(0.92, BODY - 2, 0)], false)}
          stroke="#d4b15e"
          strokeWidth="1.4"
          fill="none"
          opacity="0.8"
        />
      )}
    </g>
  );
}

function LidHinge({ u0, u1, look }: { u0: number; u1: number; look: Look }) {
  return (
    <path
      d={dPts([
        lidPoint(u0, 0),
        lidPoint(u1, 0),
        P(u1, BODY - 14, 0.78),
        P(u0, BODY - 14, 0.78),
      ])}
      fill={look.topMid}
      stroke={look.gap}
      strokeWidth="0.7"
    />
  );
}

function bedFold(well: UV[], v: number, tw: number): Pt[] {
  if (well.length < 2) return [];
  const us = well.map((p) => p.u);
  const a = Math.min(...us);
  const b = Math.max(...us);
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = a + ((b - a) * i) / 10;
    const span = widthAt(u);
    const w = span.front + (span.back - span.front) * tw;
    const wobble = Math.sin(i * 1.4) * 1.6;
    pts.push(P(u, v + wobble, w));
  }
  return pts;
}

function Pillow() {
  const c = P(0.16, BODY - 2, 0.38);
  return (
    <g>
      <ellipse cx={c[0]} cy={c[1] + 2} rx="34" ry="12" fill="#e7e0da" opacity="0.7" />
      <ellipse cx={c[0]} cy={c[1]} rx="32" ry="11" fill="#fbfaf8" />
      <path
        d={`M${fmt(c[0] - 18)} ${fmt(c[1])} Q ${fmt(c[0])} ${fmt(c[1] - 4)} ${fmt(c[0] + 16)} ${fmt(c[1] + 1)}`}
        stroke="#fff"
        strokeWidth="1.2"
        fill="none"
        opacity="0.8"
      />
    </g>
  );
}

/**
 * Half-couch and full-couch use the oak reference body.
 * Tapered and octagon are the six-sided pine coffin, recolored.
 * Head is on the left. Parallel edges stay parallel.
 */
export const CasketVessel: React.FC<{
  casket: CasketCatalogEntry;
  className?: string;
  showPlaque?: boolean;
  size?: 'sm' | 'md' | 'lg';
  chapel?: boolean;
  lid?: 'open' | 'closed';
}> = ({ casket, className, showPlaque = false, size = 'md', chapel = false, lid }) => {
  const uid = useId().replace(/:/g, '');
  const look = lookFor(casket);
  const coffin = isCoffin(casket.silhouette);
  const mode = resolveLid(casket, lid);
  const open = mode !== 'none';
  const width =
    className && /w-/.test(className)
      ? ''
      : size === 'lg'
        ? 'w-full'
        : size === 'sm'
          ? 'w-full'
          : 'w-72';
  const viewBox = coffin
    ? open
      ? '16 100 690 250'
      : '30 150 640 210'
    : open
      ? '24 8 660 360'
      : '30 124 640 230';
  const frontClip = dPts([
    P(0.0, 0, 0),
    P(1, 0, 0),
    P(1, BODY, 0),
    P(0, BODY, 0),
  ]);

  return (
    <svg viewBox={viewBox} className={`h-auto max-w-full ${width} ${className ?? ''}`} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.topHi} />
          <stop offset="0.45" stopColor={look.top} />
          <stop offset="1" stopColor={look.topMid} />
        </linearGradient>
        <linearGradient id={`${uid}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.frontHi} />
          <stop offset="0.45" stopColor={look.front} />
          <stop offset="1" stopColor={look.frontDeep} />
        </linearGradient>
        <linearGradient id={`${uid}-bar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.bar[0]} />
          <stop offset="0.45" stopColor={look.bar[1]} />
          <stop offset="1" stopColor={look.bar[2]} />
        </linearGradient>
        <linearGradient id={`${uid}-lug`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.lug[0]} />
          <stop offset="0.5" stopColor={look.lug[1]} />
          <stop offset="1" stopColor={look.lug[2]} />
        </linearGradient>
        <linearGradient id={`${uid}-lidface`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.topHi} />
          <stop offset="1" stopColor={look.topMid} />
        </linearGradient>
        <filter id={`${uid}-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}-reflmask`}>
          <rect x="0" y={O.y - 8} width="800" height="70" fill={`url(#${uid}-fade)`} />
        </mask>
        <clipPath id={`${uid}-frontclip`}>
          <path d={frontClip} />
        </clipPath>
      </defs>
      {coffin ? (
        <CoffinBody casket={casket} uid={uid} look={look} open={open} />
      ) : (
        <American casket={casket} uid={uid} look={look} mode={mode} chapel={chapel} />
      )}
      {showPlaque && (
        <g>
          <rect x="300" y={O.y + 28} width="72" height="14" rx="2" fill="#1c1410" opacity="0.72" />
          <text x="336" y={O.y + 38} textAnchor="middle" fill="#f5e6c8" fontSize="8" fontFamily="Georgia, serif">
            {friendlyToken(casket.material)}
          </text>
        </g>
      )}
    </svg>
  );
};

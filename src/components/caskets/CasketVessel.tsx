import { useId } from 'react';
import type { CasketCatalogEntry, CasketMaterial, CasketSilhouette } from '../../data/casketCatalog';

type Finish = {
  body: string;
  mid: string;
  deep: string;
  hi: string;
  grain: string;
  gloss: number;
  metal: boolean;
  stripe?: string;
};

type Metal = { base: string; hi: string; shade: string; spec: string };

function finishFor(material: CasketMaterial, silhouette: CasketSilhouette): Finish {
  if (material === 'PINE') {
    return { body: '#e7cc90', mid: '#c9a15a', deep: '#8d6730', hi: '#fff6df', grain: '#7a5224', gloss: 0.18, metal: false };
  }
  if (material === 'OAK' && silhouette === 'OCTAGON') {
    return { body: '#7a4e28', mid: '#5c3818', deep: '#3a220e', hi: '#c48a4a', grain: '#2a1408', gloss: 0.38, metal: false };
  }
  if (material === 'OAK') {
    return { body: '#c4893c', mid: '#9a6424', deep: '#6a4014', hi: '#f3d7a4', grain: '#5a3410', gloss: 0.5, metal: false };
  }
  if (material === 'CHERRY') {
    return { body: '#8e3034', mid: '#6c2024', deep: '#3c1014', hi: '#d46a66', grain: '#2c0a0e', gloss: 0.66, metal: false };
  }
  if (material === 'WALNUT') {
    return { body: '#4a3428', mid: '#35241c', deep: '#1c120e', hi: '#a4846c', grain: '#120c08', gloss: 0.42, metal: false };
  }
  if (material === 'MAHOGANY') {
    return { body: '#7a221c', mid: '#581412', deep: '#2e0a08', hi: '#c85a48', grain: '#240604', gloss: 0.84, metal: false };
  }
  if (material === 'STEEL' && silhouette === 'FULL_COUCH') {
    return { body: '#3e444c', mid: '#2a3036', deep: '#14171b', hi: '#8e98a2', grain: '#101216', gloss: 0.5, metal: true, stripe: '#d4b15e' };
  }
  if (material === 'STEEL') {
    return { body: '#d7dee4', mid: '#b4c0c8', deep: '#7a8894', hi: '#f8fafc', grain: '#8b98a4', gloss: 0.42, metal: true, stripe: '#9eb0c0' };
  }
  if (material === 'BRONZE') {
    return { body: '#b07a32', mid: '#8a5c20', deep: '#4c3010', hi: '#f0d090', grain: '#3e6b34', gloss: 0.74, metal: true };
  }
  return { body: '#c56a38', mid: '#9a4c22', deep: '#682e12', hi: '#f2b48a', grain: '#7a3416', gloss: 0.64, metal: true };
}

function metalFor(material: CasketMaterial, silhouette: CasketSilhouette): Metal {
  if (material === 'STEEL' && silhouette === 'FULL_COUCH') {
    return { base: '#2c3036', hi: '#a8b0b8', shade: '#101214', spec: '#f4f7fa' };
  }
  if (material === 'STEEL') {
    return { base: '#d8e0e6', hi: '#ffffff', shade: '#74828e', spec: '#ffffff' };
  }
  if (material === 'BRONZE' || material === 'WALNUT') {
    return { base: '#b8883c', hi: '#f6e0a4', shade: '#5a3a14', spec: '#fff6d4' };
  }
  if (material === 'COPPER' || material === 'CHERRY') {
    return { base: '#c86c3c', hi: '#f8c8a0', shade: '#6a3014', spec: '#fff2e4' };
  }
  if (material === 'PINE') {
    return { base: '#6a6560', hi: '#d2ccc4', shade: '#2a2724', spec: '#f7f4ee' };
  }
  if (silhouette === 'OCTAGON') {
    return { base: '#c2beb6', hi: '#f8f6f2', shade: '#5e5a54', spec: '#ffffff' };
  }
  if (material === 'MAHOGANY') {
    return { base: '#e2c45e', hi: '#fff6cc', shade: '#8a6c1c', spec: '#fffef6' };
  }
  return { base: '#c9a45c', hi: '#f8e8b4', shade: '#6e5418', spec: '#fffaf0' };
}

function isCoffin(s: CasketSilhouette) {
  return s === 'TAPERED' || s === 'OCTAGON';
}

function SwingBar({
  x,
  y,
  metal,
  gid,
}: {
  x: number;
  y: number;
  metal: Metal;
  gid: string;
}) {
  return (
    <g>
      <rect x={x - 22} y={y - 18} width="14" height="18" rx="2" fill={metal.shade} />
      <rect x={x + 8} y={y - 18} width="14" height="18" rx="2" fill={metal.shade} />
      <rect x={x - 20} y={y - 16} width="10" height="14" rx="1.5" fill={metal.base} />
      <rect x={x + 10} y={y - 16} width="10" height="14" rx="1.5" fill={metal.base} />
      <path d={`M${x - 16} ${y - 14} H${x - 10} M${x + 12} ${y - 14} H${x + 18}`} stroke={metal.spec} strokeWidth="1.2" />
      <path d={`M${x - 15} ${y} V${y + 14} M${x + 15} ${y} V${y + 14}`} stroke={metal.shade} strokeWidth="3" />
      <rect x={x - 28} y={y + 12} width="56" height="10" rx="5" fill={`url(#${gid})`} />
      <rect x={x - 22} y={y + 13.6} width="34" height="2.2" rx="1" fill={metal.spec} opacity="0.95" />
    </g>
  );
}

function CornerCap({ x, y, metal, flip }: { x: number; y: number; metal: Metal; flip?: boolean }) {
  const d = flip
    ? `M${x} ${y} h14 v4 h-10 v8 h-4 z`
    : `M${x} ${y} h-14 v4 h10 v8 h4 z`;
  return <path d={d} fill={metal.base} stroke={metal.hi} strokeWidth="0.6" />;
}

function Grain({ d, color, metal }: { d: string; color: string; metal: boolean }) {
  if (metal) {
    return (
      <g fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.28">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={d} transform={`translate(0 ${i * 3 - 10})`} />
        ))}
      </g>
    );
  }
  return (
    <g fill="none" stroke={color} strokeWidth="0.9" opacity="0.55" strokeLinecap="round">
      <path d={d} />
    </g>
  );
}

function American({
  casket,
  uid,
  chapel,
}: {
  casket: CasketCatalogEntry;
  uid: string;
  chapel?: boolean;
}) {
  const fin = finishFor(casket.material, casket.silhouette);
  const metal = metalFor(casket.material, casket.silhouette);
  const lining = casket.palette.lining;
  const half = casket.silhouette === 'HALF_COUCH';
  const full = casket.silhouette === 'FULL_COUCH';
  const dome = casket.silhouette === 'DOME';
  const panel = casket.silhouette === 'PANEL';
  const open = half || full;
  const bar = `cask-bar-${uid}`;
  const lidG = `cask-lid-${uid}`;
  const sideG = `cask-side-${uid}`;
  const clipSide = `cask-side-clip-${uid}`;
  const clipLid = `cask-lid-clip-${uid}`;

  const side = 'M48 118 L362 104 L374 150 L36 164 Z';
  const head = 'M14 132 L48 118 L36 164 L6 174 Z';
  const foot = 'M362 104 L392 116 L386 156 L374 150 Z';
  const plinth = 'M24 158 L380 144 L398 172 L10 186 Z';
  const closedLid = half
    ? 'M204 72 L352 56 L368 108 L210 122 Z'
    : dome
      ? 'M44 118 C36 36 372 28 380 104 L368 112 L52 126 Z'
      : 'M46 78 L352 58 L370 112 L40 128 Z';
  const well = full
    ? 'M58 86 L348 70 L362 114 L48 130 Z'
    : 'M58 88 L196 76 L204 120 L50 132 Z';
  const raised = full
    ? 'M52 30 L346 16 L348 70 L58 86 Z'
    : 'M52 34 L198 22 L196 76 L58 88 Z';

  return (
    <g>
      <defs>
        <linearGradient id={lidG} x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor={fin.hi} />
          <stop offset="0.45" stopColor={fin.body} />
          <stop offset="1" stopColor={fin.mid} />
        </linearGradient>
        <linearGradient id={sideG} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fin.body} />
          <stop offset="0.55" stopColor={fin.mid} />
          <stop offset="1" stopColor={fin.deep} />
        </linearGradient>
        <linearGradient id={bar} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={metal.spec} />
          <stop offset="0.35" stopColor={metal.hi} />
          <stop offset="1" stopColor={metal.shade} />
        </linearGradient>
        <clipPath id={clipSide}>
          <path d={side} />
        </clipPath>
        <clipPath id={clipLid}>
          <path d={closedLid} />
        </clipPath>
      </defs>

      {chapel && (
        <g>
          <path d="M18 150 C60 138 340 128 392 150 C360 198 40 204 8 168 Z" fill="#3b1d38" />
          <path d="M40 162 C90 154 160 170 210 158 C250 148 310 156 360 150" stroke="#1a0c16" strokeWidth="3" fill="none" opacity="0.45" />
          <path d="M30 172 C100 164 180 182 260 168 C300 162 340 168 380 160" stroke="#fff" strokeWidth="1" fill="none" opacity="0.18" />
        </g>
      )}

      <ellipse cx="200" cy="178" rx="168" ry="12" fill="#000" opacity="0.38" />
      <path d={plinth} fill={fin.deep} />
      <path d="M30 160 L376 146" stroke={fin.hi} strokeOpacity="0.35" strokeWidth="1.4" />

      <path d={head} fill={fin.mid} />
      <path d={foot} fill={fin.deep} />
      <path d={side} fill={`url(#${sideG})`} />

      <g clipPath={`url(#${clipSide})`}>
        {fin.metal ? (
          Array.from({ length: 14 }, (_, i) => (
            <line
              key={i}
              x1="20"
              x2="400"
              y1={112 + i * 3.4}
              y2={108 + i * 3.4}
              stroke="#fff"
              strokeOpacity="0.16"
              strokeWidth="0.7"
            />
          ))
        ) : (
          <g fill="none" stroke={fin.grain} strokeWidth="1.1" opacity="0.5" strokeLinecap="round">
            <path d="M60 128 C120 122 180 136 250 126 C300 120 340 130 370 124" />
            <path d="M54 140 C130 134 200 148 280 138 C320 134 350 142 372 136" />
            <path d="M70 152 C140 146 210 156 300 148" />
          </g>
        )}
        {panel && (
          <g fill={fin.deep} stroke={fin.hi} strokeOpacity="0.35">
            <path d="M78 124 L150 118 L154 146 L74 152 Z" />
            <path d="M170 116 L250 110 L254 140 L166 146 Z" />
            <path d="M270 108 L340 104 L344 132 L266 138 Z" />
          </g>
        )}
      </g>

      <path d="M48 112 L362 98 L362 108 L48 122 Z" fill={fin.hi} opacity="0.55" />
      <path d="M48 118 L362 104" stroke={fin.deep} strokeWidth="2.2" />
      {fin.stripe && <path d="M50 115 L360 101" stroke={fin.stripe} strokeWidth="1.6" />}

      <SwingBar x={110} y={132} metal={metal} gid={bar} />
      <SwingBar x={210} y={126} metal={metal} gid={bar} />
      <SwingBar x={310} y={120} metal={metal} gid={bar} />

      {open ? (
        <>
          <path d={well} fill={lining} />
          <path d={well} fill="#000" opacity="0.18" />
          <path d={well} fill={lining} stroke={fin.deep} strokeWidth="1.2" />
          <g stroke="#5c3d3a" strokeOpacity="0.45" fill="none" strokeWidth="1.1">
            {full ? (
              <>
                <path d="M80 92 L120 108 L160 90 L200 106 L240 88 L280 104 L320 86" />
                <path d="M100 86 L130 112 L180 96 L230 114 L280 98 L330 112" />
              </>
            ) : (
              <>
                <path d="M72 96 L104 116 L140 98 L176 118" />
                <path d="M86 90 L124 112 L158 94" />
                <path d="M98 122 L140 100 L168 120" />
              </>
            )}
          </g>
          <g>
            {(full
              ? [
                  [100, 100],
                  [150, 96],
                  [200, 92],
                  [250, 88],
                  [300, 84],
                  [120, 114],
                  [180, 110],
                  [240, 106],
                  [300, 102],
                ]
              : [
                  [90, 104],
                  [124, 100],
                  [158, 96],
                  [104, 116],
                  [140, 112],
                ]
            ).map(([x, y]) => (
              <g key={`${x}-${y}`}>
                <circle cx={x} cy={y + 1} r="4.2" fill="#000" opacity="0.22" />
                <circle cx={x} cy={y} r="3.1" fill="#3f2a28" opacity="0.55" />
                <circle cx={x - 0.7} cy={y - 0.8} r="1.5" fill="#fff" opacity="0.8" />
              </g>
            ))}
          </g>
          <ellipse cx={full ? 100 : 96} cy={full ? 116 : 120} rx="30" ry="12" fill="#fff" opacity="0.35" />
          <ellipse cx={full ? 98 : 94} cy={full ? 114 : 118} rx="24" ry="9" fill={lining} stroke="#fff" strokeOpacity="0.55" />
          <path
            d={full ? 'M80 114 C98 108 116 120 132 112' : 'M76 118 C94 110 112 124 128 116'}
            stroke="#fff"
            strokeOpacity="0.8"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d={full ? 'M86 116 C100 120 118 112 130 118' : 'M82 120 C96 124 112 116 124 122'}
            stroke="#000"
            strokeOpacity="0.18"
            fill="none"
          />

          <path d={raised} fill={lining} stroke={fin.body} strokeWidth="5" />
          <path d={raised} fill="#fff" opacity="0.18" />
          {(full
            ? [
                [110, 48],
                [170, 44],
                [230, 40],
                [290, 36],
                [130, 62],
                [200, 58],
                [270, 54],
              ]
            : [
                [90, 56],
                [124, 52],
                [158, 48],
                [104, 70],
                [140, 66],
              ]
          ).map(([x, y]) => (
            <g key={`r-${x}`}>
              <circle cx={x} cy={y} r="2.8" fill="#000" opacity="0.25" />
              <circle cx={x - 0.4} cy={y - 0.5} r="1.7" fill="#fff" opacity="0.75" />
            </g>
          ))}
          <path d="M70 40 C120 34 160 42 190 36" stroke="#fff" strokeOpacity="0.4" fill="none" />

          {half && (
            <>
              <path d={closedLid} fill={`url(#${lidG})`} />
              <g clipPath={`url(#${clipLid})`}>
                <Grain
                  d="M214 86 C250 78 290 92 340 80 M220 100 C270 92 310 104 360 94"
                  color={fin.grain}
                  metal={fin.metal}
                />
                <path
                  d="M230 70 C280 62 320 74 350 66"
                  stroke="#fff"
                  strokeWidth={3 + fin.gloss * 4}
                  fill="none"
                  opacity={0.25 + fin.gloss * 0.45}
                />
              </g>
              <path d="M204 72 L210 122" stroke={fin.deep} strokeWidth="3" />
              <rect x="198" y="92" width="14" height="8" rx="1" fill={metal.base} />
              <rect x="202" y="94" width="6" height="2" fill={metal.spec} opacity="0.8" />
            </>
          )}
        </>
      ) : (
        <>
          <path d={closedLid} fill={`url(#${lidG})`} />
          <g clipPath={`url(#${clipLid})`}>
            <Grain
              d="M70 90 C140 78 220 100 320 82 M80 108 C160 98 240 118 340 100"
              color={fin.grain}
              metal={fin.metal}
            />
            <path
              d="M90 70 C160 58 240 78 330 60"
              stroke="#fff"
              strokeWidth={4}
              fill="none"
              opacity={0.2 + fin.gloss * 0.5}
            />
            {panel && (
              <g fill="none" stroke={fin.deep} strokeOpacity="0.55">
                <path d="M90 82 L160 74 L168 104 L86 112 Z" />
                <path d="M180 72 L260 64 L268 96 L176 104 Z" />
                <path d="M280 62 L340 58 L346 86 L276 94 Z" />
              </g>
            )}
          </g>
          {dome && (
            <path d="M80 78 C160 40 280 36 350 70" stroke="#fff" strokeOpacity="0.35" fill="none" strokeWidth="2" />
          )}
        </>
      )}

      <path d="M48 78 L40 128" stroke={fin.hi} strokeOpacity="0.45" strokeWidth="2" />
      <CornerCap x={52} y={74} metal={metal} />
      <CornerCap x={360} y={58} metal={metal} flip />
      <CornerCap x={40} y={124} metal={metal} />
      <CornerCap x={366} y={108} metal={metal} flip />

      {chapel && half && (
        <g>
          <path d="M300 78 C312 58 336 54 334 76" stroke="#3f6212" strokeWidth="2.2" fill="none" />
          <ellipse cx="322" cy="64" rx="9" ry="6" fill="#9f1239" />
          <ellipse cx="336" cy="70" rx="8" ry="5.5" fill="#be123c" />
          <ellipse cx="326" cy="78" rx="7" ry="5" fill="#e11d48" />
          <ellipse cx="314" cy="72" rx="5" ry="4" fill="#fb7185" />
          <path d="M318 66 C324 62 330 66 328 70" stroke="#fff" strokeOpacity="0.35" fill="none" />
        </g>
      )}
    </g>
  );
}

function Coffin({ casket, uid }: { casket: CasketCatalogEntry; uid: string }) {
  const fin = finishFor(casket.material, casket.silhouette);
  const metal = metalFor(casket.material, casket.silhouette);
  const pine = casket.material === 'PINE';
  const bronze = casket.material === 'BRONZE';
  const lidG = `cof-lid-${uid}`;
  const sideG = `cof-side-${uid}`;
  const bar = `cof-bar-${uid}`;
  const clip = `cof-clip-${uid}`;

  const roofNear = 'M86 100 L148 128 L318 116 L356 82 L214 72 L124 80 Z';
  const roofFar = 'M86 100 L124 80 L158 36 L292 28 L356 82 L214 72 Z';
  const longSide = 'M148 128 L318 116 L328 160 L136 172 Z';
  const shoulder = 'M86 100 L148 128 L136 172 L58 142 Z';
  const footEnd = 'M318 116 L356 82 L384 102 L328 160 Z';
  const headEnd = 'M86 100 L58 142 L40 126 L74 84 Z';

  return (
    <g>
      <defs>
        <linearGradient id={lidG} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fin.hi} />
          <stop offset="0.5" stopColor={fin.body} />
          <stop offset="1" stopColor={fin.mid} />
        </linearGradient>
        <linearGradient id={sideG} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fin.body} />
          <stop offset="1" stopColor={fin.deep} />
        </linearGradient>
        <linearGradient id={bar} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={metal.spec} />
          <stop offset="0.4" stopColor={metal.hi} />
          <stop offset="1" stopColor={metal.shade} />
        </linearGradient>
        <clipPath id={clip}>
          <path d={`${roofNear} ${roofFar}`} />
        </clipPath>
      </defs>

      <ellipse cx="200" cy="176" rx="150" ry="11" fill="#000" opacity="0.36" />
      <path d="M56 158 L348 146 L362 174 L44 186 Z" fill={fin.deep} />
      <path d={headEnd} fill={fin.mid} />
      <path d={footEnd} fill={fin.deep} />
      <path d={shoulder} fill={fin.mid} />
      <path d={longSide} fill={`url(#${sideG})`} />

      <path d={roofFar} fill={fin.mid} />
      <path d={roofNear} fill={`url(#${lidG})`} />
      <path d="M124 80 L214 72 L356 82" stroke={fin.hi} strokeOpacity="0.75" fill="none" strokeWidth="3" />
      <path d="M158 36 L292 28" stroke="#fff" strokeOpacity={bronze ? 0.6 : 0.3} fill="none" strokeWidth="2.2" />

      {bronze && (
        <g fill="none" stroke="#3f6b34" strokeWidth="2" opacity="0.55">
          <path d="M170 64 C210 74 260 60 330 70" />
          <path d="M150 96 C210 108 270 92 340 102" />
        </g>
      )}
      {pine && (
        <g>
          <ellipse cx="180" cy="96" rx="8" ry="5" fill="#a67c3d" opacity="0.7" />
          <ellipse cx="250" cy="100" rx="5" ry="3.5" fill="#8a6230" opacity="0.65" />
          <ellipse cx="210" cy="128" rx="6" ry="3" fill="#b8894a" opacity="0.5" />
        </g>
      )}
      {!pine && !bronze && (
        <g fill="none" stroke={fin.grain} strokeWidth="1" opacity="0.55">
          <path d="M150 108 C200 98 250 116 330 104" />
          <path d="M160 126 C220 116 280 132 340 120" />
        </g>
      )}

      <path d="M148 128 L318 116" stroke={fin.hi} strokeOpacity="0.45" strokeWidth="2.2" />
      {!pine && <path d="M152 134 L314 122" stroke={fin.deep} strokeWidth="3.2" opacity="0.7" />}

      {pine ? (
        <g stroke={metal.base} strokeWidth="3" fill="none">
          <path d="M176 146 v12 h26 v-12" />
          <path d="M258 140 v12 h26 v-12" />
          <path d="M176 146 h26 M258 140 h26" stroke={metal.hi} strokeWidth="1.2" />
        </g>
      ) : (
        <>
          <SwingBar x={200} y={142} metal={metal} gid={bar} />
          <SwingBar x={280} y={136} metal={metal} gid={bar} />
        </>
      )}

      <circle cx="78" cy="96" r={bronze ? 5 : 3.5} fill={metal.base} stroke={metal.hi} />
      <circle cx="348" cy="78" r={bronze ? 5 : 3.5} fill={metal.base} stroke={metal.hi} />
      <circle cx="132" cy="118" r={bronze ? 4.5 : 3} fill={metal.base} stroke={metal.hi} />
      {bronze && (
        <>
          <path d="M70 88 L86 104" stroke={metal.hi} strokeWidth="1.2" />
          <path d="M340 70 L356 86" stroke={metal.hi} strokeWidth="1.2" />
        </>
      )}
    </g>
  );
}

/**
 * Three-quarter casket or six-sided coffin. Head is on the left.
 * Half-couch and full-couch lids are open onto tufted satin.
 * Tapered and octagon silhouettes are coffins, not rectangular caskets.
 */
export const CasketVessel: React.FC<{
  casket: CasketCatalogEntry;
  className?: string;
  showPlaque?: boolean;
  size?: 'sm' | 'md' | 'lg';
  chapel?: boolean;
}> = ({ casket, className, showPlaque = false, size = 'md', chapel = false }) => {
  const uid = useId().replace(/:/g, '');
  const width =
    className && /w-/.test(className)
      ? ''
      : size === 'lg'
        ? 'w-full'
        : size === 'sm'
          ? 'w-full'
          : 'w-72';

  return (
    <svg viewBox="0 0 400 200" className={`h-auto max-w-full ${width} ${className ?? ''}`} aria-hidden>
      {isCoffin(casket.silhouette) ? (
        <Coffin casket={casket} uid={uid} />
      ) : (
        <American casket={casket} uid={uid} chapel={chapel} />
      )}
      {showPlaque && (
        <g>
          <rect x="168" y="168" width="64" height="14" rx="2" fill="#1c1410" opacity="0.72" />
          <text x="200" y="178" textAnchor="middle" fill="#f5e6c8" fontSize="8" fontFamily="Georgia, serif">
            {casket.material}
          </text>
        </g>
      )}
    </svg>
  );
};

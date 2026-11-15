/**
 * Side profiles for the v0.9.26 showroom references.
 * Nose to the left on every car. No crests, no photographer marks.
 */

function AlloyWheel({
  cx,
  cy,
  r,
  spokes = 10,
  lip = '#eef3f7',
}: {
  cx: number;
  cy: number;
  r: number;
  spokes?: number;
  lip?: string;
}) {
  const blades = [];
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 - Math.PI / 2;
    blades.push(
      <line
        key={i}
        x1={cx + Math.cos(a) * r * 0.24}
        y1={cy + Math.sin(a) * r * 0.24}
        x2={cx + Math.cos(a) * r * 0.68}
        y2={cy + Math.sin(a) * r * 0.68}
        stroke={lip}
        strokeWidth={Math.max(1.5, r * 0.09)}
        strokeLinecap="round"
      />
    );
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#0e0f12" />
      <circle cx={cx} cy={cy} r={r * 0.84} fill="#b7c0c8" />
      <circle cx={cx} cy={cy} r={r * 0.74} fill="#1a1c20" />
      {blades}
      <circle cx={cx} cy={cy} r={r * 0.2} fill={lip} />
      <circle cx={cx} cy={cy} r={r * 0.07} fill="#121212" />
    </g>
  );
}

function Whitewall({
  cx,
  cy,
  r,
  disc,
}: {
  cx: number;
  cy: number;
  r: number;
  disc?: boolean;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#121212" />
      <circle cx={cx} cy={cy} r={r * 0.82} fill="#f6f3ea" />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#161616" />
      {disc ? (
        <>
          <circle cx={cx} cy={cy} r={r * 0.48} fill="#dce2e8" />
          <circle cx={cx} cy={cy} r={r * 0.3} fill="#f8f9fa" />
          <circle cx={cx} cy={cy} r={r * 0.08} fill="#1a1a1a" />
        </>
      ) : (
        <>
          <circle cx={cx} cy={cy} r={r * 0.26} fill="#c9d0d6" />
          <circle cx={cx} cy={cy} r={r * 0.09} fill="#f4f6f8" />
        </>
      )}
    </g>
  );
}

/** Dark arch cut into the body above the tire. Stays above the axle. */
function Well({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const a = r + 3;
  return (
    <path
      d={`M${cx - a} ${cy - 4} Q${cx} ${cy - a - 6} ${cx + a} ${cy - 4} Z`}
      fill="#07080a"
    />
  );
}

function Pane({
  d,
  glass,
}: {
  d: string;
  glass: string;
}) {
  return (
    <path d={d} fill={`url(#${glass})`} stroke="#d7e0e8" strokeWidth="0.9" />
  );
}

function Curtains({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const lines = [];
  for (let i = x + 3; i < x + w - 2; i += 3.2) {
    lines.push(
      <line
        key={i}
        x1={i}
        y1={y + 2}
        x2={i}
        y2={y + h - 2}
        stroke="#d5e2ec"
        strokeWidth="0.55"
        opacity="0.55"
      />
    );
  }
  return <g>{lines}</g>;
}

type Ids = { paint: string; glass: string };

/** Gloss-black crossover hearse. Padded landau, angular sash, rear swoosh. */
export function CrestLandau({ paint, glass }: Ids) {
  return (
    <g>
      <path
        d="M30 108 C26 100 36 94 50 90 L86 84 C104 70 122 56 146 48 L176 44 H204 C220 34 238 30 262 30 H344 C370 32 388 44 396 62 L402 90 C404 108 392 116 376 116 H46 C32 116 26 114 30 108 Z"
        fill={`url(#${paint})`}
        stroke="rgba(255,255,255,0.38)"
        strokeWidth="0.8"
      />
      <path
        d="M200 46 C218 32 240 28 264 28 H342 C366 30 382 40 390 54 L384 62 H210 Z"
        fill="#0b0c10"
      />
      <path
        d="M176 44 H250"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M192 102 L218 42 H244"
        fill="none"
        stroke="#f7f8f8"
        strokeWidth="5"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
      <path
        d="M286 46 C318 38 346 42 374 58"
        fill="none"
        stroke="#f4f6f8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="378" cy="59" r="2.4" fill="#f7f8f8" />
      <Pane d="M112 66 L132 52 H162 V94 H104 Z" glass={glass} />
      <Pane d="M168 50 H200 V94 H168 Z" glass={glass} />
      <path d="M58 92 H390" stroke="#e7eef4" strokeWidth="1.5" />
      <path d="M50 112 H384" stroke="#c9d3dc" strokeWidth="2.1" />
      <path d="M164 56 V108 M202 50 V108" stroke="#121316" strokeWidth="0.8" />
      <rect x="146" y="98" width="12" height="2.2" rx="0.7" fill="#e8eef3" />
      <rect x="180" y="98" width="12" height="2.2" rx="0.7" fill="#e8eef3" />
      <rect x="28" y="88" width="7" height="20" rx="1" fill="#f7f4ea" />
      <rect x="29.4" y="90" width="3.4" height="16" fill="#fff" />
      <rect x="24" y="102" width="10" height="8" rx="0.4" fill="#101114" />
      <path d="M394 74 H406 V106 H394 Z" fill="#5c1218" />
      <path d="M397 78 H403 V102 H397 Z" fill="#e23b42" />
      <circle cx="358" cy="98" r="3.2" fill="none" stroke="#c5ced6" strokeWidth="1" />
      <Well cx={112} cy={124} r={21} />
      <Well cx={324} cy={124} r={21} />
      <AlloyWheel cx={112} cy={124} r={21} />
      <AlloyWheel cx={324} cy={124} r={21} />
    </g>
  );
}

/** Silver formal: black landau cap, one arched bar, curtained bay. */
export function SilverLandau({ paint, glass }: Ids) {
  return (
    <g>
      <path
        d="M24 108 C18 100 30 92 48 88 L104 82 C124 72 142 60 164 52 H230 V50 H256 L272 62 H368 C390 66 404 80 406 96 L400 114 H40 C26 116 20 114 24 108 Z"
        fill={`url(#${paint})`}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="0.8"
      />
      <path
        d="M254 52 H368 C388 52 400 60 404 74 V80 H262 L254 64 Z"
        fill="#14161c"
      />
      <path d="M164 50 H252" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" />
      <Pane d="M156 58 H190 V104 H148 L156 58 Z" glass={glass} />
      <Pane d="M196 56 H230 V104 H196 Z" glass={glass} />
      <Curtains x={198} y={58} w={30} h={44} />
      <Pane d="M236 56 H268 V104 H236 Z" glass={glass} />
      <Curtains x={238} y={58} w={28} h={44} />
      <path
        d="M266 72 C318 34 368 38 400 68"
        fill="none"
        stroke="#f4f7fa"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="266" cy="72" r="3" fill="#f7f9fb" stroke="#8e98a2" strokeWidth="0.6" />
      <circle cx="334" cy="44" r="3.1" fill="#f7f9fb" stroke="#8e98a2" strokeWidth="0.6" />
      <circle cx="400" cy="68" r="3" fill="#f7f9fb" stroke="#8e98a2" strokeWidth="0.6" />
      <path d="M248 58 V76" stroke="#d5dde4" strokeWidth="1.1" />
      <path d="M245 62 H251 M245 66 H251 M245 70 H251" stroke="#d5dde4" strokeWidth="0.7" />
      <circle cx="248" cy="55" r="2" fill="#f4e7b8" />
      <path d="M54 92 H396" stroke="#f7f9fb" strokeWidth="1.6" />
      <path d="M44 110 H398" stroke="#b7c0c8" strokeWidth="1.8" />
      <path d="M192 60 V110 M232 58 V110" stroke="#8a929a" strokeWidth="0.7" />
      <rect x="170" y="98" width="12" height="2" rx="0.6" fill="#f2f5f8" />
      <rect x="26" y="96" width="16" height="8" rx="1" fill="#f7f4ea" />
      <path d="M398 78 H410 V108 H398 Z" fill="#7a1820" />
      <path d="M401 82 H407 V104 H401 Z" fill="#e23b42" />
      <circle cx="352" cy="92" r="3.4" fill="none" stroke="#8a929a" />
      <Well cx={116} cy={124} r={21} />
      <Well cx={328} cy={124} r={21} />
      <AlloyWheel cx={116} cy={124} r={21} spokes={7} />
      <AlloyWheel cx={328} cy={124} r={21} spokes={7} />
    </g>
  );
}

/** Pewter square hearse. Black roof, twin irons, wide whitewalls. */
export function PewterParish({ paint, glass }: Ids) {
  return (
    <g>
      <path
        d="M20 112 L36 100 L54 92 H100 L126 68 L148 52 H360 L384 66 L396 100 L388 116 H26 Z"
        fill={`url(#${paint})`}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.7"
      />
      <path d="M134 66 L150 48 H366 L382 66 H142 Z" fill="#12141a" />
      <path d="M286 66 H376 L390 102 H286 Z" fill="#12141a" />
      <path
        d="M176 46 L358 42 M174 52 L360 48"
        stroke="#eef2f6"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <Pane d="M158 58 H202 V102 H158 Z" glass={glass} />
      <Pane d="M210 56 H254 V102 H210 Z" glass={glass} />
      <Pane d="M262 56 H308 V98 H262 Z" glass={glass} />
      <path d="M56 98 H386" stroke="#efe8dc" strokeWidth="1.5" />
      <path d="M44 110 H388" stroke="#cfc6b6" strokeWidth="1.7" />
      <rect x="20" y="94" width="18" height="10" rx="1" fill="#e4ddd0" />
      <path d="M23 97 H35 M23 100 H35 M23 103 H35" stroke="#2a2a2a" strokeWidth="0.7" />
      <rect x="16" y="106" width="26" height="5" rx="1" fill="#d9d3c6" />
      <path d="M388 76 H400 V106 H388 Z" fill="#5c1218" />
      <circle cx="346" cy="90" r="3.6" fill="none" stroke="#6a645c" strokeWidth="1.1" />
      <Well cx={112} cy={124} r={21} />
      <Well cx={318} cy={124} r={21} />
      <Whitewall cx={112} cy={124} r={21} />
      <Whitewall cx={318} cy={124} r={21} />
    </g>
  );
}

function Drape({ x, w }: { x: number; w: number }) {
  const mid = x + w / 2;
  return (
    <g>
      <path
        d={`M${x} 64 Q${mid} 52 ${x + w} 64 V114 H${x} Z`}
        fill="#101216"
        stroke="#9aa3ad"
        strokeWidth="0.9"
      />
      <path
        d={`M${x + 4} 74 Q${mid} 92 ${x + w - 4} 74`}
        fill="none"
        stroke="#d5dbe2"
        strokeWidth="1.15"
      />
      <path
        d={`M${x + 8} 84 Q${mid} 108 ${x + w - 8} 84`}
        fill="none"
        stroke="#a8b0b8"
        strokeWidth="1"
      />
      <path
        d={`M${x + 10} 62 V90 M${x + w - 10} 62 V90`}
        stroke="#8a929a"
        strokeWidth="0.8"
      />
    </g>
  );
}

/** 1938 formal. Pontoon fenders, carved drapes, disc whitewalls. */
export function DraperEight({ paint, glass }: Ids) {
  return (
    <g>
      <path
        d="M34 108 L42 82 L54 72 L130 64 L168 56 L188 44 H250 C290 40 340 42 368 50 C390 58 402 74 400 94 L392 116 H44 Z"
        fill={`url(#${paint})`}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.8"
      />
      <path
        d="M58 112 C54 88 78 72 112 70 C148 68 170 88 166 114"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2.2"
      />
      <path
        d="M262 114 C258 94 290 82 328 80 C368 78 394 96 390 116"
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.8"
      />
      <path d="M72 78 H124 M76 84 H120 M80 90 H116" stroke="#0c0c0e" strokeWidth="1.4" />
      <Pane d="M156 60 L174 46 H204 V98 H148 Z" glass={glass} />
      <path d="M176 46 V98" stroke="#e8eef2" strokeWidth="0.9" />
      <path d="M214 58 V82" stroke="#d5dde4" strokeWidth="1.1" />
      <path d="M211 62 H217 M211 67 H217 M211 72 H217" stroke="#d5dde4" strokeWidth="0.7" />
      <circle cx="214" cy="54" r="2.1" fill="#f6e7b8" />
      <Drape x={230} w={48} />
      <Drape x={282} w={48} />
      <Drape x={334} w={46} />
      <path d="M140 112 H248" stroke="#e4ebf0" strokeWidth="3" strokeLinecap="round" />
      <rect x="26" y="70" width="14" height="32" rx="1" fill="#0c0c0e" stroke="#d5dde4" strokeWidth="0.8" />
      <path
        d="M29 74 H37 M29 79 H37 M29 84 H37 M29 89 H37 M29 94 H37"
        stroke="#d5dde4"
        strokeWidth="0.7"
      />
      <rect x="16" y="102" width="22" height="5" rx="1" fill="#d5dde4" />
      <Well cx={108} cy={122} r={22} />
      <Well cx={324} cy={122} r={22} />
      <Whitewall cx={108} cy={122} r={22} disc />
      <Whitewall cx={324} cy={122} r={22} disc />
    </g>
  );
}

/** Ivory open-deck flower car. Box cab, chrome bed rail, big wheels. */
export function IvoryDeck({ paint, glass }: Ids) {
  return (
    <g>
      <path
        d="M22 112 L40 100 L62 92 H100 L124 72 L148 56 H208 L216 78 H372 L392 94 L400 114 H28 Z"
        fill={`url(#${paint})`}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="0.8"
      />
      <path d="M148 56 H208 L216 70 H156 Z" fill="rgba(255,255,255,0.28)" />
      <path d="M220 72 H378" stroke="#f7f9fb" strokeWidth="3" strokeLinecap="round" />
      <path d="M236 72 V90 M308 72 V92 M362 72 V90" stroke="#d5dde4" strokeWidth="1.6" />
      <path d="M220 90 H378" stroke="#c5ced6" strokeWidth="1.3" />
      <Pane d="M140 64 H200 V104 H126 L140 64 Z" glass={glass} />
      <path d="M64 96 H392" stroke="#f7f9fb" strokeWidth="1.7" />
      <path d="M58 106 H394" stroke="#d9d0be" strokeWidth="1.5" />
      <rect x="20" y="98" width="20" height="8" rx="1" fill="#f7f4ea" />
      <rect x="16" y="108" width="28" height="5" rx="1" fill="#e7edf2" />
      <rect x="386" y="100" width="14" height="7" rx="1" fill="#d5dbe2" />
      <path d="M206 62 V110" stroke="#b7a98e" strokeWidth="0.8" />
      <rect x="172" y="98" width="14" height="2.2" rx="0.6" fill="#f4f7fa" />
      <Well cx={108} cy={124} r={22} />
      <Well cx={328} cy={124} r={22} />
      <AlloyWheel cx={108} cy={124} r={22} spokes={8} />
      <AlloyWheel cx={328} cy={124} r={22} spokes={8} />
    </g>
  );
}

/** 1941 flower car. Rounded cab, open bed to the rear, whitewalls. */
export function FortyOneBed({ paint, glass }: Ids) {
  return (
    <g>
      <path
        d="M36 108 L46 84 L58 72 L110 64 L136 50 L168 44 L196 50 L210 68 H360 C382 72 396 86 394 104 L386 116 H46 Z"
        fill={`url(#${paint})`}
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="0.8"
      />
      <path
        d="M52 114 C48 92 74 76 110 74 C148 72 170 92 166 116"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.8"
      />
      <path
        d="M268 116 C264 96 292 84 328 82 C366 80 390 98 386 116"
        fill="none"
        stroke="rgba(90,80,60,0.55)"
        strokeWidth="1.6"
      />
      <path d="M214 64 H368" stroke="#e7eef3" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M236 64 V78 M300 64 V80 M352 64 V78" stroke="#c5ced6" strokeWidth="1.4" />
      <Pane d="M124 56 H168 V100 H112 L124 56 Z" glass={glass} />
      <path d="M70 74 H112 M74 80 H108 M78 86 H104" stroke="#6a645c" strokeWidth="1.25" />
      <path d="M86 42 L78 32" stroke="#d5dde4" strokeWidth="1.3" />
      <ellipse cx="76" cy="30" rx="4.5" ry="2.2" fill="#eef2f6" />
      <rect x="24" y="74" width="14" height="28" rx="1" fill="#111" stroke="#d5dde4" strokeWidth="0.7" />
      <path d="M27 78 H35 M27 83 H35 M27 88 H35 M27 93 H35" stroke="#d5dde4" strokeWidth="0.65" />
      <rect x="16" y="104" width="22" height="5" rx="1" fill="#d5dde4" />
      <path d="M214 96 H360" stroke="#c5ced6" strokeWidth="1.2" />
      <Well cx={112} cy={124} r={22} />
      <Well cx={324} cy={124} r={22} />
      <Whitewall cx={112} cy={124} r={22} disc />
      <Whitewall cx={324} cy={124} r={22} disc />
    </g>
  );
}

function PleatedDrape({
  x,
  y,
  w,
  h,
  clipId,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  clipId: string;
}) {
  const n = Math.max(6, Math.round(w / 6.2));
  const folds = [];
  for (let i = 0; i < n; i++) {
    const x0 = x + (i * w) / n;
    const x1 = x0 + w / n;
    const mid = (x0 + x1) / 2;
    const face = i % 2 === 0;
    folds.push(
      <path
        key={i}
        d={`M${x0} ${y + 8} Q${mid} ${y + 2} ${x1} ${y + 8} L${x1} ${y + h - 1} L${x0} ${y + h - 1} Z`}
        fill={face ? '#f3f0e6' : '#8d8474'}
      />
    );
    folds.push(
      <path
        key={`e${i}`}
        d={`M${x1 - 0.55} ${y + 9} L${x1 - 0.55} ${y + h - 1.5}`}
        stroke={face ? '#5c564c' : '#f7f4ea'}
        strokeWidth="0.65"
      />
    );
  }
  return (
    <g clipPath={`url(#${clipId})`}>
      <rect x={x - 1} y={y} width={w + 2} height={h} fill="#2a261e" />
      {folds}
      <path
        d={`M${x} ${y + 5} H${x + w}`}
        stroke="#f6f1e4"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

/** Tall removal SUV. Chrome belt, quarter-glass landau bar, curtained rear glass. */
export function SilentArrival({ paint, glass }: Ids) {
  const clipDoor = `${glass}-door`;
  const clipQuarter = `${glass}-quarter`;
  return (
    <g>
      <defs>
        <clipPath id={clipDoor}>
          <path d="M212 28 H284 V90 H212 Z" />
        </clipPath>
        <clipPath id={clipQuarter}>
          <path d="M292 28 H348 V76 H292 Z" />
        </clipPath>
      </defs>
      <path
        d="M4 166 L4 128 L12 112 L16 78 L30 62 L56 54 L104 48 L124 32 L142 22 H346 L368 30 L390 48 L406 78 L412 124 L406 166 Z"
        fill={`url(#${paint})`}
        stroke="rgba(255,255,255,0.42)"
        strokeWidth="0.9"
      />
      <path d="M18 104 H396 L404 166 H8 Z" fill="#1a1f26" />
      <path
        d="M142 20 H356"
        stroke="#eef2f6"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M152 24 H336"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="6" y="78" width="20" height="46" rx="1.2" fill="#12151a" stroke="#e2e8ee" strokeWidth="1.2" />
      <path d="M10 86 H22 M10 94 H22 M10 102 H22 M10 110 H22 M10 118 H22" stroke="#d5dde4" strokeWidth="1.2" />
      <rect x="28" y="68" width="42" height="18" rx="1.8" fill="#f4f1e6" stroke="#e2e8ee" strokeWidth="0.9" />
      <rect x="30" y="70" width="28" height="14" fill="#fff" />
      <rect x="58" y="72" width="10" height="10" fill="#c5d8ee" />
      <path d="M2 122 H42 V166 H0 Z" fill="#222830" stroke="#d5dde4" strokeWidth="1.15" />
      <path d="M4 132 H38" stroke="#f2f5f8" strokeWidth="2.4" />
      <path d="M4 142 H38" stroke="#9aa3ad" strokeWidth="1.4" />
      <Pane d="M132 30 H204 V90 H118 L132 30 Z" glass={glass} />
      <PleatedDrape x={212} y={28} w={72} h={62} clipId={clipDoor} />
      <PleatedDrape x={292} y={28} w={56} h={48} clipId={clipQuarter} />
      <path d="M212 28 H284 V90 H212 Z" fill="rgba(186,206,220,0.22)" stroke="#d7e0e8" strokeWidth="0.9" />
      <path d="M292 28 H348 V76 H292 Z" fill="rgba(186,206,220,0.2)" stroke="#d7e0e8" strokeWidth="0.9" />
      <path
        d="M300 40 Q320 56 344 42"
        fill="none"
        stroke="#f7f8f8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="300" cy="40" r="2.3" fill="#f7f8f8" stroke="#9aa3ad" strokeWidth="0.45" />
      <circle cx="344" cy="42" r="2.3" fill="#f7f8f8" stroke="#9aa3ad" strokeWidth="0.45" />
      <path d="M48 100 H398" stroke="#e8eef3" strokeWidth="1.8" />
      <path d="M22 124 H394" stroke="#c5ced6" strokeWidth="1.5" />
      <path d="M8 164 H48" stroke="#e8eef3" strokeWidth="2.8" />
      <path d="M108 164 H292" stroke="#e8eef3" strokeWidth="2.8" />
      <path d="M352 164 H404" stroke="#e8eef3" strokeWidth="2.8" />
      <path d="M208 46 V110 M288 44 V110" stroke="#121316" strokeWidth="0.8" />
      <rect x="176" y="98" width="14" height="2.2" rx="0.7" fill="#e8eef3" />
      <rect x="250" y="98" width="14" height="2.2" rx="0.7" fill="#e8eef3" />
      <path d="M396 86 H414 V160 H396 Z" fill="#6e1418" />
      <path d="M399 92 H410 V154 H399 Z" fill="#e23b42" />
      <circle cx="370" cy="128" r="3.4" fill="none" stroke="#c5ced6" strokeWidth="1.1" />
      <path d="M48 164 Q78 90 108 164" fill="#101216" />
      <path d="M292 164 Q322 90 352 164" fill="#101216" />
      <AlloyWheel cx={78} cy={158} r={28} spokes={12} lip="#f6f1e4" />
      <AlloyWheel cx={322} cy={158} r={28} spokes={12} lip="#f6f1e4" />
      <path d="M50 162 Q78 96 106 162" fill="none" stroke="#d5dde4" strokeWidth="1.3" />
      <path d="M294 162 Q322 96 350 162" fill="none" stroke="#d5dde4" strokeWidth="1.3" />
    </g>
  );
}

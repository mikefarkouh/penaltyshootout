import { useMemo } from "react";
import { CROWD_SKIN_TONES } from "../data/appearance";
import type { TeamRoster } from "../data/rosters";
import { SCENE, mulberry32 } from "./geometry";

type Props = {
  homeTeam: TeamRoster;
  awayTeam: TeamRoster;
};

/* ------------------------------------------------------------------ *
 * Crowd
 * ------------------------------------------------------------------ */

const HOARDINGS = [
  "LA COPA DE PENALTIES",
  "GRAND FINALE",
  "FAIR PLAY",
  "MATCHDAY",
  "LA COPA DE PENALTIES",
  "GRAND FINALE",
];

/** Longer slogans get tighter type so they stay inside their board. */
function hoardingType(slogan: string) {
  if (slogan.length > 17) return { fontSize: 13, letterSpacing: 0.6 };
  if (slogan.length > 13) return { fontSize: 14, letterSpacing: 1.3 };
  return { fontSize: 16, letterSpacing: 2.5 };
}

/** Builds one SVG path string containing many small filled circles. */
function circlesPath(points: { x: number; y: number; r: number }[]) {
  return points
    .map(
      ({ x, y, r }) =>
        `M${x.toFixed(1)} ${(y - r).toFixed(1)}a${r} ${r} 0 1 0 0 ${(r * 2).toFixed(1)}a${r} ${r} 0 1 0 0 ${(-r * 2).toFixed(1)}z`,
    )
    .join("");
}

type Dot = { x: number; y: number; r: number };

function useCrowd(homeTeam: TeamRoster, awayTeam: TeamRoster) {
  return useMemo(() => {
    const rnd = mulberry32(20260730);
    const shirtBuckets = new Map<string, Dot[]>();
    const headBuckets = new Map<string, Dot[]>();

    const homePalette = [
      homeTeam.colors.primary,
      homeTeam.colors.secondary,
      homeTeam.colors.accent,
      homeTeam.colors.primary,
    ];
    const awayPalette = [
      awayTeam.colors.primary,
      awayTeam.colors.secondary,
      awayTeam.colors.accent,
      awayTeam.colors.primary,
    ];
    const neutrals = ["#334155", "#1e293b", "#475569", "#0f172a"];

    const push = (map: Map<string, Dot[]>, key: string, dot: Dot) => {
      const list = map.get(key);
      if (list) list.push(dot);
      else map.set(key, [dot]);
    };

    // Three tiers separated by walkways, curving up towards the edges.
    const tiers = [
      { top: 122, bottom: 172, step: 12, rowGap: 12 },
      { top: 190, bottom: 280, step: 12.5, rowGap: 12.5 },
      { top: 300, bottom: 388, step: 13, rowGap: 13 },
    ];

    for (const tier of tiers) {
      for (let y = tier.top; y <= tier.bottom; y += tier.rowGap) {
        for (let x = -10; x <= SCENE.width + 10; x += tier.step) {
          if (rnd() < 0.07) continue; // empty seats

          const bow = -24 * Math.pow((x - SCENE.width / 2) / (SCENE.width / 2), 2);
          const px = x + (rnd() - 0.5) * 5;
          const py = y + bow + (rnd() - 0.5) * 3;

          const homeSide = px < SCENE.width / 2;
          const palette = homeSide ? homePalette : awayPalette;
          // Roughly half the bowl wears colours, the rest reads as dark filler
          // so the crowd never competes with the action on the pitch.
          const shirt =
            rnd() < 0.46
              ? palette[Math.floor(rnd() * palette.length)]
              : neutrals[Math.floor(rnd() * neutrals.length)];

          const r = 3 + rnd() * 0.8;
          push(shirtBuckets, shirt, { x: px, y: py + r * 0.95, r: r * 1.05 });
          push(headBuckets, CROWD_SKIN_TONES[Math.floor(rnd() * CROWD_SKIN_TONES.length)], {
            x: px,
            y: py - r * 0.85,
            r: r * 0.58,
          });
        }
      }
    }

    // A handful of camera flashes scattered through the stands.
    const flashes = Array.from({ length: 22 }, () => ({
      x: rnd() * SCENE.width,
      y: 126 + rnd() * 250,
      delay: rnd() * 6,
    }));

    // Waving flags draped over the tier fronts.
    const flags = Array.from({ length: 10 }, (_, i) => {
      const homeSide = i % 2 === 0;
      const team = homeSide ? homeTeam : awayTeam;
      return {
        x: homeSide ? 30 + rnd() * 470 : 690 + rnd() * 470,
        y: [176, 288][Math.floor(rnd() * 2)],
        w: 40 + rnd() * 28,
        primary: team.colors.primary,
        secondary: team.colors.secondary,
        delay: rnd() * 3,
      };
    });

    return {
      shirts: [...shirtBuckets].map(([color, dots]) => ({ color, d: circlesPath(dots) })),
      heads: [...headBuckets].map(([color, dots]) => ({ color, d: circlesPath(dots) })),
      flashes,
      flags,
    };
  }, [homeTeam, awayTeam]);
}

/* ------------------------------------------------------------------ *
 * Pitch stripes
 * ------------------------------------------------------------------ */

function pitchStripes() {
  const bands: { y: number; height: number; dark: boolean }[] = [];
  const count = 9;
  const start = SCENE.horizon;
  const depth = SCENE.height - SCENE.horizon;
  for (let i = 0; i < count; i++) {
    const y0 = start + depth * Math.pow(i / count, 1.75);
    const y1 = start + depth * Math.pow((i + 1) / count, 1.75);
    bands.push({ y: y0, height: y1 - y0 + 0.6, dark: i % 2 === 0 });
  }
  return bands;
}

/* ------------------------------------------------------------------ *
 * Stadium
 * ------------------------------------------------------------------ */

export function Stadium({ homeTeam, awayTeam }: Props) {
  const crowd = useCrowd(homeTeam, awayTeam);
  const stripes = useMemo(pitchStripes, []);

  const towers = [110, 400, 800, 1090];

  return (
    <g className="stadium">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050b1f" />
          <stop offset="55%" stopColor="#0f1f45" />
          <stop offset="100%" stopColor="#1b3566" />
        </linearGradient>

        <linearGradient id="standFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111c33" />
          <stop offset="100%" stopColor="#1d2c4a" />
        </linearGradient>

        <linearGradient id="pitchLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f7a3f" />
          <stop offset="45%" stopColor="#2a9a4e" />
          <stop offset="100%" stopColor="#35b45c" />
        </linearGradient>

        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#dbeafe" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
        </linearGradient>

        <radialGradient id="lampGlow">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#fef9c3" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="grassPool">
          <stop offset="0%" stopColor="#eafff1" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#eafff1" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="vignette" cx="0.5" cy="0.55" r="0.75">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000814" stopOpacity="0.6" />
        </radialGradient>

        <filter id="softBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* Night sky */}
      <rect x="0" y="0" width={SCENE.width} height={SCENE.horizon + 20} fill="url(#sky)" />
      <g fill="#e2e8f0" opacity="0.5">
        {Array.from({ length: 40 }, (_, i) => {
          const rnd = mulberry32(i * 977 + 3);
          return (
            <circle
              key={i}
              cx={rnd() * SCENE.width}
              cy={rnd() * 90}
              r={rnd() * 1.2 + 0.4}
              opacity={rnd() * 0.7 + 0.3}
            />
          );
        })}
      </g>

      {/* Floodlight beams wash across the bowl */}
      <g style={{ mixBlendMode: "screen" }}>
        {towers.map((x, i) => (
          <polygon
            key={i}
            points={`${x - 26},64 ${x + 26},64 ${x + 340},${SCENE.height} ${x - 340},${SCENE.height}`}
            fill="url(#beam)"
            opacity="0.5"
            filter="url(#softBlur)"
          />
        ))}
      </g>

      {/* Roof structure */}
      <path
        d={`M-20,${-10} H${SCENE.width + 20} V70 Q${SCENE.width / 2},128 -20,70 Z`}
        fill="#0a1428"
      />
      <path
        d={`M-20,62 Q${SCENE.width / 2},120 ${SCENE.width + 20},62 L${SCENE.width + 20},76 Q${SCENE.width / 2},134 -20,76 Z`}
        fill="#1e293b"
      />

      {/* Floodlight towers */}
      {towers.map((x, i) => (
        <g key={i}>
          <rect x={x - 34} y={22} width={68} height={30} rx="6" fill="#243352" />
          <rect x={x - 4} y={50} width={8} height={26} fill="#1b2740" />
          {[0, 1, 2].map((c) =>
            [0, 1].map((r) => (
              <rect
                key={`${c}-${r}`}
                x={x - 28 + c * 19}
                y={27 + r * 12}
                width={15}
                height={9}
                rx="2"
                fill="#fef3c7"
              />
            )),
          )}
          <ellipse cx={x} cy={40} rx="88" ry="52" fill="url(#lampGlow)" className="lamp-glow" />
        </g>
      ))}

      {/* Stand structure behind the crowd */}
      <path
        d={`M-20,${110} Q${SCENE.width / 2},${166} ${SCENE.width + 20},${110} V${SCENE.adBoardTop + 6} H-20 Z`}
        fill="url(#standFace)"
      />

      {/* Crowd, batched by colour into a handful of paths */}
      <g className="crowd">
        {crowd.shirts.map(({ color, d }) => (
          <path key={`s-${color}`} d={d} fill={color} opacity="0.82" />
        ))}
        {crowd.heads.map(({ color, d }) => (
          <path key={`h-${color}`} d={d} fill={color} opacity="0.7" />
        ))}
      </g>

      {/* Tier walkways */}
      {[182, 292].map((y) => (
        <path
          key={y}
          d={`M-20,${y} Q${SCENE.width / 2},${y + 26} ${SCENE.width + 20},${y}`}
          stroke="#0b1526"
          strokeWidth="11"
          fill="none"
          opacity="0.85"
        />
      ))}

      {/* Supporter flags */}
      {crowd.flags.map((flag, i) => (
        <g key={i} className="crowd-flag" style={{ animationDelay: `${flag.delay}s` }}>
          <rect x={flag.x} y={flag.y} width={flag.w} height={flag.w * 0.42} rx="2" fill={flag.primary} />
          <rect
            x={flag.x}
            y={flag.y + flag.w * 0.42 * 0.62}
            width={flag.w}
            height={flag.w * 0.42 * 0.38}
            fill={flag.secondary}
            opacity="0.9"
          />
        </g>
      ))}

      {/* Camera flashes */}
      {crowd.flashes.map((f, i) => (
        <circle
          key={i}
          cx={f.x}
          cy={f.y}
          r="3.2"
          fill="#ffffff"
          className="camera-flash"
          style={{ animationDelay: `${f.delay}s` }}
        />
      ))}

      {/* Night wash over the bowl, so the crowd never outshouts the pitch */}
      <rect x="-20" y="100" width={SCENE.width + 40} height={SCENE.adBoardTop - 96} fill="#050c1c" opacity="0.34" />

      {/* Advertising hoardings */}
      <rect x="-20" y={SCENE.adBoardTop} width={SCENE.width + 40} height="47" fill="#0b1120" />
      <g>
        {HOARDINGS.map((slogan, i) => {
          const w = (SCENE.width + 40) / 6;
          const x = -20 + i * w;
          const team = i % 2 === 0 ? homeTeam : awayTeam;
          const type = hoardingType(slogan);
          return (
            <g key={i}>
              <rect x={x + 3} y={SCENE.adBoardTop + 4} width={w - 6} height={36} rx="4" fill={team.colors.primary} opacity="0.9" />
              <text
                x={x + w / 2}
                y={SCENE.adBoardTop + 28}
                textAnchor="middle"
                fontSize={type.fontSize}
                fontWeight="800"
                letterSpacing={type.letterSpacing}
                fill={team.colors.secondary}
                opacity="0.95"
              >
                {slogan}
              </text>
            </g>
          );
        })}
      </g>
      <rect x="-20" y={SCENE.adBoardTop + 41} width={SCENE.width + 40} height="7" fill="#020617" opacity="0.75" />

      {/* Pitch */}
      <rect x="0" y={SCENE.horizon - 5} width={SCENE.width} height={SCENE.height - SCENE.horizon + 5} fill="url(#pitchLight)" />
      {stripes.map((band, i) => (
        <rect
          key={i}
          x="0"
          y={band.y}
          width={SCENE.width}
          height={band.height}
          fill="#000000"
          opacity={band.dark ? 0.07 : 0}
        />
      ))}

      {/* Light pools on the grass */}
      {towers.map((x, i) => (
        <ellipse key={i} cx={x} cy={SCENE.height - 90} rx="330" ry="170" fill="url(#grassPool)" />
      ))}

      <PitchMarkings />

      <rect x="0" y="0" width={SCENE.width} height={SCENE.height} fill="url(#vignette)" pointerEvents="none" />
    </g>
  );
}

/** Six-yard box, penalty area, spot and arc, drawn in a simple perspective. */
function PitchMarkings() {
  const line = SCENE.goal.line;
  const stroke = "#f8fafc";
  const common = { fill: "none", stroke, strokeWidth: 3.5, opacity: 0.85 };

  return (
    <g>
      {/* Goal line */}
      <line x1="0" y1={line} x2={SCENE.width} y2={line} stroke={stroke} strokeWidth="4" opacity="0.8" />

      {/* Six-yard box */}
      <path d={`M264,${line} L246,${line + 48} L954,${line + 48} L936,${line}`} {...common} />

      {/* Penalty area */}
      <path d={`M192,${line} L96,${line + 196} L1104,${line + 196} L1008,${line}`} {...common} />

      {/* Penalty arc, the part that pokes out of the box */}
      <path d={`M424,${line + 196} Q${SCENE.penaltySpot.x},${line + 268} 776,${line + 196}`} {...common} />

      {/* Penalty spot */}
      <ellipse cx={SCENE.penaltySpot.x} cy={SCENE.penaltySpot.y} rx="9" ry="4" fill={stroke} opacity="0.9" />
    </g>
  );
}

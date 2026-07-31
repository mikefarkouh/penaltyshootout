import { motion } from "framer-motion";
import { complexionFor } from "../data/appearance";
import type { TeamRoster } from "../data/rosters";
import type { ZoneId } from "../game/types";
import { SCENE, divePose, type KeeperReach } from "./geometry";

/* The rig is drawn with the feet at the origin and the body running up in -y. */

const OUTLINE = "#0b1220";

type Point = [number, number];

type Limbs = {
  handL: Point;
  handR: Point;
  elbowL: Point;
  elbowR: Point;
  kneeL: Point;
  kneeR: Point;
  footL: Point;
  footR: Point;
  lean: number;
};

const LIMBS: Record<KeeperReach | "beaten" | "celebrate", Limbs> = {
  ready: {
    handL: [-50, -94], handR: [50, -94],
    elbowL: [-36, -120], elbowR: [36, -120],
    kneeL: [-19, -44], kneeR: [19, -44],
    footL: [-26, 0], footR: [26, 0],
    lean: 0,
  },
  dive: {
    handL: [-14, -198], handR: [16, -190],
    elbowL: [-21, -156], elbowR: [23, -152],
    kneeL: [-13, -46], kneeR: [11, -40],
    footL: [-22, -6], footR: [5, 5],
    lean: 0,
  },
  /** Full stretch along the grass: the trailing leg stays down and the top
   * hand comes in, so the rig never reads as a leap when it lands flat. */
  diveLow: {
    handL: [-16, -186], handR: [10, -170],
    elbowL: [-22, -146], elbowR: [20, -136],
    kneeL: [-15, -40], kneeR: [12, -26],
    footL: [-21, -2], footR: [10, 10],
    lean: 0,
  },
  up: {
    handL: [-28, -204], handR: [28, -204],
    elbowL: [-30, -158], elbowR: [30, -158],
    kneeL: [-16, -48], kneeR: [16, -48],
    footL: [-18, -16], footR: [18, -16],
    lean: 0,
  },
  spread: {
    handL: [-86, -60], handR: [86, -60],
    elbowL: [-54, -104], elbowR: [54, -104],
    kneeL: [-50, -32], kneeR: [50, -32],
    footL: [-78, 4], footR: [78, 4],
    lean: 0,
  },
  beaten: {
    handL: [-42, -60], handR: [42, -64],
    elbowL: [-35, -104], elbowR: [35, -104],
    kneeL: [-22, -40], kneeR: [18, -42],
    footL: [-28, 0], footR: [24, 0],
    lean: -7,
  },
  celebrate: {
    handL: [-46, -202], handR: [46, -202],
    elbowL: [-44, -152], elbowR: [44, -152],
    kneeL: [-20, -46], kneeR: [20, -46],
    footL: [-24, -12], footR: [24, -12],
    lean: 0,
  },
};

type Props = {
  team: TeamRoster;
  /** Zone the keeper commits to, or null to hold the ready stance. */
  diveZone: ZoneId | null;
  mood: "ready" | "save" | "beaten";
};

export function Keeper({ team, diveZone, mood }: Props) {
  const pose = diveZone ? divePose(diveZone) : null;
  const reach: keyof typeof LIMBS = pose
    ? pose.reach
    : mood === "beaten"
      ? "beaten"
      : mood === "save"
        ? "celebrate"
        : "ready";

  const limbs = LIMBS[reach];
  const dx = pose?.dx ?? 0;
  const dy = pose?.dy ?? 0;
  const rotate = pose?.rotate ?? 0;
  const stretched = pose != null && pose.lateral !== 0;
  const low = pose != null && pose.row === 1;

  return (
    <g transform={`translate(${SCENE.penaltySpot.x}, ${SCENE.goal.line})`}>
      {/* Shadow stays on the ground and stretches with the dive */}
      <motion.ellipse
        cy={4}
        fill="#04240f"
        initial={{ cx: 0, rx: 34, ry: 7, opacity: 0.5 }}
        animate={{
          cx: dx * 0.8,
          rx: stretched ? (low ? 92 : 60) : low ? 46 : 34,
          ry: low ? 9 : 7,
          opacity: low ? 0.6 : 0.44,
        }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      />

      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
        initial={false}
        animate={{ x: dx, y: dy, rotate }}
        // Low dives are damped harder so the body settles onto the grass
        // instead of springing back up like a jump.
        transition={{
          type: "spring",
          stiffness: low ? 210 : 190,
          damping: low ? 22 : 15,
          mass: 0.7,
        }}
      >
        <KeeperBody limbs={limbs} team={team} />
      </motion.g>
    </g>
  );
}

const curve = (from: Point, mid: Point, to: Point) =>
  `M${from[0]} ${from[1]} Q${mid[0]} ${mid[1]} ${to[0]} ${to[1]}`;

/** A limb drawn as a coloured stroke over a darker one, for a clean outline. */
function Limb({
  d,
  color,
  width,
}: {
  d: string;
  color: string;
  width: number;
}) {
  return (
    <>
      <path d={d} stroke={OUTLINE} strokeWidth={width + 5} strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" />
    </>
  );
}

function KeeperBody({ limbs, team }: { limbs: Limbs; team: TeamRoster }) {
  const shirt = team.kit.keeper;
  const shorts = team.kit.keeperShorts;
  const socks = team.kit.socks;
  const { skin, hair } = complexionFor(team.goalkeepers[0]);

  return (
    <g>
      {/* Legs */}
      <Limb d={curve([-13, -78], limbs.kneeL, limbs.footL)} color={shorts} width={21} />
      <Limb d={curve([13, -78], limbs.kneeR, limbs.footR)} color={shorts} width={21} />
      <Limb d={curve(limbs.kneeL, limbs.kneeL, limbs.footL)} color={socks} width={15} />
      <Limb d={curve(limbs.kneeR, limbs.kneeR, limbs.footR)} color={socks} width={15} />
      <ellipse cx={limbs.footL[0]} cy={limbs.footL[1] + 2} rx="12" ry="6.5" fill="#111827" stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx={limbs.footR[0]} cy={limbs.footR[1] + 2} rx="12" ry="6.5" fill="#111827" stroke={OUTLINE} strokeWidth="2" />

      {/* Torso */}
      <path
        d="M-25 -142 Q0 -149 25 -142 L21 -76 Q0 -70 -21 -76 Z"
        fill={shirt}
        stroke={OUTLINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M-25 -142 Q0 -149 25 -142 L23 -124 Q0 -131 -23 -124 Z" fill="#ffffff" opacity="0.2" />

      {/* Arms */}
      <Limb d={curve([-22, -137], limbs.elbowL, limbs.handL)} color={shirt} width={17} />
      <Limb d={curve([22, -137], limbs.elbowR, limbs.handR)} color={shirt} width={17} />

      {/* Gloves */}
      <Glove x={limbs.handL[0]} y={limbs.handL[1]} />
      <Glove x={limbs.handR[0]} y={limbs.handR[1]} />

      {/* Head */}
      <g transform={`rotate(${limbs.lean})`}>
        <circle cx="0" cy="-161" r="19" fill={skin} stroke={OUTLINE} strokeWidth="3" />
        <path d="M-19 -166 Q0 -188 19 -166 Q0 -175 -19 -166 Z" fill={hair} />
        <circle cx="-7" cy="-160" r="2.6" fill="#1f2937" />
        <circle cx="7" cy="-160" r="2.6" fill="#1f2937" />
      </g>
    </g>
  );
}

function Glove({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r="14" fill="#f8fafc" stroke={OUTLINE} strokeWidth="3" />
      <path d="M-6 3 h12" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

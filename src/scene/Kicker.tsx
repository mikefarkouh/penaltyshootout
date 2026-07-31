import { motion } from "framer-motion";
import { complexionFor } from "../data/appearance";
import type { Player, TeamRoster } from "../data/rosters";
import { depthScale } from "./geometry";

export type KickerPose =
  | "idle"
  | "runup"
  | "plant"
  | "strike"
  | "follow"
  | "celebrate"
  | "dejected";

type Point = [number, number];

type Pose = {
  /** Feet position in scene coordinates. */
  at: Point;
  lean: number;
  kneeL: Point;
  footL: Point;
  kneeR: Point;
  footR: Point;
  elbowL: Point;
  handL: Point;
  elbowR: Point;
  handR: Point;
  headY: number;
};

const START: Point = [470, 620];
const PLANT: Point = [552, 588];

const POSES: Record<KickerPose, Pose> = {
  idle: {
    at: START, lean: 0,
    kneeL: [-17, -46], footL: [-22, 0], kneeR: [17, -46], footR: [22, 0],
    elbowL: [-34, -112], handL: [-40, -84], elbowR: [34, -112], handR: [40, -84],
    headY: -161,
  },
  runup: {
    at: [516, 602], lean: -5,
    kneeL: [-26, -54], footL: [-38, -18], kneeR: [20, -38], footR: [30, -2],
    elbowL: [-40, -116], handL: [-48, -98], elbowR: [36, -108], handR: [42, -74],
    headY: -161,
  },
  plant: {
    at: PLANT, lean: -8,
    kneeL: [-14, -48], footL: [-18, 0], kneeR: [30, -36], footR: [50, 8],
    elbowL: [-52, -112], handL: [-66, -96], elbowR: [30, -122], handR: [34, -142],
    headY: -159,
  },
  strike: {
    at: PLANT, lean: 4,
    kneeL: [-14, -50], footL: [-18, 0], kneeR: [14, -68], footR: [4, -110],
    elbowL: [-54, -120], handL: [-72, -134], elbowR: [42, -108], handR: [56, -88],
    headY: -162,
  },
  follow: {
    at: [558, 585], lean: 6,
    kneeL: [-12, -52], footL: [-16, -4], kneeR: [8, -78], footR: [-4, -128],
    elbowL: [-56, -124], handL: [-76, -142], elbowR: [46, -114], handR: [64, -100],
    headY: -164,
  },
  celebrate: {
    at: [558, 592], lean: 0,
    kneeL: [-20, -52], footL: [-26, -14], kneeR: [20, -52], footR: [26, -14],
    elbowL: [-44, -156], handL: [-50, -200], elbowR: [44, -156], handR: [50, -200],
    headY: -164,
  },
  dejected: {
    at: [558, 592], lean: -3,
    kneeL: [-18, -44], footL: [-24, 0], kneeR: [18, -44], footR: [24, 0],
    elbowL: [-48, -138], handL: [-23, -178], elbowR: [48, -138], handR: [23, -178],
    headY: -152,
  },
};

const IDLE = POSES.idle;
const OUTLINE = "#0b1220";

const SPRING = { type: "spring", stiffness: 260, damping: 22, mass: 0.8 } as const;
const FAST = { type: "spring", stiffness: 620, damping: 26, mass: 0.55 } as const;

type Props = {
  team: TeamRoster;
  player: Player;
  pose: KickerPose;
};

const curve = (from: Point, mid: Point, to: Point) =>
  `M${from[0]} ${from[1]} Q${mid[0]} ${mid[1]} ${to[0]} ${to[1]}`;

type Transition = typeof SPRING | typeof FAST;

/** A limb drawn as a coloured stroke over a darker one, for a clean outline. */
function AnimatedLimb({
  d,
  initialD,
  color,
  width,
  transition,
}: {
  d: string;
  initialD: string;
  color: string;
  width: number;
  transition: Transition;
}) {
  return (
    <>
      <motion.path
        initial={{ d: initialD }}
        animate={{ d }}
        transition={transition}
        stroke={OUTLINE}
        strokeWidth={width + 5}
        strokeLinecap="round"
        fill="none"
      />
      <motion.path
        initial={{ d: initialD }}
        animate={{ d }}
        transition={transition}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

export function Kicker({ team, player, pose }: Props) {
  const p = POSES[pose];
  const [x, y] = p.at;
  const scale = depthScale(y);
  const transition: Transition = pose === "strike" || pose === "follow" ? FAST : SPRING;
  const { shirt, shorts, socks } = team.kit;
  const numberColor = shorts.toLowerCase() === shirt.toLowerCase() ? "#ffffff" : shorts;
  const { skin, hair } = complexionFor(player);

  return (
    <motion.g
      initial={{ x: START[0], y: START[1], scale: depthScale(START[1]) }}
      animate={{ x, y, scale }}
      transition={transition}
      style={{ originX: 0, originY: 0 }}
    >
      <ellipse cx="0" cy="4" rx="30" ry="8" fill="#04240f" opacity="0.45" />

      <motion.g
        initial={false}
        animate={{ rotate: p.lean }}
        transition={transition}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        {/* Legs */}
        <AnimatedLimb
          d={curve([-12, -80], p.kneeL, p.footL)}
          initialD={curve([-12, -80], IDLE.kneeL, IDLE.footL)}
          color={shorts}
          width={22}
          transition={transition}
        />
        <AnimatedLimb
          d={curve([12, -80], p.kneeR, p.footR)}
          initialD={curve([12, -80], IDLE.kneeR, IDLE.footR)}
          color={shorts}
          width={22}
          transition={transition}
        />
        <AnimatedLimb
          d={curve(p.kneeL, p.kneeL, p.footL)}
          initialD={curve(IDLE.kneeL, IDLE.kneeL, IDLE.footL)}
          color={socks}
          width={15}
          transition={transition}
        />
        <AnimatedLimb
          d={curve(p.kneeR, p.kneeR, p.footR)}
          initialD={curve(IDLE.kneeR, IDLE.kneeR, IDLE.footR)}
          color={socks}
          width={15}
          transition={transition}
        />
        <Boot point={p.footL} initialPoint={IDLE.footL} transition={transition} />
        <Boot point={p.footR} initialPoint={IDLE.footR} transition={transition} />

        {/* Shirt, seen from behind */}
        <path
          d="M-26 -146 Q0 -153 26 -146 L22 -78 Q0 -72 -22 -78 Z"
          fill={shirt}
          stroke={OUTLINE}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path d="M-26 -146 Q0 -153 26 -146 L24 -132 Q0 -139 -24 -132 Z" fill="#000" opacity="0.14" />
        {player.number != null && (
          <text
            x="0"
            y="-102"
            textAnchor="middle"
            fontSize="31"
            fontWeight="800"
            fill={numberColor}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.9"
            fontFamily="inherit"
          >
            {player.number}
          </text>
        )}

        {/* Arms */}
        <AnimatedLimb
          d={curve([-24, -141], p.elbowL, p.handL)}
          initialD={curve([-24, -141], IDLE.elbowL, IDLE.handL)}
          color={shirt}
          width={16}
          transition={transition}
        />
        <AnimatedLimb
          d={curve([24, -141], p.elbowR, p.handR)}
          initialD={curve([24, -141], IDLE.elbowR, IDLE.handR)}
          color={shirt}
          width={16}
          transition={transition}
        />
        <motion.circle
          initial={{ cx: IDLE.handL[0], cy: IDLE.handL[1] }}
          animate={{ cx: p.handL[0], cy: p.handL[1] }}
          transition={transition}
          r="9"
          fill={skin}
          stroke={OUTLINE}
          strokeWidth="2.5"
        />
        <motion.circle
          initial={{ cx: IDLE.handR[0], cy: IDLE.handR[1] }}
          animate={{ cx: p.handR[0], cy: p.handR[1] }}
          transition={transition}
          r="9"
          fill={skin}
          stroke={OUTLINE}
          strokeWidth="2.5"
        />

        {/* Head from behind */}
        <motion.g initial={false} animate={{ y: p.headY - IDLE.headY }} transition={transition}>
          <circle cx="0" cy="-161" r="20" fill={skin} stroke={OUTLINE} strokeWidth="3" />
          <path d="M-20 -161 A20 20 0 0 1 20 -161 Q0 -156 -20 -161 Z" fill={hair} />
          <path d="M-20 -162 Q0 -147 20 -162 L20 -156 Q0 -141 -20 -156 Z" fill={hair} opacity="0.9" />
        </motion.g>
      </motion.g>
    </motion.g>
  );
}

function Boot({
  point,
  initialPoint,
  transition,
}: {
  point: Point;
  initialPoint: Point;
  transition: Transition;
}) {
  return (
    <motion.ellipse
      initial={{ cx: initialPoint[0], cy: initialPoint[1] + 2 }}
      animate={{ cx: point[0], cy: point[1] + 2 }}
      transition={transition}
      rx="12"
      ry="6.5"
      fill="#111827"
      stroke={OUTLINE}
      strokeWidth="2"
    />
  );
}

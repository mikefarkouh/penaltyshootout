import { ZONE_COLS, ZONE_ROWS, ZONES } from "../game/engine";
import type { Impact, ZoneId } from "../game/types";

/**
 * Everything in the pitch view is laid out in this fixed coordinate space and
 * scaled by the SVG viewBox, so all components can share exact positions.
 */
export const SCENE = {
  width: 1200,
  height: 720,
  /** Back edge of the grass, where the advertising hoardings stand. */
  horizon: 442,
  adBoardTop: 395,
  goal: {
    left: 336,
    right: 864,
    top: 258,
    line: 468, // where the goal meets the grass
    postWidth: 11,
  },
  /** Kept high enough in the frame that the bottom HUD never covers the action. */
  penaltySpot: { x: 600, y: 578 },
  ballRadius: 18,
  /** How much the ball shrinks by the time it reaches the goal line. */
  goalPlaneScale: 0.78,
} as const;

/** Figures further up the pitch are further away, so they are drawn smaller. */
export function depthScale(y: number) {
  return 0.62 + ((y - SCENE.goal.top) / (SCENE.height - SCENE.goal.top)) * 0.72;
}

export const GOAL_WIDTH = SCENE.goal.right - SCENE.goal.left;
export const GOAL_HEIGHT = SCENE.goal.line - SCENE.goal.top;

/** Converts goal-mouth space (u, v) into scene pixels. */
export function impactToScene({ u, v }: Impact) {
  return {
    x: SCENE.goal.left + u * GOAL_WIDTH,
    y: SCENE.goal.top + v * GOAL_HEIGHT,
  };
}

/** Pixel rectangle covering one of the six aiming zones. */
export function zoneRect(zone: ZoneId) {
  const { row, col } = ZONES[zone];
  const w = GOAL_WIDTH / ZONE_COLS;
  const h = GOAL_HEIGHT / ZONE_ROWS;
  return {
    x: SCENE.goal.left + col * w,
    y: SCENE.goal.top + row * h,
    width: w,
    height: h,
    cx: SCENE.goal.left + (col + 0.5) * w,
    cy: SCENE.goal.top + (row + 0.5) * h,
  };
}

/**
 * Which limb layout the keeper uses. `dive` springs up towards a top corner,
 * `diveLow` goes full length along the grass, and the central saves are a
 * jump or a legs-wide block.
 */
export type KeeperReach = "dive" | "diveLow" | "up" | "spread" | "ready";

/**
 * Where the keeper's body ends up for a dive at a given zone. The body pivots
 * about the feet, so most of the reach comes from the rotation rather than the
 * sideways shift.
 *
 * Top zones lift the whole rig off the ground and stay closer to upright. The
 * bottom zones do the opposite: rotation goes almost flat and the body sinks
 * slightly, so a low dive stays down on the grass rather than reading as a
 * leap at ball height.
 */
export function divePose(zone: ZoneId): {
  dx: number;
  dy: number;
  rotate: number;
  reach: KeeperReach;
  row: number;
  lateral: number;
} {
  const { row, col } = ZONES[zone];
  const lateral = col - 1; // -1 left, 0 centre, 1 right
  const high = row === 0;

  if (lateral === 0) {
    return high
      ? { dx: 0, dy: -34, rotate: 0, reach: "up", row, lateral }
      : { dx: 0, dy: 22, rotate: 0, reach: "spread", row, lateral };
  }

  return high
    ? { dx: lateral * 48, dy: -40, rotate: lateral * 38, reach: "dive", row, lateral }
    : { dx: lateral * 54, dy: 38, rotate: lateral * 81, reach: "diveLow", row, lateral };
}

/** Deterministic pseudo-random generator so the crowd never reshuffles. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

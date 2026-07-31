import type { Player, Position } from "../data/rosters";
import {
  ZONE_IDS,
  type Attempt,
  type Impact,
  type ShotOutcome,
  type Side,
  type ZoneId,
} from "./types";

/* ------------------------------------------------------------------ *
 * Zone geometry
 * ------------------------------------------------------------------ */

export const ZONE_ROWS = 2;
export const ZONE_COLS = 3;

type ZoneMeta = {
  row: 0 | 1;
  col: 0 | 1 | 2;
  label: string;
  /** Chance the shot sprays off target before the keeper is even a factor. */
  missBase: number;
  /** Chance the keeper saves it when they guess this zone correctly. */
  saveBase: number;
  /** How often the CPU aims here, and how often a keeper guesses here. */
  aimWeight: number;
  diveWeight: number;
};

export const ZONES: Record<ZoneId, ZoneMeta> = {
  TL: { row: 0, col: 0, label: "Top left", missBase: 0.115, saveBase: 0.3, aimWeight: 1.5, diveWeight: 0.95 },
  TC: { row: 0, col: 1, label: "Over the keeper", missBase: 0.135, saveBase: 0.44, aimWeight: 0.5, diveWeight: 0.5 },
  TR: { row: 0, col: 2, label: "Top right", missBase: 0.115, saveBase: 0.3, aimWeight: 1.5, diveWeight: 0.95 },
  BL: { row: 1, col: 0, label: "Bottom left", missBase: 0.028, saveBase: 0.58, aimWeight: 1.45, diveWeight: 1.5 },
  BC: { row: 1, col: 1, label: "Low and central", missBase: 0.022, saveBase: 0.82, aimWeight: 0.4, diveWeight: 0.8 },
  BR: { row: 1, col: 2, label: "Bottom right", missBase: 0.028, saveBase: 0.58, aimWeight: 1.45, diveWeight: 1.5 },
};

/** Centre of a zone in goal-mouth space. */
export function zoneCenter(zone: ZoneId): Impact {
  const { row, col } = ZONES[zone];
  return { u: (col * 2 + 1) / (ZONE_COLS * 2), v: (row * 2 + 1) / (ZONE_ROWS * 2) };
}

/**
 * How much of the shot's zone a keeper who committed to `keeperZone` actually
 * covers, as a fraction of that zone's save chance. Reading the height wrong
 * costs less than reading the side wrong: a full-length dive still covers much
 * of its own side from the grass to the bar, but nothing across the goal.
 */
export function keeperCoverage(shotZone: ZoneId, keeperZone: ZoneId): number {
  const shot = ZONES[shotZone];
  const guess = ZONES[keeperZone];
  const sideways = Math.abs(shot.col - guess.col);
  if (sideways >= 2) return 0.03;
  if (sideways === 1) return shot.row === guess.row ? 0.24 : 0.11;
  return shot.row === guess.row ? 1 : 0.46;
}

function zoneAt(row: number, col: number): ZoneId | null {
  if (row < 0 || row >= ZONE_ROWS || col < 0 || col >= ZONE_COLS) return null;
  return ZONE_IDS[row * ZONE_COLS + col];
}

/* ------------------------------------------------------------------ *
 * Random helpers
 * ------------------------------------------------------------------ */

const rand = () => Math.random();
const range = (min: number, max: number) => min + rand() * (max - min);

function weightedPick<T extends string>(weights: Record<T, number>): T {
  const keys = Object.keys(weights) as T[];
  const total = keys.reduce((sum, k) => sum + weights[k], 0);
  let roll = rand() * total;
  for (const key of keys) {
    roll -= weights[key];
    if (roll <= 0) return key;
  }
  return keys[keys.length - 1];
}

/* ------------------------------------------------------------------ *
 * Player quality
 * ------------------------------------------------------------------ */

const POSITION_RATING: Record<Position, number> = {
  F: 0.92,
  M: 0.84,
  D: 0.74,
  G: 0.6,
};

export const ratingOf = (player: Player) => POSITION_RATING[player.position];

/* ------------------------------------------------------------------ *
 * Shot resolution
 * ------------------------------------------------------------------ */

export type ShotInput = {
  aimZone: ZoneId;
  keeperZone: ZoneId;
  /** 0..1, where roughly 0.7 is the sweet spot between placement and pace. */
  power: number;
  shooter: Player;
  /** True when a miss loses the shootout outright — nerves cost accuracy. */
  pressure: boolean;
};

export type ShotResolution = {
  outcome: ShotOutcome;
  actualZone: ZoneId;
  impact: Impact;
};

export function resolveShot({
  aimZone,
  keeperZone,
  power,
  shooter,
  pressure,
}: ShotInput): ShotResolution {
  const rating = ratingOf(shooter);
  const composure = 1.55 - rating; // 0.63 for a striker, 0.81 for a defender

  // A shot hit at maximum power can drift into a neighbouring zone.
  let actualZone = aimZone;
  const driftChance = Math.max(0, power - 0.82) * 0.85 * composure;
  if (rand() < driftChance) {
    const { row, col } = ZONES[aimZone];
    const shifted =
      rand() < 0.5
        ? zoneAt(row, col + (rand() < 0.5 ? -1 : 1))
        : zoneAt(row + (rand() < 0.5 ? -1 : 1), col);
    if (shifted) actualZone = shifted;
  }

  const meta = ZONES[actualZone];

  // 1. Does it even hit the target?
  let missChance = meta.missBase * composure * 1.35;
  missChance += Math.max(0, power - 0.78) * 0.55;
  if (power < 0.28) missChance += 0.04; // scuffed contact
  if (pressure) missChance += 0.06;

  if (rand() < missChance) {
    const hitsFrame = rand() < 0.34;
    return {
      outcome: hitsFrame ? "post" : "miss",
      actualZone,
      impact: offTargetImpact(actualZone, hitsFrame),
    };
  }

  // 2. Can the keeper get there?
  let saveChance = meta.saveBase * keeperCoverage(actualZone, keeperZone);

  saveChance *= 1.24 - power * 0.48; // pace beats the keeper's hands
  saveChance *= 1.06 - rating * 0.12; // better takers are harder to read
  if (power < 0.36) saveChance += 0.16; // a soft penalty is a gift

  if (rand() < Math.min(0.95, saveChance)) {
    return { outcome: "save", actualZone, impact: onTargetImpact(actualZone) };
  }

  return { outcome: "goal", actualZone, impact: onTargetImpact(actualZone) };
}

/** A point inside the chosen zone, jittered so no two goals look identical. */
function onTargetImpact(zone: ZoneId): Impact {
  const { u, v } = zoneCenter(zone);
  return {
    u: clamp(u + range(-0.09, 0.09), 0.05, 0.95),
    v: clamp(v + range(-0.07, 0.07), 0.06, 0.96),
  };
}

/** A point on, or beyond, the frame of the goal. */
function offTargetImpact(zone: ZoneId, hitsFrame: boolean): Impact {
  const { row, col } = ZONES[zone];
  const high = row === 0 && (hitsFrame || rand() < 0.6);
  const side = col === 0 ? -1 : col === 2 ? 1 : rand() < 0.5 ? -1 : 1;

  if (high) {
    return {
      u: hitsFrame ? clamp(zoneCenter(zone).u, 0.12, 0.88) : clamp(zoneCenter(zone).u + range(-0.15, 0.15), 0.05, 0.95),
      v: hitsFrame ? -0.015 : range(-0.34, -0.14),
    };
  }

  const u = hitsFrame
    ? side < 0
      ? -0.012
      : 1.012
    : side < 0
      ? range(-0.28, -0.09)
      : range(1.09, 1.28);

  return { u, v: clamp(zoneCenter(zone).v + range(-0.1, 0.1), 0.12, 0.9) };
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/* ------------------------------------------------------------------ *
 * CPU decision making
 * ------------------------------------------------------------------ */

/** Zone the CPU taker aims at, avoiding a zone that was just saved. */
export function cpuAim(history: Attempt[]): ZoneId {
  const weights = {} as Record<ZoneId, number>;
  const lastCpuSave = [...history]
    .reverse()
    .find((a) => a.side === "cpu" && a.outcome === "save");

  for (const zone of ZONE_IDS) {
    let w = ZONES[zone].aimWeight;
    if (lastCpuSave && zone === lastCpuSave.actualZone) w *= 0.35;
    weights[zone] = w;
  }
  return weightedPick(weights);
}

/** Zone the CPU keeper commits to, nudged by where the user has been shooting. */
export function cpuDive(history: Attempt[]): ZoneId {
  const weights = {} as Record<ZoneId, number>;
  const userShots = history.filter((a) => a.side === "user");

  for (const zone of ZONE_IDS) {
    let w = ZONES[zone].diveWeight;
    const timesUsed = userShots.filter((a) => a.actualZone === zone).length;
    if (timesUsed >= 2) w *= 1 + timesUsed * 0.4; // reads a repeated pattern
    weights[zone] = w;
  }
  return weightedPick(weights);
}

export function cpuPower(player: Player): number {
  return clamp(range(0.5, 0.94) * (0.82 + ratingOf(player) * 0.22), 0.4, 0.98);
}

/* ------------------------------------------------------------------ *
 * Shootout progression
 * ------------------------------------------------------------------ */

export const REGULATION_KICKS = 5;

type Tally = {
  userGoals: number;
  cpuGoals: number;
  userTaken: number;
  cpuTaken: number;
};

export function tally(attempts: Attempt[]): Tally {
  return {
    userGoals: attempts.filter((a) => a.side === "user" && a.outcome === "goal").length,
    cpuGoals: attempts.filter((a) => a.side === "cpu" && a.outcome === "goal").length,
    userTaken: attempts.filter((a) => a.side === "user").length,
    cpuTaken: attempts.filter((a) => a.side === "cpu").length,
  };
}

/**
 * Standard shootout maths: a team wins as soon as the other side cannot
 * catch up with the kicks it has left, and in sudden death as soon as one
 * team leads after both have taken an equal number of kicks.
 */
export function decideWinner(attempts: Attempt[]): Side | null {
  const { userGoals, cpuGoals, userTaken, cpuTaken } = tally(attempts);

  // Once both teams have taken their five, only a completed round can settle it.
  if (userTaken >= REGULATION_KICKS && cpuTaken >= REGULATION_KICKS) {
    if (userTaken === cpuTaken && userGoals !== cpuGoals) {
      return userGoals > cpuGoals ? "user" : "cpu";
    }
    return null;
  }

  const userLeft = REGULATION_KICKS - userTaken;
  const cpuLeft = REGULATION_KICKS - cpuTaken;
  if (userGoals > cpuGoals + cpuLeft) return "user";
  if (cpuGoals > userGoals + userLeft) return "cpu";
  return null;
}

/** True when missing this kick hands the shootout to the other team. */
export function isSuddenDeathPressure(attempts: Attempt[], shooter: Side): boolean {
  const { userGoals, cpuGoals, userTaken, cpuTaken } = tally(attempts);
  const own = shooter === "user" ? userGoals : cpuGoals;
  const other = shooter === "user" ? cpuGoals : userGoals;
  const ownTaken = shooter === "user" ? userTaken : cpuTaken;
  const otherTaken = shooter === "user" ? cpuTaken : userTaken;

  if (ownTaken >= REGULATION_KICKS) {
    // In sudden death only the team kicking second can lose on this kick.
    return otherTaken > ownTaken && other > own;
  }

  // In regulation: after a miss, could the opponent's current score be caught?
  const kicksLeftAfterThisOne = REGULATION_KICKS - ownTaken - 1;
  return other > own + kicksLeftAfterThisOne;
}

/** Which team kicks next. Teams alternate, user first in every round. */
export function nextShooter(attempts: Attempt[]): Side {
  const { userTaken, cpuTaken } = tally(attempts);
  return userTaken <= cpuTaken ? "user" : "cpu";
}

export function roundNumber(attempts: Attempt[]): number {
  const { userTaken, cpuTaken } = tally(attempts);
  return Math.max(userTaken, cpuTaken) + (userTaken === cpuTaken ? 1 : 0);
}

export function isSuddenDeath(attempts: Attempt[]): boolean {
  const { userTaken, cpuTaken } = tally(attempts);
  return userTaken >= REGULATION_KICKS && cpuTaken >= REGULATION_KICKS;
}

/** The taker for a given kick number, cycling back through the list if needed. */
export function takerFor(order: Player[], kickIndex: number): Player {
  return order[kickIndex % order.length];
}

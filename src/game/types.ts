import type { Player, TeamRoster } from "../data/rosters";

/**
 * The six target areas of the goal mouth: left, middle and right across,
 * top and bottom down. Read left-to-right, top-to-bottom.
 */
export const ZONE_IDS = ["TL", "TC", "TR", "BL", "BC", "BR"] as const;

export type ZoneId = (typeof ZONE_IDS)[number];

export type Side = "user" | "cpu";

export type ShotOutcome = "goal" | "save" | "post" | "miss";

/**
 * Where the ball crossed the goal line, in goal-mouth space.
 * `u` runs 0 (left post) to 1 (right post), `v` runs 0 (crossbar) to 1 (grass).
 * Values outside that range are shots that missed the frame.
 */
export type Impact = { u: number; v: number };

export type Attempt = {
  side: Side;
  /** 1-indexed kick number for that team. */
  index: number;
  player: Player;
  aimZone: ZoneId;
  actualZone: ZoneId;
  keeperZone: ZoneId;
  power: number;
  outcome: ShotOutcome;
  impact: Impact;
  suddenDeath: boolean;
};

export type Phase =
  | "aim"
  | "power"
  | "dive"
  | "runup"
  | "flight"
  | "reveal"
  | "final";

export type MatchState = {
  user: TeamRoster;
  cpu: TeamRoster;
  userId: string;
  cpuId: string;
  attempts: Attempt[];
  /** Whose turn it is to take the kick. */
  shooter: Side;
  round: number;
  suddenDeath: boolean;
  winner: Side | null;
  phase: Phase;
  lastAttempt: Attempt | null;
};

export const scoreOf = (attempts: Attempt[], side: Side) =>
  attempts.filter((a) => a.side === side && a.outcome === "goal").length;

export const takenBy = (attempts: Attempt[], side: Side) =>
  attempts.filter((a) => a.side === side).length;

export const isScoringOutcome = (outcome: ShotOutcome) => outcome === "goal";

import { ZONES } from "./engine";
import type { Attempt, Impact, ZoneId } from "./types";

/** How a zone is spoken about: "top left", "bottom centre". */
export function zoneWords(zone: ZoneId): string {
  const vertical = zone[0] === "T" ? "top" : "bottom";
  const horizontal = zone[1] === "L" ? "left" : zone[1] === "R" ? "right" : "centre";
  return `${vertical} ${horizontal}`;
}

/**
 * How well the keeper's dive matched where the ball actually went. The bands
 * mirror `keeperCoverage`, so the wording always agrees with the odds the shot
 * was settled on.
 */
type DiveRead = "exact" | "height" | "near" | "off" | "wrong";

function diveRead(shot: ZoneId, guess: ZoneId): DiveRead {
  const sideways = Math.abs(ZONES[shot].col - ZONES[guess].col);
  const sameHeight = ZONES[shot].row === ZONES[guess].row;
  if (sideways >= 2) return "wrong";
  if (sideways === 1) return sameHeight ? "near" : "off";
  return sameHeight ? "exact" : "height";
}

/** Whoever is between the sticks — the user keeps whenever the CPU shoots. */
type Voice = { keeper: string; their: string };

/** Where an off-target ball finished, read back from the impact point. */
function offTargetWords(impact: Impact, frame: boolean): string {
  if (impact.v < 0) return frame ? "off the crossbar" : "over the bar";
  if (impact.u < 0.5) return frame ? "off the left post" : "wide of the left post";
  return frame ? "off the right post" : "wide of the right post";
}

function saveReason(read: DiveRead, high: boolean, voice: Voice): string {
  switch (read) {
    case "exact":
      return `${voice.keeper} committed to the same spot and blocked it`;
    case "height":
      return `${voice.keeper} read the side and got a hand ${high ? "up" : "down"} to it`;
    case "near":
      return `${voice.keeper} dived one spot along and reached it at full stretch`;
    case "off":
      return `${voice.keeper} guessed wrong and clawed it away with a trailing hand`;
    case "wrong":
      return `${voice.keeper} somehow got across from the other side of the goal`;
  }
}

function goalReason(read: DiveRead, hard: boolean, voice: Voice): string {
  switch (read) {
    case "exact":
      return hard
        ? `${voice.keeper} guessed right but the pace beat ${voice.their} hands`
        : `${voice.keeper} guessed right and still could not keep it out`;
    case "height":
      return `${voice.keeper} picked the right side but the wrong height`;
    case "near":
      return `${voice.keeper} dived one spot along and could not stretch back`;
    case "off":
      return `${voice.keeper} guessed the wrong side and the wrong height`;
    case "wrong":
      return `${voice.keeper} went the other way`;
  }
}

/**
 * One sentence on why a kick ended the way it did, used both for the shout that
 * follows the kick and for the kick-by-kick log at full time.
 */
export function describeAttempt(attempt: Attempt | null): string {
  if (!attempt) return "";

  const userShot = attempt.side === "user";
  const shooter = userShot ? "You" : surname(attempt.player.name);
  const voice: Voice = userShot
    ? { keeper: "the keeper", their: "their" }
    : { keeper: "you", their: "your" };

  const spot = zoneWords(attempt.actualZone);
  const aimed = zoneWords(attempt.aimZone);
  const drifted = attempt.actualZone !== attempt.aimZone;
  const hard = attempt.power >= 0.86;
  const soft = attempt.power <= 0.34;

  if (attempt.outcome === "miss" || attempt.outcome === "post") {
    const contact = hard ? "blazed it" : soft ? "scuffed it" : "dragged it";
    return `${shooter} went for the ${aimed} and ${contact} ${offTargetWords(attempt.impact, attempt.outcome === "post")}.`;
  }

  const read = diveRead(attempt.actualZone, attempt.keeperZone);

  if (attempt.outcome === "save") {
    const path = drifted
      ? `${shooter} over-hit it into the ${spot}`
      : soft
        ? `${shooter} went for the ${spot} with no pace on it`
        : `${shooter} went for the ${spot}`;
    return `${path} — ${saveReason(read, attempt.actualZone[0] === "T", voice)}.`;
  }

  const path = drifted
    ? `${shooter} over-hit it and it flew into the ${spot}`
    : `${shooter} found the ${spot}`;
  return `${path} — ${goalReason(read, hard, voice)}.`;
}

const surname = (name: string) => name.split(" ").slice(-1)[0];

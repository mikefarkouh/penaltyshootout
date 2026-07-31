import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect } from "react";
import { sfxClick } from "../audio/sfx";
import { describeAttempt } from "../game/commentary";
import type { Shootout as ShootoutState } from "../game/useShootout";
import type { ZoneId } from "../game/types";
import { PitchScene } from "../scene/PitchScene";
import { Instruction, OutcomeBanner } from "../ui/Announcer";
import { PowerMeter } from "../ui/PowerMeter";
import { Scoreboard } from "../ui/Scoreboard";

/**
 * Shortcuts so the goal can be aimed from the keyboard: the number keys read
 * across the goal, and Q/W/E over A/S/D mirrors the layout on the screen.
 */
const KEY_ZONES: Record<string, ZoneId> = {
  "1": "TL", "2": "TC", "3": "TR",
  "4": "BL", "5": "BC", "6": "BR",
  q: "TL", w: "TC", e: "TR",
  a: "BL", s: "BC", d: "BR",
};

type Props = {
  game: ShootoutState;
  onQuit: () => void;
};

export function Shootout({ game, onQuit }: Props) {
  const {
    phase,
    turn,
    attempts,
    userTeam,
    cpuTeam,
    round,
    lastAttempt,
    winner,
    flightDuration,
    chooseAim,
    lockPower,
    chooseDive,
  } = game;

  const userShooting = turn.side === "user";
  const shootingTeam = userShooting ? userTeam : cpuTeam;
  const keepingTeam = userShooting ? cpuTeam : userTeam;
  const interaction = phase === "aim" ? "aim" : phase === "dive" ? "dive" : null;

  const handleZone = useCallback(
    (zone: ZoneId) => {
      if (phase === "aim") {
        sfxClick();
        chooseAim(zone);
      } else if (phase === "dive") {
        sfxClick();
        chooseDive(zone);
      }
    },
    [phase, chooseAim, chooseDive],
  );

  useEffect(() => {
    if (!interaction) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const zone = KEY_ZONES[e.key.toLowerCase()];
      if (zone) {
        e.preventDefault();
        handleZone(zone);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interaction, handleZone]);

  return (
    <div className="screen screen--shootout">
      <div className="pitch-wrap">
        <PitchScene
          homeTeam={userTeam}
          awayTeam={cpuTeam}
          shootingTeam={shootingTeam}
          keepingTeam={keepingTeam}
          shooterPlayer={turn.player}
          phase={phase}
          aimZone={turn.aimZone}
          keeperZone={turn.keeperZone}
          impact={turn.resolution?.impact ?? null}
          outcome={phase === "reveal" ? (lastAttempt?.outcome ?? null) : null}
          lastAttempt={lastAttempt}
          flightDuration={flightDuration}
          interaction={interaction}
          onZonePick={handleZone}
        />
      </div>

      <div className="hud hud--top">
        <button type="button" className="btn btn--quit" onClick={onQuit}>
          Leave match
        </button>
        <Scoreboard
          userTeam={userTeam}
          cpuTeam={cpuTeam}
          attempts={attempts}
          round={round}
          suddenDeath={turn.suddenDeath}
          shooter={turn.side}
        />
      </div>

      <OutcomeBanner
        outcome={phase === "reveal" ? (lastAttempt?.outcome ?? null) : null}
        shooter={lastAttempt?.side ?? turn.side}
        playerName={lastAttempt?.player.name ?? turn.player.name}
        show={phase === "reveal"}
        decisive={winner != null}
      />

      <div className="hud hud--bottom">
        <motion.div
          className="taker-card"
          style={{ ["--team-color" as string]: shootingTeam.colors.primary }}
          key={`${turn.side}-${turn.index}`}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <span className="taker-card__role">{userShooting ? "You are shooting" : "You are in goal"}</span>
          <span className="taker-card__name">
            <span className="taker-card__number">{turn.player.number ?? "–"}</span>
            {turn.player.name}
          </span>
          <span className="taker-card__team">
            {shootingTeam.country} · kick {turn.index}
            {turn.suddenDeath ? " · sudden death" : ""}
          </span>
        </motion.div>

        <div className="hud__control">
          <AnimatePresence mode="wait">
            {phase === "aim" && (
              <Instruction
                key="aim"
                title="Pick your spot"
                detail="Click a target in the goal, or use the number keys 1–6"
                pressure={turn.pressure}
              />
            )}
            {phase === "power" && <PowerMeter key={`power-${turn.index}-${turn.side}`} onLock={lockPower} />}
            {phase === "dive" && (
              <Instruction
                key="dive"
                title="Guess the dive"
                detail={`${turn.player.name} is stepping up — commit to a corner`}
                pressure={turn.pressure}
              />
            )}
            {(phase === "runup" || phase === "flight") && (
              <Instruction key="wait" title="Here we go" detail="Hold your breath…" />
            )}
            {phase === "reveal" && (
              <Instruction
                key="reveal"
                title={lastAttempt?.outcome === "goal" ? "Scored" : "No goal"}
                detail={describeAttempt(lastAttempt)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { TeamRoster } from "../data/rosters";
import { ZONES } from "../game/engine";
import type { Attempt, Phase, ShotOutcome, ZoneId } from "../game/types";
import { ZONE_IDS } from "../game/types";
import { BallGraphic } from "./Ball";
import { Goal } from "./Goal";
import { Keeper } from "./Keeper";
import { Kicker, type KickerPose } from "./Kicker";
import { Stadium } from "./Stadium";
import { SCENE, impactToScene, mulberry32, zoneRect } from "./geometry";

type Props = {
  homeTeam: TeamRoster;
  awayTeam: TeamRoster;
  /** Team currently taking the kick. */
  shootingTeam: TeamRoster;
  keepingTeam: TeamRoster;
  shooterPlayer: { name: string; number?: number; position: "G" | "D" | "M" | "F" };
  phase: Phase;
  aimZone: ZoneId | null;
  keeperZone: ZoneId | null;
  impact: { u: number; v: number } | null;
  outcome: ShotOutcome | null;
  lastAttempt: Attempt | null;
  flightDuration: number;
  /** Set when the user must pick a target or a dive. */
  interaction: "aim" | "dive" | null;
  onZonePick: (zone: ZoneId) => void;
};

const SPOT = SCENE.penaltySpot;

/** Gold picks out where the ball is going, red where the keeper is going. */
const AIM_COLOR = "#fbbf24";
const SAVE_COLOR = "#ef4444";

export function PitchScene({
  homeTeam,
  awayTeam,
  shootingTeam,
  keepingTeam,
  shooterPlayer,
  phase,
  aimZone,
  keeperZone,
  impact,
  outcome,
  lastAttempt,
  flightDuration,
  interaction,
  onZonePick,
}: Props) {
  const camera = useAnimationControls();
  const [kickerPose, setKickerPose] = useState<KickerPose>("idle");
  const [hovered, setHovered] = useState<ZoneId | null>(null);

  /* Kicker choreography ------------------------------------------------ */
  useEffect(() => {
    if (phase === "aim" || phase === "power" || phase === "dive") {
      setKickerPose("idle");
      return undefined;
    }
    if (phase === "runup") {
      setKickerPose("runup");
      const id = setTimeout(() => setKickerPose("plant"), 330);
      return () => clearTimeout(id);
    }
    if (phase === "flight") {
      setKickerPose("strike");
      const id = setTimeout(() => setKickerPose("follow"), 170);
      return () => clearTimeout(id);
    }
    if (phase === "reveal") {
      setKickerPose(outcome === "goal" ? "celebrate" : "dejected");
    }
    return undefined;
  }, [phase, outcome]);

  /* Camera shake on impact --------------------------------------------- */
  useEffect(() => {
    if (phase !== "reveal" || !outcome) return;
    const strength = outcome === "goal" ? 1 : outcome === "post" ? 0.85 : 0.45;
    void camera.start({
      x: [0, -7 * strength, 6 * strength, -3 * strength, 0],
      y: [0, 4 * strength, -3 * strength, 1.5 * strength, 0],
      transition: { duration: 0.42, ease: "easeOut" },
    });
  }, [phase, outcome, lastAttempt, camera]);

  /* Ball flight -------------------------------------------------------- */
  const ball = useMemo(
    () => ballMotion(phase, impact, outcome, flightDuration),
    [phase, impact, outcome, flightDuration],
  );

  const impactPoint = impact ? impactToScene(impact) : null;
  const showBulge = phase === "reveal" && outcome === "goal" && impactPoint;
  const keeperDive = phase === "flight" || phase === "reveal" ? keeperZone : null;

  return (
    <svg
      className="pitch-svg"
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label={`Penalty shootout: ${shootingTeam.country} taking a kick against ${keepingTeam.country}`}
    >
      <motion.g animate={camera}>
        <Stadium homeTeam={homeTeam} awayTeam={awayTeam} />

        <Goal
          bulge={
            showBulge && impactPoint
              ? { x: impactPoint.x, y: impactPoint.y, id: lastAttempt?.index ?? 0 }
              : null
          }
        />

        <Keeper
          team={keepingTeam}
          diveZone={keeperDive}
          mood={outcome === "goal" && phase === "reveal" ? "beaten" : outcome === "save" && phase === "reveal" ? "save" : "ready"}
        />

        {/* Ball, with a short trail so the eye can follow the strike */}
        {phase === "flight" &&
          [0.05, 0.1].map((delay, i) => (
            <motion.g
              key={`trail-${i}`}
              animate={ball.animate}
              transition={{ ...ball.transition, delay }}
              initial={false}
              opacity={0.34 - i * 0.14}
            >
              <circle r={SCENE.ballRadius} fill="#e2e8f0" />
            </motion.g>
          ))}

        <motion.g animate={ball.animate} transition={ball.transition} initial={false}>
          <motion.g animate={{ rotate: ball.spin }} transition={ball.transition}>
            <BallGraphic />
          </motion.g>
        </motion.g>

        <Kicker team={shootingTeam} player={shooterPlayer} pose={kickerPose} />

        {phase === "reveal" && outcome === "goal" && (
          <Confetti team={shootingTeam} seed={lastAttempt?.index ?? 1} />
        )}

        {/* Aim / dive targets */}
        <AnimatePresence>
          {interaction && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {ZONE_IDS.map((zone) => {
                const r = zoneRect(zone);
                const active = hovered === zone;
                return (
                  <g
                    key={zone}
                    className="zone-target"
                    onMouseEnter={() => setHovered(zone)}
                    onMouseLeave={() => setHovered((h) => (h === zone ? null : h))}
                    onClick={() => onZonePick(zone)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${interaction === "aim" ? "Shoot" : "Dive"} ${ZONES[zone].label}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onZonePick(zone);
                      }
                    }}
                  >
                    <rect
                      x={r.x + 4}
                      y={r.y + 4}
                      width={r.width - 8}
                      height={r.height - 8}
                      rx="8"
                      fill={active ? (interaction === "aim" ? AIM_COLOR : SAVE_COLOR) : "#ffffff"}
                      fillOpacity={active ? 0.28 : 0.07}
                      stroke={active ? (interaction === "aim" ? AIM_COLOR : SAVE_COLOR) : "#ffffff"}
                      strokeOpacity={active ? 0.95 : 0.4}
                      strokeWidth={active ? 3 : 1.6}
                      strokeDasharray={active ? undefined : "7 6"}
                    />
                    {interaction === "aim" ? (
                      // The translate lives on the outer group so the pulse
                      // animation's transform cannot clobber the position.
                      <g transform={`translate(${r.cx}, ${r.cy})`} opacity={active ? 1 : 0.55}>
                        <g className={active ? "target-active" : undefined}>
                          <circle r="19" fill="none" stroke="#fbbf24" strokeWidth="2.8" />
                          <circle r="7" fill="#fbbf24" fillOpacity={active ? 0.9 : 0.35} />
                          <path d="M-29 0h14M15 0h14M0 -29v14M0 15v14" stroke="#fbbf24" strokeWidth="2.8" strokeLinecap="round" />
                        </g>
                      </g>
                    ) : (
                      <g transform={`translate(${r.cx}, ${r.cy}) scale(1.3)`} opacity={active ? 1 : 0.5}>
                        <path
                          d="M-13 6 v-14 a3 3 0 0 1 6 0 v-4 a3 3 0 0 1 6 0 v2 a3 3 0 0 1 6 0 v3 a3 3 0 0 1 5 0 v13 a8 8 0 0 1 -8 8 h-8 a7 7 0 0 1 -7 -8 z"
                          fill={active ? SAVE_COLOR : "#fee2e2"}
                          stroke="#7f1d1d"
                          strokeWidth="1.6"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </motion.g>
          )}
        </AnimatePresence>

        {/* Locked-in aim marker while the power meter runs */}
        {phase === "power" && aimZone && (
          <g transform={`translate(${zoneRect(aimZone).cx}, ${zoneRect(aimZone).cy})`}>
            <motion.g initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <g className="target-active">
                <circle r="23" fill="none" stroke="#fbbf24" strokeWidth="3" />
              </g>
              <circle r="8" fill="#fbbf24" />
              <path d="M-33 0h14M19 0h14M0 -33v14M0 19v14" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            </motion.g>
          </g>
        )}
      </motion.g>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Ball motion
 * ------------------------------------------------------------------ */

function ballMotion(
  phase: Phase,
  impact: { u: number; v: number } | null,
  outcome: ShotOutcome | null,
  flightDuration: number,
) {
  const atSpot = { x: SPOT.x, y: SPOT.y, scale: 1 };

  if (phase === "aim" || phase === "power" || phase === "dive" || phase === "runup" || !impact) {
    return {
      animate: atSpot,
      transition: { duration: phase === "runup" ? 0 : 0.25 },
      spin: 0,
    };
  }

  const target = impactToScene(impact);
  const seconds = flightDuration / 1000;

  if (phase === "flight") {
    const midX = (SPOT.x + target.x) / 2;
    const midY = (SPOT.y + target.y) / 2 - 26;
    return {
      animate: {
        x: [SPOT.x, midX, target.x],
        y: [SPOT.y, midY, target.y],
        scale: [1, 0.76, SCENE.goalPlaneScale],
      },
      transition: { duration: seconds, ease: "linear" as const },
      spin: 420,
    };
  }

  // Reveal: how the ball behaves after contact.
  const lateral = target.x < SPOT.x ? -1 : 1;
  const rest =
    outcome === "goal"
      ? { x: target.x + lateral * 12, y: SCENE.goal.line - 16, scale: SCENE.goalPlaneScale * 1.05 }
      : outcome === "save"
        ? { x: target.x + lateral * 120, y: target.y + 96, scale: SCENE.goalPlaneScale * 1.25 }
        : outcome === "post"
          ? { x: target.x + lateral * 150, y: SCENE.goal.line + 60, scale: SCENE.goalPlaneScale * 1.5 }
          : { x: target.x + lateral * 90, y: target.y - 70, scale: SCENE.goalPlaneScale * 0.72 };

  return {
    animate: rest,
    transition: { duration: 0.85, ease: "easeOut" as const },
    spin: 620,
  };
}

/* ------------------------------------------------------------------ *
 * Celebration confetti
 * ------------------------------------------------------------------ */

function Confetti({ team, seed }: { team: TeamRoster; seed: number }) {
  const pieces = useMemo(() => {
    const rnd = mulberry32(seed * 7919 + 11);
    const palette = [team.colors.primary, team.colors.secondary, team.colors.accent, "#ffffff"];
    return Array.from({ length: 34 }, () => ({
      x: rnd() * SCENE.width,
      delay: rnd() * 0.5,
      drift: (rnd() - 0.5) * 140,
      size: 5 + rnd() * 6,
      rotate: rnd() * 360,
      color: palette[Math.floor(rnd() * palette.length)],
      duration: 1.6 + rnd() * 1.2,
    }));
  }, [team, seed]);

  return (
    <g pointerEvents="none">
      {pieces.map((p, i) => (
        <motion.rect
          key={i}
          width={p.size}
          height={p.size * 0.55}
          rx="1.5"
          fill={p.color}
          initial={{ x: p.x, y: 60, opacity: 0, rotate: p.rotate }}
          animate={{
            x: p.x + p.drift,
            y: SCENE.height + 40,
            opacity: [0, 1, 1, 0.2],
            rotate: p.rotate + 420,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </g>
  );
}

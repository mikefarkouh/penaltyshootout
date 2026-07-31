import { motion } from "framer-motion";
import type { TeamRoster } from "../data/rosters";
import { REGULATION_KICKS } from "../game/engine";
import { scoreOf, type Attempt, type Side } from "../game/types";
import { Flag } from "./Flag";

type Props = {
  userTeam: TeamRoster;
  cpuTeam: TeamRoster;
  attempts: Attempt[];
  round: number;
  suddenDeath: boolean;
  shooter: Side;
};

export function Scoreboard({ userTeam, cpuTeam, attempts, round, suddenDeath, shooter }: Props) {
  const userScore = scoreOf(attempts, "user");
  const cpuScore = scoreOf(attempts, "cpu");

  return (
    <div className="scoreboard">
      <TeamPanel
        team={userTeam}
        score={userScore}
        align="left"
        active={shooter === "user"}
        badge="You"
      />

      <div className="scoreboard__center">
        <div className={`scoreboard__round ${suddenDeath ? "is-sudden" : ""}`}>
          {suddenDeath ? "Sudden Death" : `Round ${Math.min(round, REGULATION_KICKS)} of ${REGULATION_KICKS}`}
        </div>
        <div className="scoreboard__score">
          <motion.span key={`u${userScore}`} initial={{ scale: 1.5, color: "#fbbf24" }} animate={{ scale: 1, color: "#f8fafc" }}>
            {userScore}
          </motion.span>
          <em>–</em>
          <motion.span key={`c${cpuScore}`} initial={{ scale: 1.5, color: "#fbbf24" }} animate={{ scale: 1, color: "#f8fafc" }}>
            {cpuScore}
          </motion.span>
        </div>
        <ShotGrid attempts={attempts} />
      </div>

      <TeamPanel
        team={cpuTeam}
        score={cpuScore}
        align="right"
        active={shooter === "cpu"}
        badge="CPU"
      />
    </div>
  );
}

function TeamPanel({
  team,
  score,
  align,
  active,
  badge,
}: {
  team: TeamRoster;
  score: number;
  align: "left" | "right";
  active: boolean;
  badge: string;
}) {
  return (
    <div
      className={`team-panel team-panel--${align} ${active ? "is-active" : ""}`}
      style={{ ["--team-color" as string]: team.colors.primary }}
    >
      <Flag code={team.code} width={54} />
      <div className="team-panel__meta">
        <span className="team-panel__name">{team.country}</span>
        <span className="team-panel__badge">{badge}</span>
      </div>
      <span className="team-panel__score">{score}</span>
    </div>
  );
}

/** Five slots per team, extended one row at a time during sudden death. */
export function ShotGrid({ attempts }: { attempts: Attempt[] }) {
  const userKicks = attempts.filter((a) => a.side === "user");
  const cpuKicks = attempts.filter((a) => a.side === "cpu");
  const slots = Math.max(REGULATION_KICKS, userKicks.length, cpuKicks.length);

  const row = (kicks: Attempt[], label: string) => (
    <div className="shot-grid__row" aria-label={label}>
      {Array.from({ length: slots }, (_, i) => {
        const kick = kicks[i];
        const state = !kick ? "pending" : kick.outcome === "goal" ? "goal" : "missed";
        return (
          <motion.span
            key={i}
            className={`shot-dot shot-dot--${state} ${i >= REGULATION_KICKS ? "is-extra" : ""}`}
            initial={kick ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            title={kick ? `${kick.player.name}: ${kick.outcome}` : "To come"}
          >
            {kick ? (kick.outcome === "goal" ? "●" : "✕") : ""}
          </motion.span>
        );
      })}
    </div>
  );

  return (
    <div className="shot-grid">
      {row(userKicks, "Your kicks")}
      {row(cpuKicks, "Opponent kicks")}
    </div>
  );
}

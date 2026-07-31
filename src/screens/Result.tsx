import { motion } from "framer-motion";
import { useMemo } from "react";
import type { TeamRoster } from "../data/rosters";
import { describeAttempt } from "../game/commentary";
import { scoreOf, type Attempt, type Side } from "../game/types";
import { Flag } from "../ui/Flag";
import { mulberry32 } from "../scene/geometry";

type Props = {
  userTeam: TeamRoster;
  cpuTeam: TeamRoster;
  attempts: Attempt[];
  winner: Side;
  onRematch: () => void;
  onNewTeam: () => void;
};

export function Result({ userTeam, cpuTeam, attempts, winner, onRematch, onNewTeam }: Props) {
  const userScore = scoreOf(attempts, "user");
  const cpuScore = scoreOf(attempts, "cpu");
  const userWon = winner === "user";
  const winningTeam = userWon ? userTeam : cpuTeam;
  const wentToSuddenDeath = attempts.some((a) => a.suddenDeath);

  const streamers = useMemo(() => {
    const rnd = mulberry32(attempts.length * 31 + 7);
    const palette = [
      winningTeam.colors.primary,
      winningTeam.colors.secondary,
      winningTeam.colors.accent,
      "#ffffff",
    ];
    return Array.from({ length: 46 }, () => ({
      left: rnd() * 100,
      delay: rnd() * 2.4,
      duration: 2.6 + rnd() * 2.4,
      size: 6 + rnd() * 10,
      color: palette[Math.floor(rnd() * palette.length)],
    }));
  }, [attempts.length, winningTeam]);

  return (
    <div className="screen screen--result" style={{ ["--team-color" as string]: winningTeam.colors.primary }}>
      {userWon && (
        <div className="streamers" aria-hidden>
          {streamers.map((s, i) => (
            <motion.span
              key={i}
              style={{ left: `${s.left}%`, width: s.size, height: s.size * 0.5, background: s.color }}
              initial={{ y: -40, opacity: 0, rotate: 0 }}
              animate={{ y: "105vh", opacity: [0, 1, 1, 0], rotate: 540 }}
              transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="result-card"
        initial={{ scale: 0.86, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        <div className="result-card__teams">
          <TeamResult team={userTeam} score={userScore} winner={userWon} label="You" />
          <span className="result-card__dash">–</span>
          <TeamResult team={cpuTeam} score={cpuScore} winner={!userWon} label="CPU" />
        </div>

        <p className="result-card__line">
          {userWon
            ? `${userTeam.country} hold their nerve from the spot.`
            : `${cpuTeam.country} send you home.`}
          {wentToSuddenDeath ? " It took sudden death to separate them." : ""}
        </p>

        <div className="result-log">
          <h3>Kick by kick</h3>
          <ol>
            {attempts.map((a, i) => (
              <li key={i} className={`result-log__row result-log__row--${a.outcome}`}>
                <div className="result-log__head">
                  <span className="result-log__team">
                    {(a.side === "user" ? userTeam : cpuTeam).code}
                  </span>
                  <span className="result-log__player">{a.player.name}</span>
                  <span className="result-log__outcome">{OUTCOME_LABEL[a.outcome]}</span>
                  {a.suddenDeath && <span className="result-log__sd">SD</span>}
                </div>
                <p className="result-log__why">{describeAttempt(a)}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="result-card__actions">
          <button type="button" className="btn btn--ghost" onClick={onNewTeam}>
            Pick a new nation
          </button>
          <button type="button" className="btn btn--primary" onClick={onRematch} autoFocus>
            Rematch
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const OUTCOME_LABEL: Record<Attempt["outcome"], string> = {
  goal: "Scored",
  save: "Saved",
  post: "Woodwork",
  miss: "Missed",
};

function TeamResult({
  team,
  score,
  winner,
  label,
}: {
  team: TeamRoster;
  score: number;
  winner: boolean;
  label: string;
}) {
  return (
    <div className={`result-team ${winner ? "is-winner" : ""}`}>
      <Flag code={team.code} width={92} />
      <span className="result-team__score">{score}</span>
      <span className="result-team__name">{team.country}</span>
      <span className="result-team__label">{label}</span>
      {winner && <span className="result-team__crown">Champions</span>}
    </div>
  );
}

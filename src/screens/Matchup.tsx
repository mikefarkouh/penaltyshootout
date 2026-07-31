import { motion } from "framer-motion";
import { getTeam, penaltyOrder, type Player, type TeamRoster } from "../data/rosters";
import { sfxDrum, sfxWhistle } from "../audio/sfx";
import { Flag } from "../ui/Flag";

type Props = {
  userId: string;
  cpuId: string;
  onStart: () => void;
  onBack: () => void;
};

export function Matchup({ userId, cpuId, onStart, onBack }: Props) {
  const user = getTeam(userId);
  const cpu = getTeam(cpuId);

  return (
    <div className="screen screen--matchup">
      <motion.p
        className="matchup__eyebrow"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        The draw is made
      </motion.p>

      <div className="matchup__grid">
        <TeamColumn team={user} side="left" label="Your nation" delay={0.1} />

        <motion.div
          className="matchup__vs"
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.35 }}
          onAnimationComplete={sfxDrum}
        >
          <span>VS</span>
          <small>Best of 5</small>
        </motion.div>

        <TeamColumn team={cpu} side="right" label="Opponent" delay={0.2} />
      </div>

      <motion.div
        className="matchup__actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          Change nation
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            sfxWhistle();
            onStart();
          }}
          autoFocus
        >
          Walk to the spot
        </button>
      </motion.div>
    </div>
  );
}

function TeamColumn({
  team,
  side,
  label,
  delay,
}: {
  team: TeamRoster;
  side: "left" | "right";
  label: string;
  delay: number;
}) {
  const takers = penaltyOrder(team).slice(0, 5);
  const keeper = team.goalkeepers[0];

  return (
    <motion.section
      className={`matchup__team matchup__team--${side}`}
      style={{ ["--team-color" as string]: team.colors.primary }}
      initial={{ opacity: 0, x: side === "left" ? -60 : 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 22, delay }}
    >
      <span className="matchup__label">{label}</span>
      <Flag code={team.code} width={150} />
      <h2>{team.country}</h2>
      <p className="matchup__nickname">{team.nickname}</p>

      <div className="matchup__squad">
        <h3>Between the sticks</h3>
        <PlayerRow player={keeper} />
        <h3>Penalty order</h3>
        <ol>
          {takers.map((p, i) => (
            <li key={p.name}>
              <span className="matchup__order">{i + 1}</span>
              <PlayerRow player={p} />
            </li>
          ))}
        </ol>
      </div>

      <a className="matchup__source" href={team.sourceUrl} target="_blank" rel="noreferrer">
        Squad source: ESPN
      </a>
    </motion.section>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <span className="player-row">
      <span className="player-row__number">{player.number ?? "–"}</span>
      <span className="player-row__name">{player.name}</span>
      <span className="player-row__pos">{player.position}</span>
    </span>
  );
}

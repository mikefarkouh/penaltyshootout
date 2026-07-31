import { motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { COUNTRY_IDS, ROSTERS, penaltyOrder } from "../data/rosters";
import { sfxClick, sfxWhistle } from "../audio/sfx";
import { Flag } from "../ui/Flag";

type Props = {
  onSelect: (countryId: string) => void;
};

export function TeamSelect({ onSelect }: Props) {
  const howTo = useRef<HTMLElement>(null);
  /** Bumped on every jump so the highlight ring replays. */
  const [highlight, setHighlight] = useState(0);

  const revealHowToPlay = useCallback(() => {
    const section = howTo.current;
    if (!section) return;
    sfxClick();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    // Move the keyboard position with the view without fighting the scroll.
    section.focus({ preventScroll: true });
    setHighlight((n) => n + 1);
  }, []);

  return (
    <div className="screen screen--menu">
      <motion.button
        type="button"
        className="how-to-jump"
        onClick={revealHowToPlay}
        aria-controls="how-to-play"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        How to play
      </motion.button>

      <motion.header
        className="masthead"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="masthead__title">
          LA COPA DE
          <br />
          <span>PENALTIES</span>
        </h1>
        <p className="masthead__sub">
          Eight nations, one trophy. <strong>PICK YOURS</strong>, face a random rival, and settle it
          from twelve yards — best of five, then sudden death.
        </p>
      </motion.header>

      <motion.ul
        className="team-grid"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
      >
        {COUNTRY_IDS.map((id) => {
          const team = ROSTERS[id];
          const takers = penaltyOrder(team).slice(0, 3);
          return (
            <motion.li
              key={id}
              variants={{
                hidden: { opacity: 0, y: 28, scale: 0.96 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <button
                type="button"
                className="team-card"
                style={{
                  ["--card-primary" as string]: team.colors.primary,
                  ["--card-secondary" as string]: team.colors.secondary,
                  ["--card-accent" as string]: team.colors.accent,
                }}
                onClick={() => {
                  sfxWhistle();
                  onSelect(id);
                }}
                onMouseEnter={sfxClick}
              >
                <div className="team-card__glow" aria-hidden />
                <Flag code={team.code} width={84} className="team-card__flag" />
                <h2 className="team-card__name">{team.country}</h2>
                <p className="team-card__nickname">{team.nickname}</p>

                <div className="team-card__stripe" aria-hidden>
                  <span style={{ background: team.colors.primary }} />
                  <span style={{ background: team.colors.secondary }} />
                  <span style={{ background: team.colors.accent }} />
                </div>

                <dl className="team-card__lineup">
                  <div>
                    <dt>Keeper</dt>
                    <dd>{team.goalkeepers[0].name}</dd>
                  </div>
                  <div>
                    <dt>Takers</dt>
                    <dd>{takers.map((p) => p.name.split(" ").slice(-1)[0]).join(" · ")}</dd>
                  </div>
                </dl>

                <span className="team-card__cta">Select {team.code}</span>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>

      <motion.section
        ref={howTo}
        id="how-to-play"
        tabIndex={-1}
        className="how-to"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {highlight > 0 && (
          <motion.span
            key={highlight}
            className="how-to__ring"
            aria-hidden
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          />
        )}
        <h3>How to play</h3>
        <ol>
          <li>
            <strong>Shooting</strong> — pick one of six spots in the goal, then stop the power meter.
            The green band trades placement against pace.
          </li>
          <li>
            <strong>Keeping</strong> — guess where the opponent will shoot and commit to that dive.
          </li>
          <li>
            <strong>Winning</strong> — five kicks each. Level after that and it goes to sudden death.
          </li>
        </ol>
        <p className="how-to__source">
          Squads seeded from the ESPN national-team pages. All artwork is drawn in SVG for this
          prototype.
        </p>
      </motion.section>
    </div>
  );
}

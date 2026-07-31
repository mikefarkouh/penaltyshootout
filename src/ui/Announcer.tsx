import { AnimatePresence, motion } from "framer-motion";
import type { ShotOutcome, Side } from "../game/types";

const HEADLINE: Record<ShotOutcome, { text: string; tone: string }> = {
  goal: { text: "GOAL!", tone: "goal" },
  save: { text: "SAVED!", tone: "save" },
  post: { text: "OFF THE WOODWORK!", tone: "post" },
  miss: { text: "MISSED!", tone: "miss" },
};

type BannerProps = {
  outcome: ShotOutcome | null;
  shooter: Side;
  playerName: string;
  show: boolean;
  decisive: boolean;
};

export function OutcomeBanner({ outcome, shooter, playerName, show, decisive }: BannerProps) {
  const headline = outcome ? HEADLINE[outcome] : null;
  const goodForUser = shooter === "user" ? outcome === "goal" : outcome !== "goal";

  return (
    <AnimatePresence>
      {show && headline && (
        // The wrapper handles centring: Framer Motion owns `transform` on the
        // banner itself, so it cannot also carry a translate.
        <div className="outcome-banner-slot">
          <motion.div
            className={`outcome-banner outcome-banner--${headline.tone}`}
            initial={{ scale: 0.5, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
          >
            <span className="outcome-banner__headline">{headline.text}</span>
            <span className="outcome-banner__sub">
              {playerName}
              {decisive ? " — that's the shootout!" : goodForUser ? " · advantage you" : ""}
            </span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

type InstructionProps = {
  title: string;
  detail: string;
  pressure?: boolean;
};

export function Instruction({ title, detail, pressure }: InstructionProps) {
  return (
    <motion.div
      className={`instruction ${pressure ? "is-pressure" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={title}
    >
      <strong>{title}</strong>
      <span>{detail}</span>
      {pressure && <em className="instruction__pressure">Must score</em>}
    </motion.div>
  );
}

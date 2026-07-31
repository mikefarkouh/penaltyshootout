import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import {
  crowdSwell,
  isAudioEnabled,
  primeAudio,
  setAudioEnabled,
  setMusicDucked,
  sfxKick,
  sfxMiss,
  sfxNet,
  sfxPost,
  sfxSave,
  startCrowd,
  startMusic,
} from "./audio/sfx";
import { randomOpponent } from "./data/rosters";
import { useShootout, type GameEvent } from "./game/useShootout";
import { Matchup } from "./screens/Matchup";
import { Result } from "./screens/Result";
import { Shootout } from "./screens/Shootout";
import { TeamSelect } from "./screens/TeamSelect";

type Stage = "select" | "matchup" | "match";

export default function App() {
  const [stage, setStage] = useState<Stage>("select");
  const [userId, setUserId] = useState<string | null>(null);
  const [cpuId, setCpuId] = useState<string | null>(null);
  const [matchKey, setMatchKey] = useState(0);
  const [sound, setSound] = useState(true);

  /* Hover sounds (and anything else that plays before a team is picked)
   * need the AudioContext armed first, which browsers only allow inside a
   * real user gesture. Arm it on the very first click/tap/keypress anywhere
   * on the page, rather than waiting for a specific handler to do it. */
  useEffect(() => {
    const unlock = () => {
      primeAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggleSound = useCallback(() => {
    setSound((on) => {
      setAudioEnabled(!on);
      if (!on) startCrowd();
      return !on;
    });
  }, []);

  const handleSelect = useCallback((id: string) => {
    setUserId(id);
    setCpuId(randomOpponent(id));
    setStage("matchup");
    setAudioEnabled(isAudioEnabled());
    startCrowd();
    startMusic();
  }, []);

  /* Menu theme plays at full volume on the select/matchup screens and
   * ducks well back once a shootout is actually underway. */
  useEffect(() => {
    setMusicDucked(stage === "match");
  }, [stage]);

  const backToSelect = useCallback(() => {
    setStage("select");
    setUserId(null);
    setCpuId(null);
  }, []);

  return (
    <div className="app">
      <div className="app__backdrop" aria-hidden>
        <span className="beam beam--1" />
        <span className="beam beam--2" />
        <span className="beam beam--3" />
      </div>

      <button
        type="button"
        className="sound-toggle"
        onClick={toggleSound}
        aria-pressed={sound}
        title={sound ? "Mute" : "Unmute"}
      >
        {sound ? <SpeakerOn /> : <SpeakerOff />}
        <span>{sound ? "Sound on" : "Muted"}</span>
      </button>

      <AnimatePresence mode="wait">
        {stage === "select" && (
          <Fade key="select">
            <TeamSelect onSelect={handleSelect} />
          </Fade>
        )}

        {stage === "matchup" && userId && cpuId && (
          <Fade key="matchup">
            <Matchup
              userId={userId}
              cpuId={cpuId}
              onStart={() => setStage("match")}
              onBack={backToSelect}
            />
          </Fade>
        )}

        {stage === "match" && userId && cpuId && (
          <Fade key={`match-${matchKey}`}>
            <Match
              key={`${userId}-${cpuId}-${matchKey}`}
              userId={userId}
              cpuId={cpuId}
              onQuit={backToSelect}
              onRematch={() => setMatchKey((k) => k + 1)}
            />
          </Fade>
        )}
      </AnimatePresence>
    </div>
  );
}

function Match({
  userId,
  cpuId,
  onQuit,
  onRematch,
}: {
  userId: string;
  cpuId: string;
  onQuit: () => void;
  onRematch: () => void;
}) {
  const game = useShootout(userId, cpuId);
  const { onEvent } = game;

  useEffect(() => {
    startCrowd();
    onEvent.current = (event: GameEvent) => {
      if (event.type === "kick") {
        sfxKick(event.power);
        return;
      }
      const { attempt, decisive } = event;
      const userBenefits = attempt.side === "user" ? attempt.outcome === "goal" : attempt.outcome !== "goal";
      switch (attempt.outcome) {
        case "goal":
          sfxNet();
          break;
        case "save":
          sfxSave();
          break;
        case "post":
          sfxPost();
          break;
        case "miss":
          sfxMiss();
          break;
      }
      crowdSwell((userBenefits ? 1 : 0.55) * (decisive ? 1.2 : 1), decisive ? 3.4 : 2.1);
    };
    return () => {
      onEvent.current = null;
    };
  }, [onEvent]);

  if (game.phase === "final" && game.winner) {
    return (
      <Result
        userTeam={game.userTeam}
        cpuTeam={game.cpuTeam}
        attempts={game.attempts}
        winner={game.winner}
        onRematch={onRematch}
        onNewTeam={onQuit}
      />
    );
  }

  return <Shootout game={game} onQuit={onQuit} />;
}

function Fade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="stage"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.01 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function SpeakerOn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      <path d="M17 9.5l5 5M22 9.5l-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

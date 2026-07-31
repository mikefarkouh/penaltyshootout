import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { getTeam, penaltyOrder, type Player } from "../data/rosters";
import {
  cpuAim,
  cpuDive,
  cpuPower,
  decideWinner,
  isSuddenDeath,
  isSuddenDeathPressure,
  nextShooter,
  resolveShot,
  roundNumber,
  takerFor,
  type ShotResolution,
} from "./engine";
import { takenBy, type Attempt, type Phase, type Side, type ZoneId } from "./types";

export const TIMING = {
  runup: 640,
  flightBase: 560,
  /** Long enough to read the shout explaining how the kick ended. */
  reveal: 4100,
  finalReveal: 4600,
} as const;

type Turn = {
  side: Side;
  player: Player;
  /** 1-indexed kick number for the shooting side. */
  index: number;
  aimZone: ZoneId | null;
  keeperZone: ZoneId | null;
  power: number | null;
  resolution: ShotResolution | null;
  suddenDeath: boolean;
  pressure: boolean;
};

type State = {
  attempts: Attempt[];
  turn: Turn;
  phase: Phase;
  winner: Side | null;
  lastAttempt: Attempt | null;
};

type Orders = Record<Side, Player[]>;

type Action =
  | { type: "aim"; zone: ZoneId }
  | { type: "power"; power: number; keeperZone: ZoneId; resolution: ShotResolution }
  | { type: "dive"; keeperZone: ZoneId; aimZone: ZoneId; power: number; resolution: ShotResolution }
  | { type: "flight" }
  | { type: "reveal" }
  | { type: "next"; orders: Orders }
  | { type: "restart"; orders: Orders };

function createTurn(attempts: Attempt[], orders: Orders): Turn {
  const side = nextShooter(attempts);
  const taken = takenBy(attempts, side);
  return {
    side,
    player: takerFor(orders[side], taken),
    index: taken + 1,
    aimZone: null,
    keeperZone: null,
    power: null,
    resolution: null,
    suddenDeath: isSuddenDeath(attempts),
    pressure: isSuddenDeathPressure(attempts, side),
  };
}

const phaseForTurn = (turn: Turn): Phase => (turn.side === "user" ? "aim" : "dive");

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "aim":
      return { ...state, turn: { ...state.turn, aimZone: action.zone }, phase: "power" };

    case "power":
      return {
        ...state,
        turn: {
          ...state.turn,
          power: action.power,
          keeperZone: action.keeperZone,
          resolution: action.resolution,
        },
        phase: "runup",
      };

    case "dive":
      return {
        ...state,
        turn: {
          ...state.turn,
          keeperZone: action.keeperZone,
          aimZone: action.aimZone,
          power: action.power,
          resolution: action.resolution,
        },
        phase: "runup",
      };

    case "flight":
      return { ...state, phase: "flight" };

    case "reveal": {
      const { turn } = state;
      if (!turn.resolution || !turn.aimZone || !turn.keeperZone || turn.power == null) {
        return state;
      }
      const attempt: Attempt = {
        side: turn.side,
        index: turn.index,
        player: turn.player,
        aimZone: turn.aimZone,
        actualZone: turn.resolution.actualZone,
        keeperZone: turn.keeperZone,
        power: turn.power,
        outcome: turn.resolution.outcome,
        impact: turn.resolution.impact,
        suddenDeath: turn.suddenDeath,
      };
      const attempts = [...state.attempts, attempt];
      return {
        ...state,
        attempts,
        lastAttempt: attempt,
        winner: decideWinner(attempts),
        phase: "reveal",
      };
    }

    case "next": {
      if (state.winner) return { ...state, phase: "final" };
      const turn = createTurn(state.attempts, action.orders);
      return { ...state, turn, phase: phaseForTurn(turn) };
    }

    case "restart": {
      const turn = createTurn([], action.orders);
      return { attempts: [], turn, phase: phaseForTurn(turn), winner: null, lastAttempt: null };
    }
  }
}

export function useShootout(userId: string, cpuId: string) {
  const userTeam = useMemo(() => getTeam(userId), [userId]);
  const cpuTeam = useMemo(() => getTeam(cpuId), [cpuId]);

  const orders = useMemo<Orders>(
    () => ({ user: penaltyOrder(userTeam), cpu: penaltyOrder(cpuTeam) }),
    [userTeam, cpuTeam],
  );

  const [state, dispatch] = useReducer(reducer, orders, (o) => {
    const turn = createTurn([], o);
    return { attempts: [], turn, phase: phaseForTurn(turn), winner: null, lastAttempt: null };
  });

  const onEvent = useRef<((event: GameEvent) => void) | null>(null);

  /* --- player input ------------------------------------------------ */

  const chooseAim = useCallback((zone: ZoneId) => {
    dispatch({ type: "aim", zone });
  }, []);

  const lockPower = useCallback(
    (power: number) => {
      const keeperZone = cpuDive(state.attempts);
      const resolution = resolveShot({
        aimZone: state.turn.aimZone!,
        keeperZone,
        power,
        shooter: state.turn.player,
        pressure: state.turn.pressure,
      });
      dispatch({ type: "power", power, keeperZone, resolution });
    },
    [state.attempts, state.turn],
  );

  const chooseDive = useCallback(
    (keeperZone: ZoneId) => {
      const aimZone = cpuAim(state.attempts);
      const power = cpuPower(state.turn.player);
      const resolution = resolveShot({
        aimZone,
        keeperZone,
        power,
        shooter: state.turn.player,
        pressure: state.turn.pressure,
      });
      dispatch({ type: "dive", keeperZone, aimZone, power, resolution });
    },
    [state.attempts, state.turn],
  );

  const restart = useCallback(() => {
    dispatch({ type: "restart", orders });
  }, [orders]);

  /* --- timeline ----------------------------------------------------- */

  const flightDuration = state.turn.power != null ? TIMING.flightBase - state.turn.power * 150 : TIMING.flightBase;

  useEffect(() => {
    if (state.phase === "runup") {
      const id = setTimeout(() => {
        onEvent.current?.({ type: "kick", power: state.turn.power ?? 0.6 });
        dispatch({ type: "flight" });
      }, TIMING.runup);
      return () => clearTimeout(id);
    }

    if (state.phase === "flight") {
      const id = setTimeout(() => dispatch({ type: "reveal" }), flightDuration);
      return () => clearTimeout(id);
    }

    if (state.phase === "reveal") {
      const last = state.lastAttempt;
      if (last) onEvent.current?.({ type: "outcome", attempt: last, decisive: state.winner != null });
      const id = setTimeout(
        () => dispatch({ type: "next", orders }),
        state.winner ? TIMING.finalReveal : TIMING.reveal,
      );
      return () => clearTimeout(id);
    }
    return undefined;
    // `lastAttempt` changes in lockstep with `phase`, so this covers each step once.
  }, [state.phase, state.lastAttempt, state.winner, state.turn.power, flightDuration, orders]);

  return {
    ...state,
    userTeam,
    cpuTeam,
    orders,
    round: roundNumber(state.attempts),
    flightDuration,
    chooseAim,
    lockPower,
    chooseDive,
    restart,
    onEvent,
  };
}

export type GameEvent =
  | { type: "kick"; power: number }
  | { type: "outcome"; attempt: Attempt; decisive: boolean };

export type Shootout = ReturnType<typeof useShootout>;

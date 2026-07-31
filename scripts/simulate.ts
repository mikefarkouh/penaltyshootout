/**
 * Headless sanity check for the shootout rules. Run with:
 *   npx tsx scripts/simulate.ts
 */
import { getTeam, penaltyOrder } from "../src/data/rosters";
import {
  REGULATION_KICKS,
  cpuAim,
  cpuDive,
  cpuPower,
  decideWinner,
  isSuddenDeath,
  nextShooter,
  resolveShot,
  takerFor,
} from "../src/game/engine";
import { scoreOf, takenBy, type Attempt, type Side } from "../src/game/types";

function playMatch(): { attempts: Attempt[]; winner: Side } {
  const orders = {
    user: penaltyOrder(getTeam("france")),
    cpu: penaltyOrder(getTeam("england")),
  };
  const attempts: Attempt[] = [];

  for (let guard = 0; guard < 200; guard++) {
    const side = nextShooter(attempts);
    const taken = takenBy(attempts, side);
    const player = takerFor(orders[side], taken);
    const aimZone = cpuAim(attempts);
    const keeperZone = cpuDive(attempts);
    const power = cpuPower(player);
    const res = resolveShot({ aimZone, keeperZone, power, shooter: player, pressure: false });

    attempts.push({
      side,
      index: taken + 1,
      player,
      aimZone,
      actualZone: res.actualZone,
      keeperZone,
      power,
      outcome: res.outcome,
      impact: res.impact,
      suddenDeath: isSuddenDeath(attempts),
    });

    const winner = decideWinner(attempts);
    if (winner) return { attempts, winner };
  }
  throw new Error("Shootout never resolved");
}

const RUNS = 20000;
let userWins = 0;
let suddenDeaths = 0;
let totalKicks = 0;
let maxKicks = 0;
const outcomes = { goal: 0, save: 0, post: 0, miss: 0 };
const oddKickCounts = new Map<number, number>();

for (let i = 0; i < RUNS; i++) {
  const { attempts, winner } = playMatch();
  if (winner === "user") userWins++;
  if (attempts.some((a) => a.suddenDeath)) suddenDeaths++;
  totalKicks += attempts.length;
  maxKicks = Math.max(maxKicks, attempts.length);
  for (const a of attempts) outcomes[a.outcome]++;

  // Invariants: nobody takes more kicks than the other side plus one.
  const u = takenBy(attempts, "user");
  const c = takenBy(attempts, "cpu");
  if (Math.abs(u - c) > 1) throw new Error(`Uneven kicks: ${u} vs ${c}`);

  // A sudden-death shootout must be level after five each.
  if (attempts.some((a) => a.suddenDeath)) {
    const reg = attempts.filter((a) => a.index <= REGULATION_KICKS);
    if (scoreOf(reg, "user") !== scoreOf(reg, "cpu")) {
      throw new Error("Went to sudden death without being level after five");
    }
  }

  // The winner must actually have more goals.
  const uG = scoreOf(attempts, "user");
  const cG = scoreOf(attempts, "cpu");
  if ((winner === "user" && uG <= cG) || (winner === "cpu" && cG <= uG)) {
    throw new Error(`Bad winner: ${winner} at ${uG}-${cG}`);
  }
  if (u > REGULATION_KICKS || c > REGULATION_KICKS) {
    oddKickCounts.set(attempts.length, (oddKickCounts.get(attempts.length) ?? 0) + 1);
  }
}

const totalShots = Object.values(outcomes).reduce((a, b) => a + b, 0);
console.log(`Matches simulated:   ${RUNS}`);
console.log(`Home (user) wins:    ${((userWins / RUNS) * 100).toFixed(1)}%  (expect near 50%)`);
console.log(`Reached sudden death:${((suddenDeaths / RUNS) * 100).toFixed(1)}%`);
console.log(`Average kicks:       ${(totalKicks / RUNS).toFixed(2)}   longest: ${maxKicks}`);
console.log("Shot outcomes:");
for (const [key, n] of Object.entries(outcomes)) {
  console.log(`  ${key.padEnd(5)} ${((n / totalShots) * 100).toFixed(1)}%`);
}
console.log("All invariants held.");

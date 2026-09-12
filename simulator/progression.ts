import { battleCooldown, createInitialState, fight, goldBalance } from '../plugin/engine';

export type SimulationSummary = Readonly<{
  battles: number;
  victories: number;
  draws: number;
  defeats: number;
  finalLevel: number;
  finalGold: number;
  elapsedSec: number;
}>;

/** Run the exact product battle command with virtual time jumps at cooldown boundaries. */
export function simulateBattles(count: number, seed = 0x60b0_2026): SimulationSummary {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('count must be a non-negative safe integer.');
  let state = createInitialState(0, seed);
  for (let index = 0; index < count; index += 1) {
    const cooldown = battleCooldown(state);
    if (cooldown.remainingSec > 0) {
      state = {
        ...state,
        simTimeSec: state.simTimeSec + cooldown.remainingSec,
        lastWallClockMs: state.lastWallClockMs + cooldown.remainingSec * 1_000,
      };
    }
    const result = fight(state);
    if (!result.accepted) throw new Error(`Simulation battle rejected: ${result.reason}`);
    state = result.state;
  }
  return {
    battles: state.gameData.totalBattles,
    victories: state.gameData.victories,
    draws: state.gameData.draws,
    defeats: state.gameData.defeats,
    finalLevel: state.gameData.player.level,
    finalGold: goldBalance(state),
    elapsedSec: state.simTimeSec,
  };
}

import { describe, expect, it } from 'vitest';
import { createCooldownState } from 'idle-game-kit';
import type { MinuteVanguardState } from '../definitions/types';
import { createInitialState, fight, normalizeLoadedState } from '../plugin/engine';

function makeReady(state: MinuteVanguardState): MinuteVanguardState {
  return { ...state, gameData: { ...state.gameData, battleCooldown: createCooldownState() } };
}

describe('local battle history', () => {
  it('records a lightweight newest-first summary for every resolved battle', () => {
    const result = fight(createInitialState(1_000, 1501));
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.battleHistory).toHaveLength(1);
    const entry = result.state.gameData.battleHistory[0]!;
    expect(entry.battleIndex).toBe(1);
    expect(entry.enemyId).toBe(result.state.gameData.lastBattle?.enemyId);
    expect(entry.outcome).toBe(result.state.gameData.lastBattle?.outcome);
    expect(entry.monsterLevel).toBe(1);
    expect(entry).not.toHaveProperty('turns');
  });

  it('caps local history at 50 and keeps the newest battle first', () => {
    let state = createInitialState(2_000, 1502);
    for (let index = 0; index < 55; index += 1) {
      const result = fight(makeReady(state));
      expect(result.accepted).toBe(true);
      if (!result.accepted) throw new Error('Battle unexpectedly rejected.');
      state = result.state;
    }
    expect(state.gameData.battleHistory).toHaveLength(50);
    expect(state.gameData.battleHistory[0]?.battleIndex).toBe(55);
    expect(state.gameData.battleHistory.at(-1)?.battleIndex).toBe(6);
  });

  it('migrates an old save with lastBattle into a one-entry history', () => {
    const battle = fight(createInitialState(3_000, 1503));
    expect(battle.accepted).toBe(true);
    if (!battle.accepted) return;
    const legacyGameData = { ...battle.state.gameData } as Record<string, unknown>;
    delete legacyGameData.battleHistory;
    const legacy = { ...battle.state, gameData: legacyGameData } as unknown as MinuteVanguardState;
    const normalized = normalizeLoadedState(legacy, 3_000);
    expect(normalized.gameData.battleHistory).toHaveLength(1);
    expect(normalized.gameData.battleHistory[0]?.battleIndex).toBe(1);
  });
});

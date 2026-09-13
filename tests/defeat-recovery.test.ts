import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import { advanceFromWallClock, createInitialState, fight, goldBalance, recoverDefeatGold } from '../plugin/engine';

function forceDefeat(gems: number): MinuteVanguardState {
  const initial = createInitialState(0, 222);
  return {
    ...initial,
    currencies: {
      ...initial.currencies,
      [ids.currency.gold]: GameNumber.from(100).serialize(),
      [ids.currency.gem]: GameNumber.from(gems).serialize(),
    },
    gameData: {
      ...initial.gameData,
      player: {
        ...initial.gameData.player,
        currentHp: 1,
        baseStats: { ...initial.gameData.player.baseStats, attack: 0, magicAttack: 0 },
      },
    },
  };
}

describe('defeat Gold recovery', () => {
  it('stores the actual loss and restores it once for 100 Gem', () => {
    const battle = fight(forceDefeat(100));
    expect(battle.accepted).toBe(true);
    if (!battle.accepted) return;
    expect(battle.state.gameData.lastBattle?.outcome).toBe('defeat');
    expect(battle.state.gameData.recoverableDefeatGold).toBe(50);
    expect(goldBalance(battle.state)).toBe(50);

    const recovered = recoverDefeatGold(battle.state);
    expect(recovered.accepted).toBe(true);
    if (!recovered.accepted) return;
    expect(goldBalance(recovered.state)).toBe(100);
    expect(GameNumber.deserialize(recovered.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
    expect(recovered.state.gameData.recoverableDefeatGold).toBe(0);
    expect(recoverDefeatGold(recovered.state).accepted).toBe(false);
  });

  it('keeps the recovery available when closing/waiting but replaces it on the next battle', () => {
    const battle = fight(forceDefeat(200));
    expect(battle.accepted).toBe(true);
    if (!battle.accepted) return;
    const waited = advanceFromWallClock(battle.state, battle.state.lastWallClockMs + 60_000).state;
    expect(waited.gameData.recoverableDefeatGold).toBe(50);

    const strong: MinuteVanguardState = {
      ...waited,
      gameData: {
        ...waited.gameData,
        player: {
          ...waited.gameData.player,
          currentHp: 5_000,
          baseStats: { hp: 5_000, attack: 1_000, defense: 1_000, magicAttack: 1_000, magicDefense: 1_000, luck: 10 },
        },
      },
    };
    const next = fight(strong);
    expect(next.accepted).toBe(true);
    if (!next.accepted) return;
    expect(next.state.gameData.lastBattle?.outcome).toBe('victory');
    expect(next.state.gameData.recoverableDefeatGold).toBe(0);
  });

  it('requires 100 Gem and leaves the loss untouched when payment fails', () => {
    const battle = fight(forceDefeat(99));
    expect(battle.accepted).toBe(true);
    if (!battle.accepted) return;
    const result = recoverDefeatGold(battle.state);
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).toBe('insufficient-gems');
    expect(result.state.gameData.recoverableDefeatGold).toBe(50);
    expect(goldBalance(result.state)).toBe(50);
  });
});

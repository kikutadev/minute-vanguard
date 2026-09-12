import { describe, expect, it } from 'vitest';
import { ids } from '../definitions/game-definitions';
import { createInitialState, fight } from '../plugin/engine';

describe('battle reward breakdown', () => {
  it('records the same permanent/time multipliers used by victory Gold and EXP calculations', () => {
    const initial = createInitialState(0, 811);
    const prepared = {
      ...initial,
      gameData: {
        ...initial.gameData,
        victories: 10,
        permanentUpgrades: {
          ...initial.gameData.permanentUpgrades,
          goldMultiplier: true,
          expMultiplier: true,
        },
        timeBoosts: { ...initial.gameData.timeBoosts, gold: 999, exp: 999 },
        player: {
          ...initial.gameData.player,
          currentHp: 10_000,
          baseStats: { hp: 10_000, attack: 5_000, defense: 5_000, magicAttack: 5_000, magicDefense: 5_000, luck: 10 },
        },
      },
    };
    const result = fight(prepared);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.lastBattle?.outcome).toBe('victory');
    const battle = result.state.gameData.lastBattle!;
    expect(battle.goldBreakdown).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '基礎報酬', mode: 'base' }),
      { label: '恒久強化', mode: 'multiplier', value: 1.2 },
      { label: 'Gold Boost', mode: 'multiplier', value: 2 },
    ]));
    expect(battle.expBreakdown).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '基礎経験値', mode: 'base' }),
      { label: '恒久強化', mode: 'multiplier', value: 1.2 },
      { label: 'EXP Boost', mode: 'multiplier', value: 2 },
    ]));
    expect(result.state.currencies[ids.currency.gold]).toBeDefined();
  });
});

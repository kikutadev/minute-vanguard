import { describe, expect, it } from 'vitest';
import { enemies } from '../definitions/game-definitions';
import { createInitialState, fight, mutationEligible } from '../plugin/engine';

describe('monster roster density', () => {
  it('ships fifty original encounters in each currently supported monster level', () => {
    const level1 = enemies.filter((enemy) => enemy.monsterLevel === 1);
    const level2 = enemies.filter((enemy) => enemy.monsterLevel === 2);
    expect(level1).toHaveLength(50);
    expect(level2).toHaveLength(50);
    expect(enemies).toHaveLength(100);
    expect(new Set(enemies.map((enemy) => enemy.id)).size).toBe(100);
    expect(new Set(enemies.map((enemy) => enemy.displayName)).size).toBe(100);
  });

  it('keeps every rarity represented per monster level', () => {
    for (const level of [1, 2]) {
      const rarities = new Set(enemies.filter((enemy) => enemy.monsterLevel === level).map((enemy) => enemy.rarity));
      expect(rarities).toEqual(new Set(['common', 'uncommon', 'rare', 'epic', 'legendary', 'boss']));
    }
  });

  it('never naturally rolls Rare-or-higher during the first ten-kill protection window', () => {
    for (let seed = 1; seed <= 120; seed += 1) {
      const result = fight(createInitialState(0, seed));
      expect(result.accepted).toBe(true);
      if (!result.accepted) continue;
      expect(['common', 'uncommon']).toContain(result.state.gameData.lastBattle?.enemyRarity);
    }
  });

  it('keeps public drop-rate endpoints for common and boss orbs', () => {
    const commonRates = new Set(enemies.filter((enemy) => enemy.rarity === 'common').map((enemy) => enemy.orbDropChance));
    const bossRates = new Set(enemies.filter((enemy) => enemy.rarity === 'boss').map((enemy) => enemy.orbDropChance));
    expect(commonRates).toEqual(new Set([0.002]));
    expect(bossRates).toEqual(new Set([0.06]));
  });
});


describe('mutation beginner guard', () => {
  it('keeps mutations disabled through the first 20 victories', () => {
    const state = createInitialState(0, 12);
    expect(mutationEligible(state)).toBe(false);
    expect(mutationEligible({ ...state, gameData: { ...state.gameData, victories: 19 } })).toBe(false);
    expect(mutationEligible({ ...state, gameData: { ...state.gameData, victories: 20 } })).toBe(true);
  });
});

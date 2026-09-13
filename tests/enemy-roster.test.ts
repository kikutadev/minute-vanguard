import { describe, expect, it } from 'vitest';
import { enemies } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import { createInitialState, fight, mutationEligible, setMonsterLevel, unlockedMonsterLevel } from '../plugin/engine';

function stateWithLevelsCleared(lastClearedLevel: number): MinuteVanguardState {
  const initial = createInitialState(0, 77);
  const killCounts = Object.fromEntries(
    Array.from({ length: lastClearedLevel }, (_, index) => {
      const level = index + 1;
      const enemy = enemies.find((candidate) => candidate.monsterLevel === level);
      if (enemy === undefined) throw new Error(`Missing monster level ${level}.`);
      return [enemy.id, 1];
    }),
  );
  return { ...initial, gameData: { ...initial.gameData, killCounts, victories: Math.max(10, lastClearedLevel) } };
}

describe('monster roster density', () => {
  it('ships thirteen original monster levels with exactly fifty encounters each', () => {
    expect(enemies).toHaveLength(650);
    for (let level = 1; level <= 13; level += 1) {
      expect(enemies.filter((enemy) => enemy.monsterLevel === level)).toHaveLength(50);
    }
    expect(new Set(enemies.map((enemy) => enemy.id)).size).toBe(650);
    expect(new Set(enemies.map((enemy) => enemy.displayName)).size).toBe(650);
  });

  it('keeps every rarity represented per monster level', () => {
    for (let level = 1; level <= 13; level += 1) {
      const rarities = new Set(enemies.filter((enemy) => enemy.monsterLevel === level).map((enemy) => enemy.rarity));
      expect(rarities).toEqual(new Set(['common', 'uncommon', 'rare', 'epic', 'legendary', 'boss']));
    }
  });

  it('unlocks each next level only after defeating a monster in the previous level', () => {
    expect(unlockedMonsterLevel(createInitialState(0, 1))).toBe(1);
    expect(unlockedMonsterLevel(stateWithLevelsCleared(1))).toBe(2);
    expect(unlockedMonsterLevel(stateWithLevelsCleared(6))).toBe(7);
    expect(unlockedMonsterLevel(stateWithLevelsCleared(12))).toBe(13);

    const level1Only = stateWithLevelsCleared(1);
    expect(setMonsterLevel(level1Only, 2).accepted).toBe(true);
    expect(setMonsterLevel(level1Only, 3)).toMatchObject({ accepted: false, reason: 'level-locked' });
  });

  it('draws encounters only from the explicitly selected monster level', () => {
    const unlocked = stateWithLevelsCleared(12);
    const selected = setMonsterLevel(unlocked, 13);
    expect(selected.accepted).toBe(true);
    if (!selected.accepted) return;
    for (let seed = 1; seed <= 20; seed += 1) {
      const seeded = { ...selected.state, rngStreams: createInitialState(0, seed).rngStreams };
      const result = fight(seeded);
      expect(result.accepted).toBe(true);
      if (!result.accepted) continue;
      expect(result.state.gameData.lastBattle?.enemyId).toMatch(/^enemy\.lv13_/);
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

import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import {
  advanceFromWallClock,
  buyPetSnacks,
  createInitialState,
  levelGrowthMultiplier,
  petSnackAutoRemainingSec,
  petTrainingCap,
  petTrainingGrowthBonusPct,
  trainPet,
} from '../plugin/engine';

function withPet(state: MinuteVanguardState, enemyId = 'enemy.pebble'): MinuteVanguardState {
  return {
    ...state,
    gameData: {
      ...state.gameData,
      ownedPetEnemyIds: [enemyId],
      activePetEnemyIds: [enemyId],
      petTraining: { [enemyId]: { trainingLevel: 0, nickname: null } },
      player: { ...state.gameData.player, petCount: 1 },
    },
  };
}

describe('pet training', () => {
  it('accrues one free snack per hour, keeps fractional time, and stops free accrual at 100', () => {
    const initial = createInitialState(0, 901);
    const almost = advanceFromWallClock(initial, 3_599_000).state;
    expect(almost.gameData.petSnacks).toBe(0);
    expect(petSnackAutoRemainingSec(almost)).toBe(1);

    const one = advanceFromWallClock(almost, 3_600_000).state;
    expect(one.gameData.petSnacks).toBe(1);
    expect(petSnackAutoRemainingSec(one)).toBe(3_600);

    const capped = advanceFromWallClock({
      ...one,
      gameData: { ...one.gameData, petSnacks: 99, petSnackRemainderSec: 3_500 },
      lastWallClockMs: 3_600_000,
    }, 3_700_000).state;
    expect(capped.gameData.petSnacks).toBe(100);
    expect(petSnackAutoRemainingSec(capped)).toBe(0);
  });

  it('allows paid snacks above the free-accrual cap and does not truncate them on later clock advancement', () => {
    const initial = createInitialState(0, 902);
    const funded: MinuteVanguardState = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(100).serialize() },
      gameData: { ...initial.gameData, petSnacks: 50 },
    };
    const purchase = buyPetSnacks(funded);
    expect(purchase.accepted).toBe(true);
    if (!purchase.accepted) return;
    expect(purchase.state.gameData.petSnacks).toBe(150);
    expect(GameNumber.deserialize(purchase.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);

    const later = advanceFromWallClock(purchase.state, purchase.state.lastWallClockMs + 3_600_000).state;
    expect(later.gameData.petSnacks).toBe(150);
  });

  it('consumes one snack per training level and obeys rarity caps', () => {
    const initial = withPet(createInitialState(0, 903));
    const fed: MinuteVanguardState = { ...initial, gameData: { ...initial.gameData, petSnacks: 2 } };
    const first = trainPet(fed, 'enemy.pebble');
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(first.state.gameData.petSnacks).toBe(1);
    expect(first.state.gameData.petTraining['enemy.pebble']?.trainingLevel).toBe(1);
    expect(petTrainingCap('enemy.pebble')).toBe(50);

    const capped: MinuteVanguardState = {
      ...first.state,
      gameData: {
        ...first.state.gameData,
        petTraining: { 'enemy.pebble': { trainingLevel: 50, nickname: null } },
      },
    };
    const rejected = trainPet(capped, 'enemy.pebble');
    expect(rejected.accepted).toBe(false);
    if (!rejected.accepted) expect(rejected.reason).toBe('max-training');
  });

  it('adds +1% level-growth bonus for every 20 total pet-training levels', () => {
    const initial = withPet(createInitialState(0, 904));
    const trained: MinuteVanguardState = {
      ...initial,
      gameData: {
        ...initial.gameData,
        petTraining: {
          'enemy.pebble': { trainingLevel: 19, nickname: null },
          'enemy.alarm': { trainingLevel: 21, nickname: null },
        },
      },
    };
    expect(petTrainingGrowthBonusPct(trained)).toBe(2);
    // 1 owned pet + 2% from training, with no job-change bonus yet.
    expect(levelGrowthMultiplier(trained)).toBeCloseTo(1.03);
  });
});

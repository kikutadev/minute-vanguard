import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import {
  advanceFromWallClock,
  buyPetSnacks,
  createInitialState,
  fight,
  levelGrowthMultiplier,
  petSnackAutoRemainingSec,
  petDisplayName,
  petAttackRate,
  petTrainingCap,
  petTrainingGrowthBonusPct,
  setPetNickname,
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

  it('adds a separate +1% growth bonus for each captured mutated form without increasing pet count', () => {
    const initial = withPet(createInitialState(0, 905));
    const mutated: MinuteVanguardState = {
      ...initial,
      gameData: {
        ...initial.gameData,
        mutatedPetEnemyIds: ['enemy.pebble'],
      },
    };
    expect(mutated.gameData.player.petCount).toBe(1);
    expect(levelGrowthMultiplier(mutated)).toBeCloseTo(1.02);
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


  it('adds Tamer pet power as +40 percentage points instead of multiplying the base rate', () => {
    expect(petAttackRate(0, false)).toBeCloseTo(0.25);
    expect(petAttackRate(0, true)).toBeCloseTo(0.65);
    expect(petAttackRate(20, false)).toBeCloseTo(0.35);
    expect(petAttackRate(20, true)).toBeCloseTo(0.75);
  });

  it('supports a twelve-character nickname and empty reset without changing training', () => {
    const initial = withPet(createInitialState(0, 906));
    const named = setPetNickname(initial, 'enemy.pebble', 'いしころ先輩DX');
    expect(named.accepted).toBe(true);
    if (!named.accepted) return;
    expect(petDisplayName(named.state, 'enemy.pebble')).toBe('いしころ先輩DX');
    expect(named.state.gameData.petTraining['enemy.pebble']?.trainingLevel).toBe(0);

    const reset = setPetNickname(named.state, 'enemy.pebble', '   ');
    expect(reset.accepted).toBe(true);
    if (!reset.accepted) return;
    expect(reset.state.gameData.petTraining['enemy.pebble']?.nickname).toBeNull();
    expect(petDisplayName(reset.state, 'enemy.pebble')).toBe('妙に硬い石ころ');

    const tooLong = setPetNickname(initial, 'enemy.pebble', '1234567890123');
    expect(tooLong.accepted).toBe(false);
    if (!tooLong.accepted) expect(tooLong.reason).toBe('nickname-too-long');
  });

  it('uses the nickname in pet combat logs', () => {
    const initial = withPet(createInitialState(0, 907));
    const named = setPetNickname({
      ...initial,
      gameData: {
        ...initial.gameData,
        player: {
          ...initial.gameData.player,
          currentHp: 5_000,
          baseStats: { ...initial.gameData.player.baseStats, hp: 5_000, attack: 1, defense: 100, magicAttack: 1, magicDefense: 100, luck: 1 },
        },
      },
    }, 'enemy.pebble', 'ポチ');
    expect(named.accepted).toBe(true);
    if (!named.accepted) return;
    const battle = fight(named.state);
    expect(battle.accepted).toBe(true);
    if (!battle.accepted) return;
    const logs = battle.state.gameData.lastBattle?.turns.flatMap((turn) => turn.logs) ?? [];
    expect(logs.some((line) => line.includes('ポチの追撃'))).toBe(true);
  });

});

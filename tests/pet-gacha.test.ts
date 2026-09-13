import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { gachaPetDefinitions } from '../definitions/gacha-pet-definitions';
import { ids } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import {
  createInitialState,
  dailyPetPickupId,
  drawPetGacha,
  petGachaSingleCost,
  petTrainingCap,
  setActivePet,
  trainPet,
} from '../plugin/engine';

function withGems(state: MinuteVanguardState, amount: number): MinuteVanguardState {
  return {
    ...state,
    currencies: { ...state.currencies, [ids.currency.gem]: GameNumber.from(amount).serialize() },
  };
}

describe('pet gacha', () => {
  it('charges 100 Gem for the first single pull, then 300 Gem', () => {
    const initial = withGems(createInitialState(Date.UTC(2026, 8, 13, 0), 1001), 1_000);
    expect(petGachaSingleCost(initial)).toBe(100);
    const first = drawPetGacha(initial, 1);
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(GameNumber.deserialize(first.state.currencies[ids.currency.gem]!).toNumber()).toBe(900);
    expect(first.state.gameData.petGachaSingleDiscountUsed).toBe(true);
    expect(petGachaSingleCost(first.state)).toBe(300);

    const second = drawPetGacha(first.state, 1);
    expect(second.accepted).toBe(true);
    if (!second.accepted) return;
    expect(GameNumber.deserialize(second.state.currencies[ids.currency.gem]!).toNumber()).toBe(600);
  });

  it('charges 3,000 Gem for ten pulls with no separate guarantee cost', () => {
    const initial = withGems(createInitialState(0, 1002), 3_000);
    const result = drawPetGacha(initial, 10);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(GameNumber.deserialize(result.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
    expect(result.state.gameData.ownedGachaPetIds.length).toBeGreaterThan(0);
    expect(result.state.gameData.player.petCount).toBe(result.state.gameData.ownedGachaPetIds.length);
  });

  it('converts duplicates into snacks instead of adding duplicate ownership', () => {
    const initial = withGems(createInitialState(0, 1003), 300);
    const allOwned: MinuteVanguardState = {
      ...initial,
      gameData: {
        ...initial.gameData,
        ownedGachaPetIds: gachaPetDefinitions.map((pet) => pet.id),
        petTraining: Object.fromEntries(gachaPetDefinitions.map((pet) => [pet.id, { trainingLevel: 0, nickname: null }])),
        petGachaSingleDiscountUsed: true,
        player: { ...initial.gameData.player, petCount: gachaPetDefinitions.length },
      },
    };
    const result = drawPetGacha(allOwned, 1);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.ownedGachaPetIds).toHaveLength(50);
    expect(result.state.gameData.petSnacks).toBeGreaterThanOrEqual(100);
  });

  it('uses one stable all-player pickup per JST day', () => {
    const state = createInitialState(Date.UTC(2026, 8, 13, 1), 1004);
    const pickup = dailyPetPickupId(state);
    expect(gachaPetDefinitions.some((pet) => pet.id === pickup)).toBe(true);
    expect(dailyPetPickupId(state)).toBe(pickup);
  });

  it('lets a gacha-only pet join the party and train like a captured pet', () => {
    const initial = createInitialState(0, 1005);
    const pet = gachaPetDefinitions[0]!;
    const owned: MinuteVanguardState = {
      ...initial,
      gameData: {
        ...initial.gameData,
        ownedGachaPetIds: [pet.id],
        petTraining: { [pet.id]: { trainingLevel: 0, nickname: null } },
        petSnacks: 1,
        player: { ...initial.gameData.player, petCount: 1 },
      },
    };
    const active = setActivePet(owned, pet.id, true);
    expect(active.accepted).toBe(true);
    if (!active.accepted) return;
    expect(active.state.gameData.activePetEnemyIds).toContain(pet.id);
    expect(petTrainingCap(pet.id)).not.toBeNull();

    const trained = trainPet(active.state, pet.id);
    expect(trained.accepted).toBe(true);
    if (!trained.accepted) return;
    expect(trained.state.gameData.petTraining[pet.id]?.trainingLevel).toBe(1);
  });
});

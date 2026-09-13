import { describe, expect, it } from 'vitest';
import { gachaPetDefinitions } from '../definitions/gacha-pet-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import {
  activePetGuardRate,
  activePetRegenRate,
  createInitialState,
  petFollowupDamageMultiplier,
  petTripleStrikeMultiplier,
} from '../plugin/engine';

describe('gacha pet special effects', () => {
  it('gives every Epic-or-higher limited pet one of the four public effect categories', () => {
    const high = gachaPetDefinitions.filter((pet) => ['epic', 'legendary', 'boss'].includes(pet.rarity));
    expect(high).toHaveLength(18);
    expect(high.every((pet) => pet.specialEffect !== undefined)).toBe(true);
    expect(new Set(high.map((pet) => pet.specialEffect))).toEqual(new Set(['regen', 'guard', 'followup', 'tripleStrike']));
    expect(gachaPetDefinitions.filter((pet) => !['epic', 'legendary', 'boss'].includes(pet.rarity)).every((pet) => pet.specialEffect === undefined)).toBe(true);
  });

  it('uses product-owned regen/guard values only for active pets', () => {
    const guard = gachaPetDefinitions.find((pet) => pet.specialEffect === 'guard')!;
    const regen = gachaPetDefinitions.find((pet) => pet.specialEffect === 'regen')!;
    const initial = createInitialState(0, 1501);
    const state: MinuteVanguardState = {
      ...initial,
      gameData: {
        ...initial.gameData,
        ownedGachaPetIds: [guard.id, regen.id],
        activePetEnemyIds: [guard.id, regen.id],
        petTraining: {
          [guard.id]: { trainingLevel: 0, nickname: null },
          [regen.id]: { trainingLevel: 0, nickname: null },
        },
      },
    };
    expect(activePetGuardRate(state)).toBeCloseTo(0.08);
    expect(activePetRegenRate(state)).toBeCloseTo(0.02);
  });

  it('uses 15% triple-strike and 35% follow-up as explicit Minute Vanguard balance', () => {
    expect(petTripleStrikeMultiplier('tripleStrike', 0.149)).toBe(3);
    expect(petTripleStrikeMultiplier('tripleStrike', 0.15)).toBe(1);
    expect(petTripleStrikeMultiplier('regen', 0)).toBe(1);
    expect(petFollowupDamageMultiplier('followup')).toBeCloseTo(0.35);
    expect(petFollowupDamageMultiplier('guard')).toBe(0);
  });
});

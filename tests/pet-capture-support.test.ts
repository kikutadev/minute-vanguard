import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import { buySpecialEquipment, createInitialState, petCaptureEquipmentMultiplier, petSnackDropChance } from '../plugin/engine';

describe('pet capture support', () => {
  it('stacks capture support weapon and armor to ×4 and costs 2,000 Gem each', () => {
    const initial = createInitialState(0, 1201);
    const funded: MinuteVanguardState = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(4_000).serialize() },
    };
    const weapon = buySpecialEquipment(funded, ids.item.trailCrook);
    expect(weapon.accepted).toBe(true);
    if (!weapon.accepted) return;
    expect(petCaptureEquipmentMultiplier(weapon.state)).toBe(2);
    const armor = buySpecialEquipment(weapon.state, ids.item.trackerVest);
    expect(armor.accepted).toBe(true);
    if (!armor.accepted) return;
    expect(petCaptureEquipmentMultiplier(armor.state)).toBe(4);
    expect(GameNumber.deserialize(armor.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
  });

  it('uses product-owned 5% snack drops and public ×3 mutation weighting', () => {
    expect(petSnackDropChance(false)).toBeCloseTo(0.05);
    expect(petSnackDropChance(true)).toBeCloseTo(0.15);
  });
});

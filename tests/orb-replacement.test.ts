import { describe, expect, it } from 'vitest';
import type { EquipmentData, MinuteVanguardState, StatValues } from '../definitions/types';
import { ids } from '../definitions/game-definitions';
import { createInitialState, fight, fightSimple, orbInventoryCount, resolveOrbReplacement } from '../plugin/engine';

const stats: StatValues = { hp: 5, attack: 2, defense: 1, magicAttack: 1, magicDefense: 0, luck: 1 };
const orbData = (overrides: Partial<EquipmentData> = {}): EquipmentData => ({
  kind: 'orb', rarity: 'common', upgradeRank: 0, flatStats: {}, percentStats: stats,
  orbRank: 'F', favorite: false, locked: false, source: 'test', ...overrides,
});

function pendingState(oldOverrides: Partial<EquipmentData> = {}): MinuteVanguardState {
  const state = createInitialState(0, 1301);
  return {
    ...state,
    gameData: {
      ...state.gameData,
      orbCapacity: 1,
      inventory: {
        'item.orb:old': { instanceId: 'item.orb:old', definitionId: ids.item.orb, quantity: 1, data: orbData(oldOverrides) },
        'item.orb:new': { instanceId: 'item.orb:new', definitionId: ids.item.orb, quantity: 1, data: orbData({ orbRank: 'A', rarity: 'epic' }) },
      },
      pendingOrbReplacementItemId: 'item.orb:new',
    },
  };
}

describe('orb full-inventory replacement', () => {
  it('can discard the new pending orb and return to capacity', () => {
    const state = pendingState();
    const result = resolveOrbReplacement(state, 'item.orb:new');
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.pendingOrbReplacementItemId).toBeNull();
    expect(orbInventoryCount(result.state)).toBe(1);
    expect(result.state.gameData.inventory['item.orb:old']).toBeDefined();
    expect(result.state.gameData.inventory['item.orb:new']).toBeUndefined();
  });

  it('can discard an unprotected old orb and keep the new drop', () => {
    const result = resolveOrbReplacement(pendingState(), 'item.orb:old');
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.pendingOrbReplacementItemId).toBeNull();
    expect(orbInventoryCount(result.state)).toBe(1);
    expect(result.state.gameData.inventory['item.orb:old']).toBeUndefined();
    expect(result.state.gameData.inventory['item.orb:new']?.data?.orbRank).toBe('A');
  });

  it('protects favorite, locked and equipped old orbs', () => {
    for (const overrides of [{ favorite: true }, { locked: true }] as const) {
      const result = resolveOrbReplacement(pendingState(overrides), 'item.orb:old');
      expect(result.accepted).toBe(false);
      if (!result.accepted) expect(result.reason).toBe('protected-item');
    }
    const equipped = pendingState();
    const withEquip: MinuteVanguardState = {
      ...equipped,
      gameData: { ...equipped.gameData, loadout: { ...equipped.gameData.loadout, equipped: { ...equipped.gameData.loadout.equipped, orb: 'item.orb:old' } } },
    };
    const result = resolveOrbReplacement(withEquip, 'item.orb:old');
    expect(result.accepted).toBe(false);
    if (!result.accepted) expect(result.reason).toBe('protected-item');
  });

  it('blocks another battle until a pending replacement is resolved', () => {
    const result = fight(pendingState());
    expect(result.accepted).toBe(false);
    if (!result.accepted) expect(result.reason).toBe('orb-replacement-required');
  });

  it('does not silently lose a battle orb drop when capacity is full', () => {
    let found: MinuteVanguardState | null = null;
    for (let seed = 1; seed <= 800 && found === null; seed += 1) {
      const initial = createInitialState(0, seed);
      const filled: MinuteVanguardState = {
        ...initial,
        gameData: {
          ...initial.gameData,
          orbCapacity: 1,
          inventory: { 'item.orb:old': { instanceId: 'item.orb:old', definitionId: ids.item.orb, quantity: 1, data: orbData() } },
          player: { ...initial.gameData.player, currentHp: 5_000, baseStats: { hp: 5_000, attack: 1_000, defense: 1_000, magicAttack: 1_000, magicDefense: 1_000, luck: 10 } },
        },
      };
      const battle = fight(filled);
      if (battle.accepted && battle.state.gameData.lastBattle?.droppedOrbInstanceId !== null) found = battle.state;
    }
    expect(found).not.toBeNull();
    if (found === null) return;
    expect(found.gameData.pendingOrbReplacementItemId).not.toBeNull();
    expect(orbInventoryCount(found)).toBe(2);
  });

  it('simple battle auto-discards a newly dropped orb when capacity is full', () => {
    let found: MinuteVanguardState | null = null;
    for (let seed = 1; seed <= 800 && found === null; seed += 1) {
      const initial = createInitialState(0, seed);
      const filled: MinuteVanguardState = {
        ...initial,
        gameData: {
          ...initial.gameData,
          orbCapacity: 1,
          inventory: { 'item.orb:old': { instanceId: 'item.orb:old', definitionId: ids.item.orb, quantity: 1, data: orbData() } },
          player: { ...initial.gameData.player, currentHp: 5_000, baseStats: { hp: 5_000, attack: 1_000, defense: 1_000, magicAttack: 1_000, magicDefense: 1_000, luck: 10 } },
        },
      };
      const battle = fightSimple(filled);
      if (battle.accepted && battle.state.gameData.lastBattle?.droppedOrbInstanceId !== null) found = battle.state;
    }
    expect(found).not.toBeNull();
    if (found === null) return;
    expect(found.gameData.pendingOrbReplacementItemId).toBeNull();
    expect(orbInventoryCount(found)).toBe(1);
    expect(found.gameData.inventory['item.orb:old']).toBeDefined();
  });

});

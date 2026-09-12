import { describe, expect, it } from 'vitest';
import {
  createMinuteVanguardPublicData,
  createMinuteVanguardPublicSnapshot,
  MINUTE_VANGUARD_GAME_ID,
} from '../application/public-player-profile';
import { createInitialState } from '../plugin/engine';

describe('Minute Vanguard public player projection', () => {
  it('exposes only the explicit public profile shape rather than the raw save', () => {
    const state = createInitialState(0, 71);
    const data = createMinuteVanguardPublicData(state);

    expect(Object.keys(data).sort()).toEqual([
      'discoveredEnemyCount',
      'equippedArmorName',
      'equippedOrbRank',
      'equippedWeaponName',
      'jobId',
      'level',
      'ownedPetCount',
      'totalBattles',
      'totalJobChanges',
      'victories',
    ]);
    expect(data).not.toHaveProperty('currencies');
    expect(data).not.toHaveProperty('inventory');
    expect(data).not.toHaveProperty('currentHp');
    expect(data).not.toHaveProperty('exp');
  });

  it('adds public metadata without embedding state', () => {
    const state = createInitialState(0, 72);
    const snapshot = createMinuteVanguardPublicSnapshot({
      state,
      playerId: 'public-123',
      revision: 9,
      updatedAtMs: 123_456,
    });

    expect(snapshot.gameId).toBe(MINUTE_VANGUARD_GAME_ID);
    expect(snapshot.playerId).toBe('public-123');
    expect(snapshot.revision).toBe(9);
    expect(snapshot.updatedAtMs).toBe(123_456);
    expect(snapshot).not.toHaveProperty('state');
  });
});

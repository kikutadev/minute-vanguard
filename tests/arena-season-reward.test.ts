import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import { applyArenaSeasonReward, createInitialState } from '../plugin/engine';

describe('Arena season external reward', () => {
  it('applies a receipt only once even when the server returns it again before ACK', () => {
    const initial = createInitialState(0, 1201);
    const receipt = { receiptId: 'arena-season:minute-vanguard:2026-09-07:p1', seasonKey: '2026-09-07', tierId: 'gold', gold: 12_000, gems: 20, grantsMasterToken: false, champion: false } as const;
    const first = applyArenaSeasonReward(initial, receipt);
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(GameNumber.deserialize(first.state.currencies[ids.currency.gold]!).toNumber()).toBe(12_000);
    expect(GameNumber.deserialize(first.state.currencies[ids.currency.gem]!).toNumber()).toBe(20);
    expect(first.state.recentExternalRewardGrantIds).toContain(receipt.receiptId);

    const second = applyArenaSeasonReward(first.state, receipt);
    expect(second.accepted).toBe(true);
    if (!second.accepted) return;
    expect(GameNumber.deserialize(second.state.currencies[ids.currency.gold]!).toNumber()).toBe(12_000);
    expect(GameNumber.deserialize(second.state.currencies[ids.currency.gem]!).toNumber()).toBe(20);
  });
  it('keeps the Master crest permanently when the receipt grants it', () => {
    const initial = createInitialState(0, 1202);
    const result = applyArenaSeasonReward(initial, { receiptId: 'master-receipt', seasonKey: '2026-09-07', tierId: 'master', gold: 1, gems: 120, grantsMasterToken: true, champion: false });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.arenaMasterCrestOwned).toBe(true);
  });

});

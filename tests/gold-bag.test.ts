import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import { buyGoldBag, createInitialState, goldBagOffers, goldBalance } from '../plugin/engine';

function prepared(levels: readonly number[], gems = 1_000): MinuteVanguardState {
  const initial = createInitialState(0, 1001);
  return {
    ...initial,
    currencies: {
      ...initial.currencies,
      [ids.currency.gem]: GameNumber.from(gems).serialize(),
    },
    gameData: {
      ...initial.gameData,
      recentVictoryMonsterLevels: levels,
    },
  };
}

describe('gold bags', () => {
  it('requires at least two monster victories and exposes 30/100/300 Gem offers', () => {
    const blocked = goldBagOffers(prepared([1]));
    expect(blocked.map((offer) => offer.gemCost)).toEqual([30, 100, 300]);
    expect(blocked.every((offer) => !offer.available)).toBe(true);
    expect(buyGoldBag(prepared([1]), 'coinPouch').accepted).toBe(false);

    const available = goldBagOffers(prepared([1, 1]));
    expect(available.every((offer) => offer.available)).toBe(true);
  });

  it('uses only the rolling last-ten monster-level history and stronger stable clears increase the preview', () => {
    const low = goldBagOffers(prepared(Array.from({ length: 10 }, () => 1)));
    const mixed = goldBagOffers(prepared([1, 1, 1, 1, 1, 2, 2, 2, 2, 2]));
    const high = goldBagOffers(prepared(Array.from({ length: 10 }, () => 2)));
    expect(mixed[0]!.goldAmount).toBeGreaterThan(low[0]!.goldAmount);
    expect(high[0]!.goldAmount).toBeGreaterThan(mixed[0]!.goldAmount);

    const overTen = goldBagOffers(prepared([2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]));
    const lastTen = goldBagOffers(prepared(Array.from({ length: 10 }, () => 1)));
    expect(overTen.map((offer) => offer.goldAmount)).toEqual(lastTen.map((offer) => offer.goldAmount));
  });

  it('spends Gems and grants exactly the previewed Gold', () => {
    const state = prepared([1, 2, 2, 2], 300);
    const offer = goldBagOffers(state).find((candidate) => candidate.id === 'vault')!;
    const beforeGold = goldBalance(state);
    const result = buyGoldBag(state, 'vault');
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(GameNumber.deserialize(result.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
    expect(goldBalance(result.state)).toBe(beforeGold + offer.goldAmount);
    expect(result.state.gameData.recentVictoryMonsterLevels).toEqual(state.gameData.recentVictoryMonsterLevels);
  });

  it('preview ignores current Gold-boost systems because it is based on monster-level history', () => {
    const base = prepared([1, 2, 2, 1], 300);
    const boosted: MinuteVanguardState = {
      ...base,
      gameData: {
        ...base.gameData,
        permanentUpgrades: { ...base.gameData.permanentUpgrades, goldMultiplier: true },
        timeBoosts: { ...base.gameData.timeBoosts, gold: base.simTimeSec + 600 },
      },
    };
    expect(goldBagOffers(boosted).map((offer) => offer.goldAmount)).toEqual(goldBagOffers(base).map((offer) => offer.goldAmount));
  });
});

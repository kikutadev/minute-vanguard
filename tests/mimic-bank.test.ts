import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import { mimicBankGemCosts, mimicBankOutcomes, mimicBankProductOwnedOdds } from '../definitions/mimic-bank-definitions';
import { createInitialState, depositAllGoldToMimicBank, normalizeLoadedState, withdrawMimicBank } from '../plugin/engine';

describe('Mimic Bank', () => {
  it('locks the public four outcomes while keeping a valid product-owned probability table', () => {
    expect(mimicBankOutcomes.map((outcome) => outcome.multiplier)).toEqual([0.1, 0.5, 1, 2]);
    expect(mimicBankGemCosts).toEqual([10, 20, 30]);
    for (const cost of mimicBankGemCosts) {
      const total = Object.values(mimicBankProductOwnedOdds[cost]).reduce((sum, value) => sum + value, 0);
      expect(total).toBeCloseTo(1, 10);
    }
    expect(mimicBankProductOwnedOdds[20]['return-200']).toBeGreaterThan(mimicBankProductOwnedOdds[10]['return-200']);
    expect(mimicBankProductOwnedOdds[30]['return-200']).toBeGreaterThan(mimicBankProductOwnedOdds[20]['return-200']);
    expect(mimicBankProductOwnedOdds[30]['return-10']).toBeLessThan(mimicBankProductOwnedOdds[10]['return-10']);
  });

  it('moves all carried Gold into the bank without counting it as currency spend', () => {
    const initial = createInitialState(0, 77);
    const funded = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gold]: GameNumber.from(12_345).serialize() },
    };
    const beforeSpent = funded.statistics.lifetimeCurrencySpent[ids.currency.gold];
    const result = depositAllGoldToMimicBank(funded);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(GameNumber.deserialize(result.state.currencies[ids.currency.gold]!).toNumber()).toBe(0);
    expect(result.state.gameData.mimicBankGold).toBe(12_345);
    expect(result.state.statistics.lifetimeCurrencySpent[ids.currency.gold]).toEqual(beforeSpent);
  });

  it('withdrawal is deterministic, spends Gem and clears the bank in one roll', () => {
    const makeState = () => {
      const initial = createInitialState(0, 2026);
      return {
        ...initial,
        currencies: {
          ...initial.currencies,
          [ids.currency.gold]: GameNumber.from(10_000).serialize(),
          [ids.currency.gem]: GameNumber.from(100).serialize(),
        },
      };
    };
    const depositA = depositAllGoldToMimicBank(makeState());
    const depositB = depositAllGoldToMimicBank(makeState());
    expect(depositA.accepted && depositB.accepted).toBe(true);
    if (!depositA.accepted || !depositB.accepted) return;
    const a = withdrawMimicBank(depositA.state, 20);
    const b = withdrawMimicBank(depositB.state, 20);
    expect(a.accepted && b.accepted).toBe(true);
    if (!a.accepted || !b.accepted) return;
    expect(a.state.gameData.lastMimicBankResult).toEqual(b.state.gameData.lastMimicBankResult);
    expect(a.state.gameData.mimicBankGold).toBe(0);
    expect(GameNumber.deserialize(a.state.currencies[ids.currency.gem]!).toNumber()).toBe(80);
    const last = a.state.gameData.lastMimicBankResult!;
    expect([0.1, 0.5, 1, 2]).toContain(last.multiplier);
    expect(GameNumber.deserialize(a.state.currencies[ids.currency.gold]!).toNumber()).toBe(last.returnedGold);
    expect(a.state.gameData.mimicBankTotalLostGold).toBe(last.lostGold);
  });

  it('rejects empty withdrawals and restores the new RNG/state fields on old saves', () => {
    const initial = createInitialState(0, 91);
    expect(withdrawMimicBank(initial, 10).accepted).toBe(false);
    const oldLike = {
      ...initial,
      rngStreams: Object.fromEntries(Object.entries(initial.rngStreams).filter(([id]) => id !== ids.rng.mimic)),
      gameData: {
        ...initial.gameData,
        mimicBankGold: undefined,
        mimicBankTotalLostGold: undefined,
        lastMimicBankResult: undefined,
      },
    } as unknown as typeof initial;
    const normalized = normalizeLoadedState(oldLike, 0);
    expect(normalized.rngStreams[ids.rng.mimic]).toBeDefined();
    expect(normalized.gameData.mimicBankGold).toBe(0);
    expect(normalized.gameData.mimicBankTotalLostGold).toBe(0);
    expect(normalized.gameData.lastMimicBankResult).toBeNull();
  });
});

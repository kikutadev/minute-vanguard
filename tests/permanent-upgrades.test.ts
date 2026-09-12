import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import {
  advanceFromWallClock,
  battleCooldown,
  buyPermanentUpgrade,
  cooldownSkipCost,
  createInitialState,
  fight,
  freeCooldownSkipsRemaining,
  skipBattleCooldown,
} from '../plugin/engine';

describe('permanent upgrade reference behavior', () => {
  it('buys the 500 Gem skip upgrade, grants three free skips per JST day, then falls back to Gem cost', () => {
    const beforeMidnightJst = Date.UTC(2026, 0, 1, 14, 59, 50);
    const initial = createInitialState(beforeMidnightJst, 701);
    const funded = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(500).serialize() },
      gameData: { ...initial.gameData, victories: 10 },
    };
    const purchased = buyPermanentUpgrade(funded, 'freeCooldownSkips');
    expect(purchased.accepted).toBe(true);
    if (!purchased.accepted) return;
    expect(GameNumber.deserialize(purchased.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
    expect(freeCooldownSkipsRemaining(purchased.state)).toBe(3);

    let state = purchased.state;
    for (const remaining of [2, 1, 0]) {
      const battle = fight(state);
      expect(battle.accepted).toBe(true);
      if (!battle.accepted) return;
      expect(battleCooldown(battle.state).ready).toBe(false);
      expect(cooldownSkipCost(battle.state)).toBe(0);
      const skipped = skipBattleCooldown(battle.state);
      expect(skipped.accepted).toBe(true);
      if (!skipped.accepted) return;
      state = skipped.state;
      expect(freeCooldownSkipsRemaining(state)).toBe(remaining);
      expect(battleCooldown(state).ready).toBe(true);
    }

    const fourthBattle = fight(state);
    expect(fourthBattle.accepted).toBe(true);
    if (!fourthBattle.accepted) return;
    expect(cooldownSkipCost(fourthBattle.state)).toBeGreaterThan(0);
    const noGems = {
      ...fourthBattle.state,
      currencies: { ...fourthBattle.state.currencies, [ids.currency.gem]: GameNumber.from(0).serialize() },
    };
    const fourthSkip = skipBattleCooldown(noGems);
    expect(fourthSkip.accepted).toBe(false);
    if (fourthSkip.accepted) return;
    expect(fourthSkip.reason).toBe('insufficient-gems');

    const nextJstDay = advanceFromWallClock(fourthBattle.state, beforeMidnightJst + 20_000).state;
    expect(freeCooldownSkipsRemaining(nextJstDay)).toBe(3);
    expect(nextJstDay.gameData.freeCooldownSkipUsage.used).toBe(0);
  });
});

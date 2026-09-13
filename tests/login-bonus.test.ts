import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import {
  advanceFromWallClock,
  claimLoginBonus,
  createInitialState,
  goldBalance,
  loginBonusPreview,
  LOGIN_BONUS_REWARDS,
} from '../plugin/engine';

const DAY = 86_400_000;
const START = Date.UTC(2026, 0, 1, 3, 0, 0); // JST noon, safely away from midnight.

describe('login bonus', () => {
  it('starts at 2,000G, can only be claimed once per JST day, and advances on consecutive days', () => {
    const initial = createInitialState(START, 1401);
    expect(loginBonusPreview(initial)).toMatchObject({ available: true, day: 1, gold: 2_000, gems: 0 });
    const first = claimLoginBonus(initial);
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(goldBalance(first.state)).toBe(2_000);
    expect(loginBonusPreview(first.state).available).toBe(false);
    expect(claimLoginBonus(first.state).accepted).toBe(false);

    const tomorrow = advanceFromWallClock(first.state, START + DAY).state;
    expect(loginBonusPreview(tomorrow)).toMatchObject({ available: true, day: 2, gold: LOGIN_BONUS_REWARDS[1]!.gold });
  });

  it('resets to day 1 when a JST day is missed', () => {
    const first = claimLoginBonus(createInitialState(START, 1402));
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    const afterGap = advanceFromWallClock(first.state, START + DAY * 2).state;
    expect(loginBonusPreview(afterGap)).toMatchObject({ available: true, day: 1, gold: 2_000 });
  });

  it('pays 20,000G + 15 Gem on day 7 and cycles back to day 1 the following day', () => {
    const day7Base = createInitialState(START + DAY * 6, 1404);
    const day7State = {
      ...day7Base,
      gameData: { ...day7Base.gameData, loginBonus: { lastClaimDayKey: '2026-01-06', streakDay: 6 } },
    };
    const preview = loginBonusPreview(day7State);
    expect(preview).toMatchObject({ available: true, day: 7, gold: 20_000, gems: 15 });
    const claimed7 = claimLoginBonus(day7State);
    expect(claimed7.accepted).toBe(true);
    if (!claimed7.accepted) return;
    expect(goldBalance(claimed7.state)).toBe(20_000);
    expect(GameNumber.deserialize(claimed7.state.currencies[ids.currency.gem]!).toNumber()).toBe(15);
    const next = advanceFromWallClock(claimed7.state, START + DAY * 7).state;
    expect(loginBonusPreview(next)).toMatchObject({ available: true, day: 1, gold: 2_000 });
  });

});

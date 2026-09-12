import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import {
  advanceFromWallClock,
  claimDailyMission,
  createInitialState,
  dailyMissions,
} from '../plugin/engine';

describe('solo daily mission rotation', () => {
  it('selects one deterministic mission from each of five categories for the same JST day', () => {
    const left = createInitialState(Date.UTC(2026, 8, 12, 12), 1);
    const right = createInitialState(Date.UTC(2026, 8, 12, 12), 999999);
    const leftMissions = dailyMissions(left);
    const rightMissions = dailyMissions(right);
    expect(leftMissions.map((mission) => mission.id)).toEqual(rightMissions.map((mission) => mission.id));
    expect(leftMissions).toHaveLength(5);
    expect(new Set(leftMissions.map((mission) => mission.category))).toEqual(new Set(['battle', 'result', 'rarity', 'progression', 'collection']));
  });

  it('rotates the mission set at JST midnight and resets all daily counters', () => {
    const beforeMidnight = Date.UTC(2026, 8, 12, 14, 59, 58); // 23:59:58 JST
    const initial = createInitialState(beforeMidnight, 5);
    const before = dailyMissions(initial).map((mission) => mission.id);
    const progressed = {
      ...initial,
      gameData: {
        ...initial.gameData,
        missionProgress: {
          ...initial.gameData.missionProgress,
          battles: 9,
          wins: 5,
          upgrades: 2,
          claimed: [before[0]!],
        },
      },
    };
    const next = advanceFromWallClock(progressed, beforeMidnight + 4_000).state;
    expect(next.gameData.missionProgress.dayKey).not.toBe(initial.gameData.missionProgress.dayKey);
    expect(next.gameData.missionProgress.battles).toBe(0);
    expect(next.gameData.missionProgress.wins).toBe(0);
    expect(next.gameData.missionProgress.claimed).toEqual([]);
    expect(dailyMissions(next).map((mission) => mission.id)).not.toEqual(before);
  });

  it('pays 3/3/4/5/5 gems by completed count for a 20-gem daily total', () => {
    const initial = createInitialState(Date.UTC(2026, 8, 12, 12), 9);
    let state: MinuteVanguardState = {
      ...initial,
      gameData: {
        ...initial.gameData,
        missionProgress: {
          ...initial.gameData.missionProgress,
          battles: 999,
          wins: 999,
          upgrades: 999,
          heals: 999,
          levelUps: 999,
          equipmentBuys: 999,
          discoveries: 999,
          maxStreak: 999,
          rarityWins: { common: 999, uncommon: 999, rare: 999, epic: 999, legendary: 999, boss: 999 },
        },
      },
    };
    const expectedTotals = [3, 6, 10, 15, 20];
    for (const [index, mission] of dailyMissions(state).entries()) {
      const result = claimDailyMission(state, mission.id);
      expect(result.accepted).toBe(true);
      if (!result.accepted) return;
      state = result.state;
      expect(GameNumber.deserialize(state.currencies[ids.currency.gem]!).toNumber()).toBe(expectedTotals[index]);
    }
  });
});

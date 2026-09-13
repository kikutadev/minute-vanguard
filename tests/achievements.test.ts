import { describe, expect, it } from 'vitest';
import { enemies } from '../definitions/game-definitions';
import { soloAchievementDefinitions } from '../definitions/achievement-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import { advanceFromWallClock, applyArenaSeasonReward, clearNewAchievementFlags, createInitialState, evaluateSoloAchievements, recordArenaTierReached, selectAchievementTitle, soloAchievementProgress } from '../plugin/engine';

describe('solo achievement titles', () => {
  it('ships 115 meaningful persistent achievement definitions', () => {
    expect(soloAchievementDefinitions).toHaveLength(115);
    expect(new Set(soloAchievementDefinitions.map((definition) => definition.id)).size).toBe(115);
    expect(soloAchievementDefinitions.every((definition) => definition.rewards.length === 0)).toBe(true);
  });

  it('evaluates product metrics through the Kit achievement carrier and records NEW ids once', () => {
    const initial = createInitialState(0, 1201);
    const discovered = enemies.slice(0, 50).map((enemy) => enemy.id);
    const prepared: MinuteVanguardState = {
      ...initial,
      gameData: {
        ...initial.gameData,
        totalBattles: 100,
        victories: 50,
        discoveredEnemyIds: discovered,
        player: { ...initial.gameData.player, level: 30, totalJobChanges: 5 },
      },
    };
    const evaluated = evaluateSoloAchievements(prepared);
    expect(evaluated.state.achievements['achievement.battles.100']).toBe(true);
    expect(evaluated.state.achievements['achievement.wins.50']).toBe(true);
    expect(evaluated.state.achievements['achievement.discoveries.50']).toBe(true);
    expect(evaluated.state.achievements['achievement.playerLevel.30']).toBe(true);
    expect(evaluated.state.achievements['achievement.jobChanges.5']).toBe(true);
    expect(evaluated.state.gameData.newAchievementIds.length).toBeGreaterThan(0);

    const repeated = evaluateSoloAchievements(evaluated.state);
    expect(repeated.events).toHaveLength(0);
    expect(repeated.state.gameData.newAchievementIds).toEqual(evaluated.state.gameData.newAchievementIds);
  });

  it('projects progress and clears only presentation NEW flags, not earned history', () => {
    const initial = createInitialState(0, 1202);
    const prepared = { ...initial, gameData: { ...initial.gameData, totalBattles: 7 } };
    const definition = soloAchievementDefinitions.find((candidate) => candidate.id === 'achievement.battles.10')!;
    expect(soloAchievementProgress(prepared, definition)).toMatchObject({ current: 7, ratio: 0.7, completed: false });

    const evaluated = evaluateSoloAchievements({ ...prepared, gameData: { ...prepared.gameData, totalBattles: 10 } }).state;
    const cleared = clearNewAchievementFlags(evaluated);
    expect(cleared.gameData.newAchievementIds).toHaveLength(0);
    expect(cleared.achievements['achievement.battles.10']).toBe(true);
    const regressed = { ...cleared, gameData: { ...cleared.gameData, totalBattles: 0 } };
    expect(soloAchievementProgress(regressed, definition)).toMatchObject({ current: 10, ratio: 1, completed: true });
  });

  it('selects exactly one earned title for profile display and rejects locked titles', () => {
    const initial = createInitialState(0, 1204);
    expect(selectAchievementTitle(initial, 'achievement.wins.1')).toMatchObject({ accepted: false, reason: 'not-earned' });
    const earned = evaluateSoloAchievements({ ...initial, gameData: { ...initial.gameData, victories: 1 } }).state;
    const selected = selectAchievementTitle(earned, 'achievement.wins.1');
    expect(selected.accepted).toBe(true);
    if (!selected.accepted) return;
    expect(selected.state.gameData.selectedAchievementId).toBe('achievement.wins.1');
    const cleared = selectAchievementTitle(selected.state, null);
    expect(cleared.accepted).toBe(true);
    if (!cleared.accepted) return;
    expect(cleared.state.gameData.selectedAchievementId).toBeNull();
  });


  it('records server-attested Arena tier achievements and never regresses them', () => {
    const initial = createInitialState(0, 1205);
    const bronze = recordArenaTierReached(initial, 'bronze');
    expect(bronze.accepted).toBe(true);
    if (!bronze.accepted) return;
    expect(bronze.state.gameData.arenaBestTierRank).toBe(2);
    expect(bronze.state.achievements['achievement.arenaTier.iron']).toBe(true);
    expect(bronze.state.achievements['achievement.arenaTier.bronze']).toBe(true);
    expect(bronze.state.achievements['achievement.arenaTier.silver']).not.toBe(true);
    const lower = recordArenaTierReached(bronze.state, 'iron');
    expect(lower.accepted).toBe(true);
    if (!lower.accepted) return;
    expect(lower.state.gameData.arenaBestTierRank).toBe(2);
  });

  it('unlocks the original weekly champion title only from a champion season receipt', () => {
    const initial = createInitialState(0, 1206);
    const result = applyArenaSeasonReward(initial, {
      receiptId: 'champion-receipt', seasonKey: '2026-09-07', tierId: 'master', gold: 1, gems: 1,
      grantsMasterToken: true, champion: true,
    });
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.arenaBestTierRank).toBe(10);
    expect(result.state.gameData.arenaChampionships).toBe(1);
    expect(result.state.achievements['achievement.arenaTier.master']).toBe(true);
    expect(result.state.achievements['achievement.arenaChampion.1']).toBe(true);
  });

  it('runs achievement evaluation during the normal wall-clock tick even with no elapsed second', () => {
    const initial = createInitialState(1_000, 1203);
    const prepared = { ...initial, gameData: { ...initial.gameData, victories: 10 } };
    const advanced = advanceFromWallClock(prepared, 1_000);
    expect(advanced.state.achievements['achievement.wins.10']).toBe(true);
  });
});

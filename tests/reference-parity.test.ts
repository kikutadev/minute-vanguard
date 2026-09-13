import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { battleCooldownDefinition, enemies, ids, jobs, loadoutDefinition, orbRanks } from '../definitions/game-definitions';
import { hero60Reference } from '../reference/hero60-reference-contract';
import {
  ARENA_COOLDOWN_MS, ARENA_DAILY_WIN_LIMIT, ARENA_DEFENSE_BARRIER_MS, ARENA_START_RATING, ARENA_TIERS,
  arenaAttackSeasonScore, arenaDefenseSeasonScore, arenaRatingDeltas, arenaWeekendMultiplier, arenaPetAttackRate, arenaDodgeChance,
} from '../application/arena-domain';
import {
  activateRareGuarantee,
  advanceFromWallClock,
  battleCooldown,
  canSkipBattleCooldown,
  changeJob,
  createInitialState,
  drawOrb,
  fight,
  purchaseTimeBoost,
  timeBoostRemainingSec,
} from '../plugin/engine';

describe('public reference parity locks', () => {
  it('locks the battle cadence, turn model and six-stat shape we intentionally benchmark', () => {
    expect(battleCooldownDefinition.durationSec).toBe(hero60Reference.battle.normalCooldownSec);
    expect(Object.keys(createInitialState(0).gameData.player.baseStats)).toEqual(hero60Reference.progression.stats);
  });

  it('locks the nine post-adventurer jobs and three equipment slots', () => {
    expect(jobs.filter((job) => job.id !== 'job.adventurer')).toHaveLength(hero60Reference.progression.jobs);
    expect(loadoutDefinition.slots.map((slot) => slot.id)).toEqual(['weapon', 'armor', 'orb']);
  });

  it('locks the current thirteen-level, 650-monster normal codex density', () => {
    expect(enemies).toHaveLength(hero60Reference.monsters.total);
    expect(new Set(enemies.map((enemy) => enemy.monsterLevel)).size).toBe(hero60Reference.monsters.levels);
    for (let level = 1; level <= hero60Reference.monsters.levels; level += 1) {
      expect(enemies.filter((enemy) => enemy.monsterLevel === level)).toHaveLength(hero60Reference.monsters.perLevel);
    }
  });

  it('locks the public orb rank order and 10-pull price/guarantee behavior', () => {
    expect(orbRanks).toEqual(hero60Reference.orb.ranks);
    const initial = createInitialState(0, 331);
    const funded = {
      ...initial,
      currencies: {
        ...initial.currencies,
        [ids.currency.gem]: GameNumber.from(hero60Reference.orb.gachaTenCost).serialize(),
      },
    };
    const result = drawOrb(funded, 10);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(GameNumber.deserialize(result.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
    const orbs = Object.values(result.state.gameData.inventory).filter((item) => item.data?.kind === 'orb');
    expect(orbs).toHaveLength(10);
    expect(orbs.some((item) => item.data?.orbRank !== undefined && orbRanks.indexOf(item.data.orbRank) >= orbRanks.indexOf('A'))).toBe(true);
    expect(orbs.some((item) => item.data?.effectId !== undefined)).toBe(true);
  });

  it('does not allow gem skip during a successful beginner five-second cooldown', () => {
    const initial = createInitialState(0, 1234);
    const result = fight(initial);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.lastBattle?.outcome).toBe('victory');
    expect(battleCooldown(result.state).remainingSec).toBe(hero60Reference.battle.beginnerCooldownSec);
    expect(canSkipBattleCooldown(result.state)).toBe(false);
  });

  it('restores normal skip semantics after a beginner defeat because that wait is 60 seconds', () => {
    const initial = createInitialState(0, 222);
    const weak = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(10).serialize() },
      gameData: {
        ...initial.gameData,
        player: {
          ...initial.gameData.player,
          currentHp: 1,
          baseStats: { ...initial.gameData.player.baseStats, attack: 0, magicAttack: 0 },
        },
      },
    };
    const result = fight(weak);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.lastBattle?.outcome).toBe('defeat');
    expect(battleCooldown(result.state).remainingSec).toBe(hero60Reference.battle.beginnerDefeatCooldownSec);
    expect(canSkipBattleCooldown(result.state)).toBe(true);
  });

  it('locks rare guarantee cost and job-change threshold through public commands', () => {
    const initial = createInitialState(0, 1);
    const withGems = { ...initial, currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(10).serialize() } };
    const rare = activateRareGuarantee(withGems);
    expect(rare.accepted).toBe(true);
    if (rare.accepted) expect(GameNumber.deserialize(rare.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);

    const level29 = { ...initial, gameData: { ...initial.gameData, player: { ...initial.gameData.player, level: 29 } } };
    expect(changeJob(level29, 'job.warrior').accepted).toBe(false);
  });

  it('keeps wall-clock advancement authoritative instead of UI countdown state', () => {
    const initial = createInitialState(1_000, 1234);
    const result = fight(initial);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const advanced = advanceFromWallClock(result.state, result.state.lastWallClockMs + hero60Reference.battle.beginnerCooldownSec * 1_000).state;
    expect(battleCooldown(advanced).ready).toBe(true);
  });

  it('locks the current public Arena cadence, daily guard and tier thresholds', () => {
    expect(ARENA_START_RATING).toBe(hero60Reference.arena.initialRating);
    expect(ARENA_COOLDOWN_MS / 1_000).toBe(hero60Reference.arena.fixedCooldownSec);
    expect(ARENA_DAILY_WIN_LIMIT).toBe(hero60Reference.arena.sameOpponentWinsPerJstDay);
    expect(ARENA_DEFENSE_BARRIER_MS / 1_000).toBe(hero60Reference.arena.defenseBarrierSec);
    expect(ARENA_TIERS.map((tier) => tier.threshold)).toEqual(hero60Reference.arena.tierThresholds);
  });

  it('locks public Arena score boundaries while leaving the hidden rating formula product-owned', () => {
    const weekday = Date.parse('2026-09-10T03:00:00Z');
    const weekend = Date.parse('2026-09-11T03:00:00Z');
    expect(arenaAttackSeasonScore(100, 'win', weekday)).toBe(hero60Reference.arena.attackerWinScoreMin);
    expect(arenaAttackSeasonScore(9_999, 'win', weekday)).toBe(hero60Reference.arena.attackerWinScoreMax);
    expect(arenaAttackSeasonScore(1_000, 'loss', weekday)).toBe(hero60Reference.arena.attackerLossOrDrawScore);
    expect(arenaWeekendMultiplier(weekend)).toBe(hero60Reference.arena.weekendScoreMultiplier);
    expect(arenaDefenseSeasonScore(1_500, weekday)).toBe(5);
    expect(arenaRatingDeltas(1_000, 1_700, 'win')).toEqual({ attacker: 0, defender: 0 });
    expect(hero60Reference.arena.exactRatingFormulaPublic).toBe(false);
    expect(arenaPetAttackRate('job.tamer', 1)).toBeCloseTo((0.25 + hero60Reference.arena.pets.tamerBonusPoints / 100) * hero60Reference.arena.pets.tamerSecondMultiplier);
    expect(arenaDodgeChance('job.ninja', 0)).toBeCloseTo(hero60Reference.arena.pets.ninjaDodge);
    expect(arenaDodgeChance('job.wraith', 0)).toBeCloseTo(hero60Reference.arena.pets.wraithDodge);
  });
});

import {
  combineOrb,
  discardItem,
  expandOrbCapacity,
  orbFreeSlots,
  rerollOrbStats,
  toggleOrbFavorite,
  toggleOrbLock,
} from '../plugin/engine';
import type { EquipmentData, MinuteVanguardState, StatValues } from '../definitions/types';

function testOrb(id: string, overrides: Partial<EquipmentData> = {}) {
  const stats: StatValues = { hp: 4, attack: 3, defense: 2, magicAttack: 1, magicDefense: 0, luck: 0 };
  return {
    instanceId: id,
    definitionId: ids.item.orb,
    quantity: 1,
    data: {
      kind: 'orb' as const,
      rarity: 'common' as const,
      upgradeRank: 0,
      flatStats: {},
      percentStats: stats,
      orbRank: 'F' as const,
      effectId: 'critical' as const,
      effectValue: 5,
      effectLevel: 1,
      favorite: false,
      locked: false,
      source: 'test',
      ...overrides,
    },
  };
}

function withTestOrbs(idsForOrbs: readonly string[]): MinuteVanguardState {
  const initial = createInitialState(0, 404);
  const inventory = Object.fromEntries(idsForOrbs.map((id) => [id, testOrb(id)]));
  return {
    ...initial,
    currencies: {
      ...initial.currencies,
      [ids.currency.gold]: GameNumber.from(30_000).serialize(),
      [ids.currency.gem]: GameNumber.from(1_200).serialize(),
    },
    gameData: { ...initial.gameData, inventory },
  };
}

describe('time boost reference parity', () => {
  it('rejects Rush during the beginner five-second cadence', () => {
    const initial = createInitialState(0, 609);
    const funded = { ...initial, currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(30).serialize() } };
    const result = purchaseTimeBoost(funded, 'rush', 180);
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).toBe('beginner-fast-cooldown');
  });

  it('accepts every current 3/10/30 minute public duration at its exact Gem price', () => {
    for (const option of hero60Reference.timeBoosts.durations) {
      const initial = createInitialState(0, 612 + option.durationSec);
      const prepared = {
        ...initial,
        currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(option.gemCost).serialize() },
        gameData: { ...initial.gameData, victories: 10 },
      };
      const result = purchaseTimeBoost(prepared, 'exp', option.durationSec);
      expect(result.accepted).toBe(true);
      if (!result.accepted) continue;
      expect(GameNumber.deserialize(result.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
      expect(timeBoostRemainingSec(result.state, 'exp')).toBe(option.durationSec);
    }
  });

  it('locks 3/10/30 minute pricing and gives Rush a 10-second cooldown without skip', () => {
    const initial = createInitialState(0, 610);
    const prepared = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(30).serialize() },
      gameData: { ...initial.gameData, victories: 10 },
    };
    const rush = purchaseTimeBoost(prepared, 'rush', 180);
    expect(rush.accepted).toBe(true);
    if (!rush.accepted) return;
    expect(GameNumber.deserialize(rush.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
    expect(timeBoostRemainingSec(rush.state, 'rush')).toBe(180);
    expect(purchaseTimeBoost(rush.state, 'rush', 600).accepted).toBe(false);
    const battle = fight(rush.state);
    expect(battle.accepted).toBe(true);
    if (!battle.accepted) return;
    expect(battleCooldown(battle.state).remainingSec).toBe(hero60Reference.timeBoosts.rushCooldownSec);
    expect(canSkipBattleCooldown(battle.state)).toBe(false);
  });

  it('doubles both Gold and EXP without changing encounter RNG', () => {
    const initial = createInitialState(0, 611);
    const strong = {
      ...initial,
      gameData: {
        ...initial.gameData,
        victories: 10,
        player: {
          ...initial.gameData.player,
          currentHp: 2_000,
          baseStats: { hp: 2_000, attack: 1_000, defense: 1_000, magicAttack: 1_000, magicDefense: 1_000, luck: 10 },
        },
      },
    };
    const base = fight(strong);
    expect(base.accepted).toBe(true);
    const funded = { ...strong, currencies: { ...strong.currencies, [ids.currency.gem]: GameNumber.from(60).serialize() } };
    const exp = purchaseTimeBoost(funded, 'exp', 180);
    expect(exp.accepted).toBe(true);
    if (!exp.accepted || !base.accepted) return;
    const gold = purchaseTimeBoost(exp.state, 'gold', 180);
    expect(gold.accepted).toBe(true);
    if (!gold.accepted) return;
    const boosted = fight(gold.state);
    expect(boosted.accepted).toBe(true);
    if (!boosted.accepted) return;
    expect(boosted.state.gameData.lastBattle?.enemyId).toBe(base.state.gameData.lastBattle?.enemyId);
    expect(boosted.state.gameData.lastBattle?.goldDelta).toBe((base.state.gameData.lastBattle?.goldDelta ?? 0) * 2);
    expect(boosted.state.gameData.lastBattle?.expGained).toBe((base.state.gameData.lastBattle?.expGained ?? 0) * 2);
  });
});

describe('orb management reference parity', () => {
  it('enforces the 10-slot base capacity and 100-gem one-slot expansion', () => {
    const initial = createInitialState(0, 501);
    const funded = { ...initial, currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(1_100).serialize() } };
    const ten = drawOrb(funded, 10);
    expect(ten.accepted).toBe(true);
    if (!ten.accepted) return;
    expect(orbFreeSlots(ten.state)).toBe(0);
    const blocked = drawOrb(ten.state, 1);
    expect(blocked.accepted).toBe(false);
    if (blocked.accepted) return;
    expect(blocked.reason).toBe('insufficient-orb-slots');
    const expanded = expandOrbCapacity(blocked.state);
    expect(expanded.accepted).toBe(true);
    if (!expanded.accepted) return;
    expect(expanded.state.gameData.orbCapacity).toBe(11);
    expect(orbFreeSlots(expanded.state)).toBe(1);
    expect(GameNumber.deserialize(expanded.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
  });

  it('rerolls allocation while preserving total percent and up to three locked values', () => {
    const state = withTestOrbs(['orb.parent']);
    const before = state.gameData.inventory['orb.parent']!.data!.percentStats!;
    const totalBefore = Object.values(before).reduce((sum, value) => sum + (value ?? 0), 0);
    const result = rerollOrbStats(state, 'orb.parent', ['hp', 'attack']);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const after = result.state.gameData.inventory['orb.parent']!.data!.percentStats!;
    expect(after.hp).toBe(before.hp);
    expect(after.attack).toBe(before.attack);
    expect(Object.values(after).reduce((sum, value) => sum + (value ?? 0), 0)).toBe(totalBefore);
    expect(GameNumber.deserialize(result.state.currencies[ids.currency.gem]!).toNumber()).toBe(1_000);
  });

  it('combines an equipped/protected parent, consumes four same-rank materials, and retains the parent ID', () => {
    let state = withTestOrbs(['orb.parent', 'orb.m1', 'orb.m2', 'orb.m3', 'orb.m4']);
    state = {
      ...state,
      gameData: {
        ...state.gameData,
        inventory: {
          ...state.gameData.inventory,
          'orb.parent': testOrb('orb.parent', { favorite: true, locked: true }),
        },
        loadout: {
          ...state.gameData.loadout,
          equipped: { ...state.gameData.loadout.equipped, orb: 'orb.parent' },
        },
      },
    };
    const result = combineOrb(state, 'orb.parent', ['orb.m1', 'orb.m2', 'orb.m3', 'orb.m4']);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.loadout.equipped.orb).toBe('orb.parent');
    const parent = result.state.gameData.inventory['orb.parent']?.data;
    expect(parent?.orbRank).toBe('E');
    expect(parent?.favorite).toBe(true);
    expect(parent?.locked).toBe(true);
    expect(result.state.gameData.inventory['orb.m1']).toBeUndefined();
    expect(Object.keys(result.state.gameData.inventory)).toEqual(['orb.parent']);
    expect(GameNumber.deserialize(result.state.currencies[ids.currency.gold]!).toNumber()).toBe(0);
  });

  it('prevents equipped, locked, or favorite orbs from being combine materials', () => {
    let state = withTestOrbs(['orb.parent', 'orb.m1', 'orb.m2', 'orb.m3', 'orb.m4']);
    state = {
      ...state,
      gameData: {
        ...state.gameData,
        inventory: { ...state.gameData.inventory, 'orb.m1': testOrb('orb.m1', { favorite: true }) },
      },
    };
    const result = combineOrb(state, 'orb.parent', ['orb.m1', 'orb.m2', 'orb.m3', 'orb.m4']);
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).toBe('protected-material');
  });

  it('favorite and lock independently protect an orb from discard', () => {
    let state = withTestOrbs(['orb.parent']);
    const favorite = toggleOrbFavorite(state, 'orb.parent');
    expect(favorite.accepted).toBe(true);
    if (!favorite.accepted) return;
    state = favorite.state;
    expect(discardItem(state, 'orb.parent').accepted).toBe(false);
    const unFavorite = toggleOrbFavorite(state, 'orb.parent');
    expect(unFavorite.accepted).toBe(true);
    if (!unFavorite.accepted) return;
    const locked = toggleOrbLock(unFavorite.state, 'orb.parent');
    expect(locked.accepted).toBe(true);
    if (!locked.accepted) return;
    expect(discardItem(locked.state, 'orb.parent').accepted).toBe(false);
  });
});

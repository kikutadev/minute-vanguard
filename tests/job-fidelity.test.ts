import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids, jobs } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';
import {
  buyEquipment,
  changeJob,
  createInitialState,
  currentJobBonusRequirement,
  gamblerExpectedMultiplier,
  gamblerMultiplier,
  levelGrowthMultiplier,
  ninjaExecuteChance,
  playerAttackType,
  playerCombatStats,
} from '../plugin/engine';

function withGold(amount = 10_000_000): MinuteVanguardState {
  const state = createInitialState(0, 700);
  return {
    ...state,
    currencies: { ...state.currencies, [ids.currency.gold]: GameNumber.from(amount).serialize() },
  };
}

describe('current job fidelity', () => {
  it('uses the current seven Gambler multipliers with an approximately 3.2x product expectation', () => {
    expect([
      gamblerMultiplier(0), gamblerMultiplier(.02), gamblerMultiplier(.08), gamblerMultiplier(.20),
      gamblerMultiplier(.30), gamblerMultiplier(.60), gamblerMultiplier(.90),
    ]).toEqual([100, 20, 8, 3, 1, .5, .2]);
    expect(gamblerExpectedMultiplier).toBeGreaterThan(3.15);
    expect(gamblerExpectedMultiplier).toBeLessThan(3.25);
  });

  it('caps Ninja assassination at 15%', () => {
    expect(ninjaExecuteChance(0)).toBe(0);
    expect(ninjaExecuteChance(60)).toBeCloseTo(0.05);
    expect(ninjaExecuteChance(10_000)).toBe(0.15);
    expect(ninjaExecuteChance(10_000, 0.5)).toBe(0);
    expect(ninjaExecuteChance(10_000, 0.75)).toBeCloseTo(0.075);
    expect(ninjaExecuteChance(10_000, 1)).toBe(0.15);
  });

  it('uses a staff to switch Tamer attacks to magic, while no weapon stays physical', () => {
    const initial = withGold();
    const tamer = {
      ...initial,
      gameData: {
        ...initial.gameData,
        player: { ...initial.gameData.player, jobId: 'job.tamer', petCount: 10 },
      },
    };
    expect(playerAttackType(tamer)).toBe('physical');
    const sword = buyEquipment(tamer, ids.item.ironSword);
    expect(sword.accepted).toBe(true);
    if (!sword.accepted) return;
    expect(playerAttackType(sword.state)).toBe('physical');
    const staff = buyEquipment(sword.state, ids.item.arcaneRod);
    expect(staff.accepted).toBe(true);
    if (!staff.accepted) return;
    expect(playerAttackType(staff.state)).toBe('magic');
  });

  it('rejects an explicitly requested locked job instead of silently choosing another job', () => {
    const initial = withGold();
    const prepared = { ...initial, gameData: { ...initial.gameData, player: { ...initial.gameData.player, level: 30 } } };
    const result = changeJob(prepared, 'job.wraith');
    expect(result.accepted).toBe(false);
    if (result.accepted) return;
    expect(result.reason).toBe('job-locked');
    expect(result.state.gameData.player.jobId).toBe('job.adventurer');
  });

  it('grows Wraith only in HP and MAT', () => {
    const wraith = jobs.find((job) => job.id === 'job.wraith')!;
    expect(wraith.growth).toEqual({ hp: 7, attack: 0, defense: 0, magicAttack: 6, magicDefense: 0, luck: 0 });
  });

  it('clears all equipment when becoming Wraith and ignores manually retained equipment stats', () => {
    let state = withGold();
    const bought = buyEquipment(state, ids.item.ironSword);
    expect(bought.accepted).toBe(true);
    if (!bought.accepted) return;
    state = bought.state;
    const attackWithWeapon = playerCombatStats(state).attack;
    expect(attackWithWeapon).toBeGreaterThan(state.gameData.player.baseStats.attack);

    const prepared = {
      ...state,
      gameData: {
        ...state.gameData,
        player: { ...state.gameData.player, level: 30, totalJobChanges: 10 },
      },
    };
    const changed = changeJob(prepared, 'job.wraith');
    expect(changed.accepted).toBe(true);
    if (!changed.accepted) return;
    expect(Object.values(changed.state.gameData.loadout.equipped).every((id) => id == null)).toBe(true);

    const manuallyRetained = {
      ...changed.state,
      gameData: { ...changed.state.gameData, loadout: state.gameData.loadout },
    };
    expect(playerCombatStats(manuallyRetained).attack).toBe(manuallyRetained.gameData.player.baseStats.attack);
  });

  it('trims the second active pet when changing away from Tamer', () => {
    const initial = withGold();
    const prepared = {
      ...initial,
      gameData: {
        ...initial.gameData,
        player: { ...initial.gameData.player, level: 30, jobId: 'job.tamer', petCount: 2 },
        ownedPetEnemyIds: ['enemy.pebble', 'enemy.alarm'],
        activePetEnemyIds: ['enemy.pebble', 'enemy.alarm'],
      },
    };
    const changed = changeJob(prepared, 'job.warrior');
    expect(changed.accepted).toBe(true);
    if (!changed.accepted) return;
    expect(changed.state.gameData.activePetEnemyIds).toEqual(['enemy.pebble']);
  });

  it('escalates the fourth-plus permanent-bonus requirement after 300 total successful bonuses', () => {
    const initial = createInitialState(0, 701);
    const requirement = (warriorCount: number, otherCount: number) => currentJobBonusRequirement({
      ...initial,
      gameData: {
        ...initial.gameData,
        player: {
          ...initial.gameData.player,
          jobId: 'job.warrior',
          jobBonusCounts: { 'job.warrior': warriorCount, 'job.mage': otherCount },
        },
      },
    });
    expect(requirement(0, 500)).toBe(30);
    expect(requirement(1, 500)).toBe(50);
    expect(requirement(2, 500)).toBe(100);
    expect(requirement(3, 296)).toBe(200); // 299 total
    expect(requirement(3, 297)).toBe(210); // 301st award is next
    expect(requirement(3, 298)).toBe(220);
  });

  it('adds one percent level-growth bonus for every owned pet', () => {
    const initial = createInitialState(0, 702);
    const prepared = {
      ...initial,
      gameData: {
        ...initial.gameData,
        player: { ...initial.gameData.player, growthBonusPct: 5 },
        ownedPetEnemyIds: Array.from({ length: 10 }, (_, i) => `pet.${i}`),
      },
    };
    expect(levelGrowthMultiplier(prepared)).toBeCloseTo(1.15);
  });
});

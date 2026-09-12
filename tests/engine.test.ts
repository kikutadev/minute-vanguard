import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids, orbRanks, rarityOrder } from '../definitions/game-definitions';
import {
  activateRareGuarantee,
  advanceFromWallClock,
  battleCooldown,
  buyEquipment,
  changeJob,
  claimDailyMission,
  createInitialState,
  drawOrb,
  fight,
  setActivePet,
} from '../plugin/engine';
import { simulateBattles } from '../simulator/progression';

describe('Minute Vanguard / Hero60-style vertical slice', () => {
  it('uses five-second cooldown during the first ten successful defeats', () => {
    const initial = createInitialState(1_000, 1234);
    const first = fight(initial);
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(first.state.gameData.lastBattle?.outcome).toBe('victory');
    expect(first.state.gameData.victories).toBe(1);
    expect(battleCooldown(first.state).remainingSec).toBe(5);

    const blocked = fight(first.state);
    expect(blocked.accepted).toBe(false);
    if (blocked.accepted) return;
    expect(blocked.reason).toBe('cooldown-active');
    expect(blocked.state).toBe(first.state);

    const advanced = advanceFromWallClock(first.state, first.state.lastWallClockMs + 5_000).state;
    expect(battleCooldown(advanced).ready).toBe(true);
  });

  it('uses the normal 60-second wait after a beginner defeat and halves carried Gold', () => {
    const initial = createInitialState(0, 222);
    const weak = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gold]: GameNumber.from(100).serialize() },
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
    expect(result.state.gameData.player.currentHp).toBe(1);
    expect(GameNumber.deserialize(result.state.currencies[ids.currency.gold]!).toNumber()).toBe(50);
    expect(battleCooldown(result.state).remainingSec).toBe(60);
  });

  it('is deterministic for the same seed, state and command sequence', () => {
    const left = fight(createInitialState(0, 991));
    const right = fight(createInitialState(0, 991));
    expect(left.accepted).toBe(true);
    expect(right.accepted).toBe(true);
    if (!left.accepted || !right.accepted) return;
    expect(left.state.gameData.lastBattle).toEqual(right.state.gameData.lastBattle);
    expect(left.state.rngStreams).toEqual(right.state.rngStreams);
  });

  it('buys equipment inside the equipment system and auto-equips the purchase', () => {
    const initial = createInitialState(0, 77);
    const funded = { ...initial, currencies: { ...initial.currencies, [ids.currency.gold]: GameNumber.from(100).serialize() } };
    const bought = buyEquipment(funded, ids.item.trainingSword);
    expect(bought.accepted).toBe(true);
    if (!bought.accepted) return;
    const equippedId = bought.state.gameData.loadout.equipped.weapon;
    expect(equippedId).toBeTruthy();
    if (!equippedId) return;
    expect(bought.state.gameData.inventory[equippedId]?.definitionId).toBe(ids.item.trainingSword);
  });

  it('10-pull orb gacha costs 1,000 gems and guarantees at least one A-or-higher orb', () => {
    const initial = createInitialState(0, 88);
    const funded = { ...initial, currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(1_000).serialize() } };
    const result = drawOrb(funded, 10);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    const orbs = Object.values(result.state.gameData.inventory).filter((item) => item.data?.kind === 'orb');
    expect(orbs).toHaveLength(10);
    expect(orbs.some((item) => item.data?.orbRank !== undefined && orbRanks.indexOf(item.data.orbRank) >= orbRanks.indexOf('A'))).toBe(true);
    expect(GameNumber.deserialize(result.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
  });

  it('rare guarantee consumes 10 gems and constrains the next encounter to rare or above', () => {
    const initial = createInitialState(0, 99);
    const funded = { ...initial, currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(10).serialize() } };
    const activated = activateRareGuarantee(funded);
    expect(activated.accepted).toBe(true);
    if (!activated.accepted) return;
    const battle = fight(activated.state);
    expect(battle.accepted).toBe(true);
    if (!battle.accepted) return;
    const rarity = battle.state.gameData.lastBattle?.enemyRarity;
    expect(rarity).toBeDefined();
    if (rarity === undefined) return;
    expect(rarityOrder.indexOf(rarity)).toBeGreaterThanOrEqual(rarityOrder.indexOf('rare'));
    expect(battle.state.gameData.rareGuaranteeActive).toBe(false);
  });

  it('job change requires level 30, charges first-job cost, and applies the first permanent bonus', () => {
    const initial = createInitialState(0, 44);
    const prepared = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gold]: GameNumber.from(30_000).serialize() },
      gameData: { ...initial.gameData, player: { ...initial.gameData.player, level: 30 } },
    };
    const changed = changeJob(prepared, 'job.warrior');
    expect(changed.accepted).toBe(true);
    if (!changed.accepted) return;
    expect(changed.state.gameData.player.level).toBe(1);
    expect(changed.state.gameData.player.jobId).toBe('job.warrior');
    expect(changed.state.gameData.player.totalJobChanges).toBe(1);
    expect(changed.state.gameData.player.permanentStats.hp).toBe(100);
    expect(changed.state.gameData.player.growthBonusPct).toBe(5);
    expect(GameNumber.deserialize(changed.state.currencies[ids.currency.gold]!).toNumber()).toBe(0);
  });

  it('claims completed daily missions once and resets progress at JST midnight', () => {
    const initial = createInitialState(0, 55);
    const completed = {
      ...initial,
      gameData: {
        ...initial.gameData,
        missionProgress: { ...initial.gameData.missionProgress, battles: 3 },
      },
    };
    const claimed = claimDailyMission(completed, 'battles');
    expect(claimed.accepted).toBe(true);
    if (!claimed.accepted) return;
    expect(GameNumber.deserialize(claimed.state.currencies[ids.currency.gem]!).toNumber()).toBe(3);
    expect(claimed.state.gameData.missionProgress.claimed).toContain('battles');
    const duplicate = claimDailyMission(claimed.state, 'battles');
    expect(duplicate.accepted).toBe(false);

    const nextDay = advanceFromWallClock(claimed.state, 24 * 60 * 60 * 1_000 + 1).state;
    expect(nextDay.gameData.missionProgress.battles).toBe(0);
    expect(nextDay.gameData.missionProgress.claimed).toEqual([]);
  });

  it('allows one active pet normally and two only for the tamer', () => {
    const initial = createInitialState(0, 56);
    const owned = {
      ...initial,
      gameData: {
        ...initial.gameData,
        ownedPetEnemyIds: ['enemy.pebble', 'enemy.alarm'],
        player: { ...initial.gameData.player, petCount: 2 },
      },
    };
    const first = setActivePet(owned, 'enemy.pebble', true);
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    const blocked = setActivePet(first.state, 'enemy.alarm', true);
    expect(blocked.accepted).toBe(false);
    if (blocked.accepted) return;
    expect(blocked.reason).toBe('party-full');

    const tamer = {
      ...first.state,
      gameData: { ...first.state.gameData, player: { ...first.state.gameData.player, jobId: 'job.tamer' } },
    };
    const second = setActivePet(tamer, 'enemy.alarm', true);
    expect(second.accepted).toBe(true);
    if (!second.accepted) return;
    expect(second.state.gameData.activePetEnemyIds).toEqual(['enemy.pebble', 'enemy.alarm']);
  });

  it('same-core simulator resolves battles without UI timers', () => {
    const summary = simulateBattles(12, 2026);
    expect(summary.battles).toBe(12);
    expect(summary.victories + summary.draws + summary.defeats).toBe(12);
    expect(summary.elapsedSec).toBeGreaterThan(0);
  });
});

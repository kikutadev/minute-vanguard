import { describe, expect, it } from 'vitest';
import {
  ARENA_COOLDOWN_MS,
  ARENA_DEFAULT_LOADOUT,
  ARENA_GEAR,
  ARENA_DAILY_WIN_LIMIT,
  ARENA_DEFENSE_BARRIER_MS,
  ARENA_MAX_TURNS,
  ARENA_COMBAT_VERSION,
  ARENA_DEFAULT_PETS,
  arenaAttackSeasonScore,
  arenaDodgeChance,
  arenaPetAttackRate,
  arenaCombatStats,
  arenaGearBySlot,
  arenaDefenseSeasonScore,
  arenaJstDayKey,
  arenaNextTierForScore,
  arenaRatingDeltas,
  arenaSeasonKey,
  arenaSeasonResetRating,
  arenaTierForScore,
  arenaWeekendMultiplier,
  arenaWraithAfterHits,
  arenaUsesMagic,
  simulateArenaBattle,
} from '../application/arena-domain';

describe('arena domain', () => {
  it('uses Monday 00:00 JST as the season boundary', () => {
    const before = Date.parse('2026-09-13T14:59:59Z'); // Sun 23:59:59 JST
    const after = Date.parse('2026-09-13T15:00:00Z'); // Mon 00:00 JST
    expect(arenaSeasonKey(before)).toBe('2026-09-07');
    expect(arenaSeasonKey(after)).toBe('2026-09-14');
    expect(arenaJstDayKey(after)).toBe('2026-09-14');
  });

  it('doubles attack and defense score on Fri/Sat/Sun JST', () => {
    const thursday = Date.parse('2026-09-10T03:00:00Z');
    const friday = Date.parse('2026-09-11T03:00:00Z');
    expect(arenaWeekendMultiplier(thursday)).toBe(1);
    expect(arenaWeekendMultiplier(friday)).toBe(2);
    expect(arenaAttackSeasonScore(1_500, 'win', thursday)).toBe(15);
    expect(arenaAttackSeasonScore(1_500, 'win', friday)).toBe(30);
    expect(arenaAttackSeasonScore(1_500, 'loss', friday)).toBe(2);
    expect(arenaDefenseSeasonScore(1_500, friday)).toBe(10);
  });

  it('keeps the public 700-point upset guard while using a product-owned Elo curve elsewhere', () => {
    expect(arenaRatingDeltas(1_000, 1_700, 'win')).toEqual({ attacker: 0, defender: 0 });
    expect(arenaRatingDeltas(1_700, 1_000, 'loss')).toEqual({ attacker: 0, defender: 0 });
    const ordinary = arenaRatingDeltas(1_000, 1_100, 'win');
    expect(ordinary.attacker).toBeGreaterThan(0);
    expect(ordinary.defender).toBe(-ordinary.attacker);
  });

  it('resets rating partially without dropping an under-1000 player below the 1000 season floor', () => {
    expect(arenaSeasonResetRating(740)).toBe(1_000);
    expect(arenaSeasonResetRating(1_000)).toBe(1_000);
    expect(arenaSeasonResetRating(1_400)).toBe(1_300);
  });

  it('resolves normalized server combat deterministically with a 20-turn cap', () => {
    const a = simulateArenaBattle({ attackerJobId: 'job.warrior', defenderJobId: 'job.mage', seed: 91 });
    const b = simulateArenaBattle({ attackerJobId: 'job.warrior', defenderJobId: 'job.mage', seed: 91 });
    expect(a).toEqual(b);
    expect(a.turns.length).toBeGreaterThan(0);
    expect(a.turns.length).toBeLessThanOrEqual(ARENA_MAX_TURNS);
    expect(['win', 'loss', 'draw']).toContain(a.outcome);
  });

  it('gives jobs distinct normalized combat without accepting client stat inputs', () => {
    const warrior = simulateArenaBattle({ attackerJobId: 'job.warrior', defenderJobId: 'job.adventurer', seed: 4 });
    const mage = simulateArenaBattle({ attackerJobId: 'job.mage', defenderJobId: 'job.adventurer', seed: 4 });
    expect(warrior.attackerMaxHp).not.toBe(mage.attackerMaxHp);
    expect(warrior).not.toEqual(mage);
  });

  it('exposes the reference-locked cadence constants', () => {
    expect(ARENA_COOLDOWN_MS).toBe(60_000);
    expect(ARENA_DEFENSE_BARRIER_MS).toBe(7_200_000);
    expect(ARENA_DAILY_WIN_LIMIT).toBe(3);
  });

  it('offers three free choices in every server-owned Arena equipment slot', () => {
    expect(arenaGearBySlot('weapon')).toHaveLength(3);
    expect(arenaGearBySlot('armor')).toHaveLength(3);
    expect(arenaGearBySlot('orb')).toHaveLength(3);
    expect(ARENA_GEAR).toHaveLength(9);
  });

  it('applies Arena gear to normalized stats while Wraith ignores equipment', () => {
    const offensive = { weaponId: 'arena.weapon.vanguard-blade', armorId: 'arena.armor.scout-coat', orbId: 'arena.orb.edge' } as const;
    expect(arenaCombatStats('job.warrior', offensive).attack).toBeGreaterThan(arenaCombatStats('job.warrior', ARENA_DEFAULT_LOADOUT).attack);
    expect(arenaCombatStats('job.wraith', offensive)).toEqual(arenaCombatStats('job.wraith', ARENA_DEFAULT_LOADOUT));
  });

  it('lets Tamer switch to magic Arena attacks with the Arena staff', () => {
    const staff = { ...ARENA_DEFAULT_LOADOUT, weaponId: 'arena.weapon.arc-focus' } as const;
    expect(arenaUsesMagic('job.tamer', ARENA_DEFAULT_LOADOUT)).toBe(false);
    expect(arenaUsesMagic('job.tamer', staff)).toBe(true);
    const physical = simulateArenaBattle({ attackerJobId: 'job.tamer', defenderJobId: 'job.warrior', attackerLoadout: ARENA_DEFAULT_LOADOUT, seed: 81 });
    const magical = simulateArenaBattle({ attackerJobId: 'job.tamer', defenderJobId: 'job.warrior', attackerLoadout: staff, seed: 81 });
    expect(magical).not.toEqual(physical);
  });


  it('uses server-owned Arena pets with +40 points for Tamer and 60% on the second pet', () => {
    expect(arenaPetAttackRate('job.adventurer', 0)).toBeCloseTo(0.25);
    expect(arenaPetAttackRate('job.tamer', 0)).toBeCloseTo(0.65);
    expect(arenaPetAttackRate('job.tamer', 1)).toBeCloseTo(0.39);
    expect(ARENA_DEFAULT_PETS).toEqual({ primary: 'none', secondary: 'none' });
  });

  it('uses the published Ninja and Wraith dodge rates for player and pet attacks', () => {
    expect(arenaDodgeChance('job.ninja', 0)).toBeCloseTo(0.30);
    expect(arenaDodgeChance('job.wraith', 999)).toBeCloseTo(0.70);
    expect(arenaDodgeChance('job.warrior', 10)).toBeGreaterThanOrEqual(0.03);
  });

  it('ignores a second Arena pet outside Tamer and enables it for Tamer', () => {
    const secondaryOnly = { primary: 'none', secondary: 'physical' } as const;
    const noPets = simulateArenaBattle({ attackerJobId: 'job.warrior', defenderJobId: 'job.adventurer', seed: 404 });
    const nonTamer = simulateArenaBattle({ attackerJobId: 'job.warrior', defenderJobId: 'job.adventurer', attackerPets: secondaryOnly, seed: 404 });
    expect(nonTamer).toEqual(noPets);

    const tamerNoPets = simulateArenaBattle({ attackerJobId: 'job.tamer', defenderJobId: 'job.adventurer', seed: 404 });
    const tamerSecondary = simulateArenaBattle({ attackerJobId: 'job.tamer', defenderJobId: 'job.adventurer', attackerPets: secondaryOnly, seed: 404 });
    expect(tamerSecondary).not.toEqual(tamerNoPets);
    expect(tamerSecondary.turns.flatMap((turn) => turn.logs).some((line) => line.includes('2体目'))).toBe(true);
  });

  it('uses current Wraith accumulation and one-third hit decay in Arena combat v3', () => {
    expect(ARENA_COMBAT_VERSION).toBe(3);
    expect(arenaWraithAfterHits(9, 1)).toBeCloseTo(3);
    expect(arenaWraithAfterHits(9, 2)).toBeCloseTo(1);
    expect(arenaWraithAfterHits(1, 1)).toBeCloseTo(0.5);
  });

  it('uses the published tier thresholds', () => {
    expect(arenaTierForScore(0).displayName).toBe('アイアン');
    expect(arenaTierForScore(299).displayName).toBe('アイアン');
    expect(arenaTierForScore(300).displayName).toBe('ブロンズ');
    expect(arenaTierForScore(40_000).displayName).toBe('マスター');
    expect(arenaNextTierForScore(39_999)?.displayName).toBe('マスター');
    expect(arenaNextTierForScore(40_000)).toBeNull();
  });
});

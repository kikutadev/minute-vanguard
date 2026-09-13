export const ARENA_COMBAT_VERSION = 2;
export const ARENA_COOLDOWN_MS = 60_000;
export const ARENA_DEFENSE_BARRIER_MS = 2 * 60 * 60 * 1_000;
export const ARENA_MAX_TURNS = 20;
export const ARENA_START_RATING = 1_000;
export const ARENA_DAILY_WIN_LIMIT = 3;

export type ArenaJobId =
  | 'job.adventurer'
  | 'job.warrior'
  | 'job.mage'
  | 'job.thief'
  | 'job.priest'
  | 'job.ninja'
  | 'job.gambler'
  | 'job.wraith'
  | 'job.tamer'
  | 'job.hexer';

export type ArenaWeaponId = 'arena.weapon.vanguard-blade' | 'arena.weapon.arc-focus' | 'arena.weapon.lucky-knife';
export type ArenaArmorId = 'arena.armor.guard-plate' | 'arena.armor.ward-robe' | 'arena.armor.scout-coat';
export type ArenaOrbId = 'arena.orb.balance' | 'arena.orb.edge' | 'arena.orb.shelter';
export type ArenaLoadout = Readonly<{ weaponId: ArenaWeaponId; armorId: ArenaArmorId; orbId: ArenaOrbId }>;
export type ArenaGearSlot = 'weapon' | 'armor' | 'orb';
export type ArenaGearDefinition = Readonly<{
  id: ArenaWeaponId | ArenaArmorId | ArenaOrbId;
  slot: ArenaGearSlot;
  displayName: string;
  description: string;
  icon: string;
}>;

export const ARENA_DEFAULT_LOADOUT: ArenaLoadout = Object.freeze({
  weaponId: 'arena.weapon.vanguard-blade',
  armorId: 'arena.armor.guard-plate',
  orbId: 'arena.orb.balance',
});

export const ARENA_GEAR: readonly ArenaGearDefinition[] = Object.freeze([
  { id: 'arena.weapon.vanguard-blade', slot: 'weapon', displayName: '先陣の剣', description: 'ATK重視。物理職の正面火力を伸ばす。', icon: '⚔️' },
  { id: 'arena.weapon.arc-focus', slot: 'weapon', displayName: '方陣の杖', description: 'MAT重視。テイマーはこの武器で魔法型になる。', icon: '🪄' },
  { id: 'arena.weapon.lucky-knife', slot: 'weapon', displayName: '読み合いの短剣', description: 'ATKとLUKを両立し、会心と回避を狙う。', icon: '🗡️' },
  { id: 'arena.armor.guard-plate', slot: 'armor', displayName: '守勢の胸甲', description: 'HPとDEFを厚くする物理受け。', icon: '🛡️' },
  { id: 'arena.armor.ward-robe', slot: 'armor', displayName: '結界の外套', description: 'HPとMDFを厚くする魔法受け。', icon: '🥋' },
  { id: 'arena.armor.scout-coat', slot: 'armor', displayName: '斥候のコート', description: '両防御とLUKを少しずつ伸ばす。', icon: '🧥' },
  { id: 'arena.orb.balance', slot: 'orb', displayName: '均衡のオーブ', description: 'HP・攻撃・防御を広く補う。', icon: '🔮' },
  { id: 'arena.orb.edge', slot: 'orb', displayName: '鋭気のオーブ', description: 'ATK・MAT・LUKを伸ばす攻撃型。', icon: '🔴' },
  { id: 'arena.orb.shelter', slot: 'orb', displayName: '庇護のオーブ', description: 'HP・DEF・MDFを伸ばす耐久型。', icon: '🔵' },
]);

export function isArenaLoadout(value: unknown): value is ArenaLoadout {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return isArenaGearId(record.weaponId, 'weapon') && isArenaGearId(record.armorId, 'armor') && isArenaGearId(record.orbId, 'orb');
}

export function arenaGearBySlot(slot: ArenaGearSlot): readonly ArenaGearDefinition[] {
  return ARENA_GEAR.filter((gear) => gear.slot === slot);
}

export type ArenaBattleOutcome = 'win' | 'loss' | 'draw';
export type ArenaBattleSide = 'attacker' | 'defender';

export type ArenaBattleTurn = Readonly<{
  turn: number;
  firstSide: ArenaBattleSide;
  attackerHpAfter: number;
  defenderHpAfter: number;
  logs: readonly string[];
}>;

export type ArenaBattleSimulation = Readonly<{
  combatVersion: number;
  seed: number;
  outcome: ArenaBattleOutcome;
  firstSide: ArenaBattleSide;
  attackerMaxHp: number;
  defenderMaxHp: number;
  attackerHpAfter: number;
  defenderHpAfter: number;
  turns: readonly ArenaBattleTurn[];
}>;

export type ArenaTier = Readonly<{
  id: 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'emerald' | 'sapphire' | 'ruby' | 'diamond' | 'master';
  displayName: string;
  threshold: number;
}>;

export const ARENA_TIERS: readonly ArenaTier[] = Object.freeze([
  { id: 'iron', displayName: 'アイアン', threshold: 0 },
  { id: 'bronze', displayName: 'ブロンズ', threshold: 300 },
  { id: 'silver', displayName: 'シルバー', threshold: 1_000 },
  { id: 'gold', displayName: 'ゴールド', threshold: 2_500 },
  { id: 'platinum', displayName: 'プラチナ', threshold: 5_000 },
  { id: 'emerald', displayName: 'エメラルド', threshold: 9_000 },
  { id: 'sapphire', displayName: 'サファイア', threshold: 14_000 },
  { id: 'ruby', displayName: 'ルビー', threshold: 21_000 },
  { id: 'diamond', displayName: 'ダイヤ', threshold: 29_000 },
  { id: 'master', displayName: 'マスター', threshold: 40_000 },
]);

type ArenaCombatStats = Readonly<{
  hp: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  luck: number;
}>;

const NORMALIZED_JOB_STATS: Readonly<Record<ArenaJobId, ArenaCombatStats>> = Object.freeze({
  'job.adventurer': { hp: 118, attack: 22, defense: 13, magicAttack: 18, magicDefense: 13, luck: 12 },
  'job.warrior': { hp: 142, attack: 27, defense: 17, magicAttack: 10, magicDefense: 12, luck: 8 },
  'job.mage': { hp: 98, attack: 10, defense: 9, magicAttack: 31, magicDefense: 18, luck: 11 },
  'job.thief': { hp: 106, attack: 23, defense: 10, magicAttack: 12, magicDefense: 11, luck: 26 },
  'job.priest': { hp: 122, attack: 12, defense: 13, magicAttack: 24, magicDefense: 23, luck: 11 },
  'job.ninja': { hp: 104, attack: 24, defense: 10, magicAttack: 14, magicDefense: 11, luck: 27 },
  'job.gambler': { hp: 110, attack: 20, defense: 11, magicAttack: 19, magicDefense: 11, luck: 23 },
  'job.wraith': { hp: 112, attack: 8, defense: 8, magicAttack: 29, magicDefense: 19, luck: 16 },
  'job.tamer': { hp: 120, attack: 21, defense: 14, magicAttack: 18, magicDefense: 14, luck: 14 },
  'job.hexer': { hp: 108, attack: 10, defense: 10, magicAttack: 27, magicDefense: 18, luck: 17 },
});

const ARENA_GEAR_STATS: Readonly<Record<ArenaGearDefinition['id'], Partial<ArenaCombatStats>>> = Object.freeze({
  'arena.weapon.vanguard-blade': { attack: 8 },
  'arena.weapon.arc-focus': { magicAttack: 10 },
  'arena.weapon.lucky-knife': { attack: 4, luck: 7 },
  'arena.armor.guard-plate': { hp: 22, defense: 7 },
  'arena.armor.ward-robe': { hp: 14, magicDefense: 8 },
  'arena.armor.scout-coat': { hp: 12, defense: 3, magicDefense: 3, luck: 5 },
  'arena.orb.balance': { hp: 10, attack: 3, defense: 2, magicAttack: 3, magicDefense: 2 },
  'arena.orb.edge': { attack: 5, magicAttack: 5, luck: 3 },
  'arena.orb.shelter': { hp: 18, defense: 4, magicDefense: 4 },
});

export function arenaCombatStats(jobId: ArenaJobId, loadout: ArenaLoadout = ARENA_DEFAULT_LOADOUT): ArenaCombatStats {
  const base = NORMALIZED_JOB_STATS[jobId];
  if (jobId === 'job.wraith') return base;
  const bonuses = [ARENA_GEAR_STATS[loadout.weaponId], ARENA_GEAR_STATS[loadout.armorId], ARENA_GEAR_STATS[loadout.orbId]];
  return bonuses.reduce<ArenaCombatStats>((current, bonus) => ({
    hp: current.hp + (bonus.hp ?? 0),
    attack: current.attack + (bonus.attack ?? 0),
    defense: current.defense + (bonus.defense ?? 0),
    magicAttack: current.magicAttack + (bonus.magicAttack ?? 0),
    magicDefense: current.magicDefense + (bonus.magicDefense ?? 0),
    luck: current.luck + (bonus.luck ?? 0),
  }), base);
}

export function arenaUsesMagic(jobId: ArenaJobId, loadout: ArenaLoadout = ARENA_DEFAULT_LOADOUT): boolean {
  if (jobId === 'job.mage' || jobId === 'job.priest' || jobId === 'job.wraith' || jobId === 'job.hexer') return true;
  return jobId === 'job.tamer' && loadout.weaponId === 'arena.weapon.arc-focus';
}

function isArenaGearId(value: unknown, slot: ArenaGearSlot): boolean {
  return typeof value === 'string' && ARENA_GEAR.some((gear) => gear.slot === slot && gear.id === value);
}

export function arenaTierForScore(score: number): ArenaTier {
  const safeScore = Math.max(0, Math.floor(score));
  let current = ARENA_TIERS[0]!;
  for (const tier of ARENA_TIERS) {
    if (safeScore < tier.threshold) break;
    current = tier;
  }
  return current;
}

export function arenaNextTierForScore(score: number): ArenaTier | null {
  const safeScore = Math.max(0, Math.floor(score));
  return ARENA_TIERS.find((tier) => tier.threshold > safeScore) ?? null;
}

/** Monday 00:00 JST is the weekly season boundary. */
export function arenaSeasonKey(nowMs: number): string {
  const shifted = new Date(nowMs + 9 * 60 * 60 * 1_000);
  const mondayOffset = (shifted.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() - mondayOffset,
  ));
  return `${monday.getUTCFullYear()}-${pad2(monday.getUTCMonth() + 1)}-${pad2(monday.getUTCDate())}`;
}

export function arenaJstDayKey(nowMs: number): string {
  const shifted = new Date(nowMs + 9 * 60 * 60 * 1_000);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

export function arenaWeekendMultiplier(nowMs: number): 1 | 2 {
  const shifted = new Date(nowMs + 9 * 60 * 60 * 1_000);
  const day = shifted.getUTCDay();
  return day === 5 || day === 6 || day === 0 ? 2 : 1;
}

export function arenaAttackSeasonScore(opponentRating: number, outcome: ArenaBattleOutcome, nowMs: number): number {
  const base = outcome === 'win'
    ? clamp(Math.round(Math.max(0, opponentRating) / 100), 2, 40)
    : 1;
  return base * arenaWeekendMultiplier(nowMs);
}

export function arenaDefenseSeasonScore(attackerRating: number, nowMs: number): number {
  const full = clamp(Math.round(Math.max(0, attackerRating) / 100), 2, 40) * arenaWeekendMultiplier(nowMs);
  return Math.max(1, Math.floor(full / 3));
}

/**
 * Product-owned Elo curve. The public reference exposes the direction, initial
 * 1,000 rating and the 700-point upset guard, but not the exact live formula.
 */
export function arenaRatingDeltas(
  attackerRating: number,
  defenderRating: number,
  outcome: ArenaBattleOutcome,
): Readonly<{ attacker: number; defender: number }> {
  const a = Math.max(0, Math.floor(attackerRating));
  const d = Math.max(0, Math.floor(defenderRating));
  const gap = Math.abs(a - d);
  const underdogWon = (outcome === 'win' && a < d) || (outcome === 'loss' && d < a);
  if (gap >= 700 && underdogWon) return { attacker: 0, defender: 0 };

  const attackerExpected = 1 / (1 + 10 ** ((d - a) / 400));
  const attackerScore = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  let attackerDelta = Math.round(32 * (attackerScore - attackerExpected));
  if (a + attackerDelta < 0) attackerDelta = -a;
  let defenderDelta = -attackerDelta;
  if (d + defenderDelta < 0) {
    defenderDelta = -d;
    attackerDelta = -defenderDelta;
  }
  return { attacker: attackerDelta, defender: defenderDelta };
}

/** Product-owned partial weekly rating reset because the exact public curve is not published. */
export function arenaSeasonResetRating(rating: number): number {
  const safe = Math.max(0, Math.floor(rating));
  if (safe <= ARENA_START_RATING) return ARENA_START_RATING;
  return ARENA_START_RATING + Math.floor((safe - ARENA_START_RATING) * 0.75);
}

export function simulateArenaBattle(args: Readonly<{
  attackerJobId: ArenaJobId;
  defenderJobId: ArenaJobId;
  attackerLoadout?: ArenaLoadout;
  defenderLoadout?: ArenaLoadout;
  seed: number;
}>): ArenaBattleSimulation {
  const attackerLoadout = args.attackerLoadout ?? ARENA_DEFAULT_LOADOUT;
  const defenderLoadout = args.defenderLoadout ?? ARENA_DEFAULT_LOADOUT;
  const attackerStats = arenaCombatStats(args.attackerJobId, attackerLoadout);
  const defenderStats = arenaCombatStats(args.defenderJobId, defenderLoadout);
  const rng = mulberry32(args.seed >>> 0);
  const firstSide: ArenaBattleSide = rng() < 0.5 ? 'attacker' : 'defender';
  let attackerHp = attackerStats.hp;
  let defenderHp = defenderStats.hp;
  let attackerWraithPower = 0.5;
  let defenderWraithPower = 0.5;
  let attackerHex = 0;
  let defenderHex = 0;
  const turns: ArenaBattleTurn[] = [];

  for (let turn = 1; turn <= ARENA_MAX_TURNS; turn += 1) {
    const logs: string[] = [];
    const order: readonly ArenaBattleSide[] = firstSide === 'attacker' ? ['attacker', 'defender'] : ['defender', 'attacker'];
    for (const side of order) {
      if (attackerHp <= 0 || defenderHp <= 0) break;
      if (side === 'attacker') {
        const result = resolveAction({
          jobId: args.attackerJobId,
          targetJobId: args.defenderJobId,
          stats: attackerStats,
          ownHp: attackerHp,
          targetHp: defenderHp,
          targetStats: defenderStats,
          wraithPower: attackerWraithPower,
          hexStacks: attackerHex,
          usesMagic: arenaUsesMagic(args.attackerJobId, attackerLoadout),
          rng,
        });
        attackerHp = result.ownHpAfter;
        defenderHp = result.targetHpAfter;
        attackerWraithPower = result.wraithPowerAfter;
        attackerHex = result.hexStacksAfter;
        if (result.hitTarget && args.defenderJobId === 'job.wraith') defenderWraithPower = 0.5;
        logs.push(...result.logs.map((line) => `攻 ${line}`));
      } else {
        const result = resolveAction({
          jobId: args.defenderJobId,
          targetJobId: args.attackerJobId,
          stats: defenderStats,
          ownHp: defenderHp,
          targetHp: attackerHp,
          targetStats: attackerStats,
          wraithPower: defenderWraithPower,
          hexStacks: defenderHex,
          usesMagic: arenaUsesMagic(args.defenderJobId, defenderLoadout),
          rng,
        });
        defenderHp = result.ownHpAfter;
        attackerHp = result.targetHpAfter;
        defenderWraithPower = result.wraithPowerAfter;
        defenderHex = result.hexStacksAfter;
        if (result.hitTarget && args.attackerJobId === 'job.wraith') attackerWraithPower = 0.5;
        logs.push(...result.logs.map((line) => `守 ${line}`));
      }
    }
    turns.push({
      turn,
      firstSide,
      attackerHpAfter: Math.max(0, attackerHp),
      defenderHpAfter: Math.max(0, defenderHp),
      logs,
    });
    if (attackerHp <= 0 || defenderHp <= 0) break;
  }

  const outcome: ArenaBattleOutcome = defenderHp <= 0 && attackerHp > 0
    ? 'win'
    : attackerHp <= 0 && defenderHp > 0
      ? 'loss'
      : 'draw';
  return {
    combatVersion: ARENA_COMBAT_VERSION,
    seed: args.seed >>> 0,
    outcome,
    firstSide,
    attackerMaxHp: attackerStats.hp,
    defenderMaxHp: defenderStats.hp,
    attackerHpAfter: Math.max(0, attackerHp),
    defenderHpAfter: Math.max(0, defenderHp),
    turns,
  };
}

function resolveAction(args: Readonly<{
  jobId: ArenaJobId;
  targetJobId: ArenaJobId;
  stats: ArenaCombatStats;
  ownHp: number;
  targetHp: number;
  targetStats: ArenaCombatStats;
  wraithPower: number;
  hexStacks: number;
  usesMagic: boolean;
  rng: () => number;
}>): Readonly<{
  ownHpAfter: number;
  targetHpAfter: number;
  wraithPowerAfter: number;
  hexStacksAfter: number;
  hitTarget: boolean;
  logs: readonly string[];
}> {
  let ownHp = args.ownHp;
  let targetHp = args.targetHp;
  let wraithPower = args.wraithPower;
  let hexStacks = args.hexStacks;
  const logs: string[] = [];

  const dodgeBonus = args.targetJobId === 'job.ninja' ? 0.10 : args.targetJobId === 'job.wraith' ? 0.06 : 0;
  const dodgeChance = clamp(0.025 + args.targetStats.luck * 0.002 + dodgeBonus, 0.03, 0.22);
  if (args.rng() < dodgeChance) {
    logs.push('攻撃をかわされた');
    return { ownHpAfter: ownHp, targetHpAfter: targetHp, wraithPowerAfter: wraithPower, hexStacksAfter: hexStacks, hitTarget: false, logs };
  }

  const offense = args.usesMagic ? args.stats.magicAttack : args.stats.attack;
  const defense = args.usesMagic ? args.targetStats.magicDefense : args.targetStats.defense;
  let multiplier = 1;
  if (args.jobId === 'job.warrior' && ownHp <= args.stats.hp * 0.4) multiplier *= 1.5;
  if (args.jobId === 'job.gambler') {
    const roll = args.rng();
    multiplier *= roll < 0.08 ? 2.4 : roll < 0.25 ? 1.6 : roll < 0.65 ? 1 : 0.55;
  }
  if (args.jobId === 'job.wraith') {
    multiplier *= Math.max(0.5, wraithPower);
    wraithPower = Math.min(3, wraithPower + 0.35);
  }

  const variance = 0.88 + args.rng() * 0.24;
  const critChance = clamp(0.04 + args.stats.luck * 0.004 + (args.jobId === 'job.thief' ? 0.08 : 0), 0.04, 0.28);
  const critical = args.rng() < critChance;
  if (critical) multiplier *= 1.55;
  let damage = Math.max(1, Math.round((offense * multiplier * variance) - defense * 0.58));

  if (args.jobId === 'job.hexer') {
    hexStacks = Math.min(8, hexStacks + 1);
    damage += hexStacks * 2;
  }
  targetHp = Math.max(0, targetHp - damage);
  logs.push(`${critical ? '会心 ' : ''}${damage}ダメージ`);

  if (args.jobId === 'job.mage' && targetHp > 0 && args.rng() < 0.3) {
    const chain = Math.max(1, Math.round(damage * 0.45));
    targetHp = Math.max(0, targetHp - chain);
    logs.push(`魔法連鎖 +${chain}`);
  }
  if (args.jobId === 'job.tamer' && targetHp > 0) {
    const follow = 5 + Math.floor(args.rng() * 5);
    targetHp = Math.max(0, targetHp - follow);
    logs.push(`相棒の追撃 +${follow}`);
  }
  if (args.jobId === 'job.priest' && ownHp > 0 && ownHp < args.stats.hp) {
    const heal = Math.max(1, Math.round(args.stats.hp * 0.05));
    const actual = Math.min(heal, args.stats.hp - ownHp);
    ownHp += actual;
    if (actual > 0) logs.push(`祈りで ${actual}回復`);
  }

  return { ownHpAfter: ownHp, targetHpAfter: targetHp, wraithPowerAfter: wraithPower, hexStacksAfter: hexStacks, hitTarget: true, logs };
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

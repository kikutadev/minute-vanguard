import {
  GameNumber,
  addItemInstance,
  addProgressiveTitleCopy,
  applyCurrencyTransaction,
  applyRewards,
  consumeCooldown,
  createCooldownState,
  createLoadoutState,
  createProgressiveTitleCollection,
  createRngStreams,
  equipItem,
  equipProgressiveTitle,
  nextRandom,
  previewCooldown,
  progressiveTitleLevelFromCopies,
  progressiveTitleTotalCost,
  reorderProgressiveTitle,
  readCurrency,
  recordCurrencySpend,
  reduceCooldown,
  removeItemInstance,
  resolveOfflineElapsed,
  unequipItem,
  unequipProgressiveTitle,
  clearEquippedProgressiveTitles,
  updateProgressiveTitleLevel,
  type CommandResult,
  type CooldownPreview,
  type CurrencyDefinition,
  type DomainEvent,
  type InventoryState,
  type ItemInstanceState,
  type OfflineTimePolicy,
} from 'idle-game-kit';
import {
  battleCooldownDefinition,
  currencyDefinitions,
  definitionVersion,
  enemies,
  ids,
  itemDefinitions,
  jobs,
  loadoutDefinition,
  orbPercentByRank,
  orbRanks,
  permanentUpgradeDefinitions,
  rarityOrder,
  shopEquipmentOffers,
  type PermanentUpgradeId,
} from '../definitions/game-definitions';
import {
  TITLE_DROP_CHANCE,
  TITLE_RESET_COST,
  TITLE_SHOP_PRICE,
  titleDefinitions,
  titleRules,
  type TitleEffectFamily,
} from '../definitions/title-definitions';
import type {
  BattleResult,
  BattleTurn,
  EnemyDefinition,
  EquipmentData,
  JobDefinition,
  LevelGrowthResult,
  MinuteVanguardState,
  MonsterRarity,
  OrbEffectId,
  OrbRank,
  PermanentStatReward,
  StatKey,
  StatValues,
  TimeBoostKind,
} from '../definitions/types';

const SCHEMA_VERSION = 2;
const MAX_BATTLE_TURNS = 20;
const BEGINNER_FAST_KILLS = 10;
const STAT_KEYS: readonly StatKey[] = ['hp', 'attack', 'defense', 'magicAttack', 'magicDefense', 'luck'];
const BASE_STATS: StatValues = { hp: 100, attack: 12, defense: 8, magicAttack: 10, magicDefense: 8, luck: 10 };
const TIME_BOOST_OPTIONS = [
  { durationSec: 180, gemCost: 30 },
  { durationSec: 600, gemCost: 100 },
  { durationSec: 1800, gemCost: 300 },
] as const;
const ORB_BASE_CAPACITY = 10;
const ORB_CAPACITY_EXPANSION_COST = 100;
const ORB_REROLL_COSTS = [50, 100, 200, 400] as const;
const ORB_COMBINE_COST_BY_TARGET_RANK: Readonly<Partial<Record<OrbRank, number>>> = {
  E: 30_000, D: 100_000, C: 300_000, B: 1_000_000, A: 3_000_000, S: 10_000_000, SS: 30_000_000, SSS: 100_000_000,
};
const KNOWN_ORB_EFFECT_LADDERS: Readonly<Partial<Record<OrbEffectId, readonly number[]>>> = {
  gold: [3, 6, 9, 12, 15],
  exp: [3, 6, 9, 12, 15],
  greatGrowth: [3, 6, 9, 12, 15],
  critical: [5, 10, 15, 20, 25],
  evasion: [3, 6, 9, 12, 15],
  cooldown: [1, 2, 3, 4, 5],
};
const currencyById = new Map(currencyDefinitions.map((definition) => [definition.id, definition]));

export function createInitialState(nowMs = Date.now(), seed = 0x60b0_2026): MinuteVanguardState {
  return {
    schemaVersion: SCHEMA_VERSION,
    gameId: 'minute-vanguard',
    definitionVersion,
    createdAtMs: nowMs,
    simTimeSec: 0,
    lastWallClockMs: nowMs,
    currencies: {
      [ids.currency.gold]: GameNumber.zero().serialize(),
      [ids.currency.gem]: GameNumber.zero().serialize(),
    },
    tokens: {},
    producers: {},
    characters: {},
    achievements: {},
    titles: {},
    progressionFlags: {},
    rngStreams: createRngStreams(seed, Object.values(ids.rng)),
    gachaStates: {},
    activeBoosts: {},
    recentExternalRewardGrantIds: [],
    prestigeStates: {},
    calendarRewardStates: {},
    missionStates: {},
    missionSetStates: {},
    statistics: { lifetimeCurrencyEarned: {}, lifetimeCurrencySpent: {} },
    gameData: {
      player: {
        name: '勇者',
        level: 1,
        exp: 0,
        currentHp: BASE_STATS.hp,
        jobId: 'job.adventurer',
        totalJobChanges: 0,
        jobBonusCounts: {},
        growthBonusPct: 0,
        baseStats: BASE_STATS,
        permanentStats: zeroStats(),
        petCount: 0,
      },
      battleCooldown: createCooldownState(),
      inventory: {},
      loadout: createLoadoutState(loadoutDefinition),
      totalBattles: 0,
      victories: 0,
      draws: 0,
      defeats: 0,
      killCounts: {},
      discoveredEnemyIds: [],
      lastDefeatedEnemyId: null,
      consecutiveDefeats: 0,
      nextItemSequence: 1,
      lastBattle: null,
      rareGuaranteeActive: false,
      permanentUpgrades: {
        freeCooldownSkips: false,
        cooldownReduction: false,
        expMultiplier: false,
        goldMultiplier: false,
        orbDropMultiplier: false,
        drawExpMultiplier: false,
      },
      freeCooldownSkipUsage: { dayKey: jstDayKey(nowMs), used: 0 },
      ownedPetEnemyIds: [],
      activePetEnemyIds: [],
      orbCapacity: ORB_BASE_CAPACITY,
      timeBoosts: { rush: 0, exp: 0, gold: 0 },
      titles: createProgressiveTitleCollection(),
      favoriteTitleIds: [],
      titleShop: { dayKey: jstDayKey(nowMs), offeredTitleIds: computeDailyTitleOfferIds(jstDayKey(nowMs), createProgressiveTitleCollection()), purchasedTitleIds: [] },
      missionProgress: { dayKey: jstDayKey(nowMs), battles: 0, wins: 0, upgrades: 0, claimed: [] },
    },
  };
}

/** Old public prototype saves are intentionally upgraded into the richer v1 schema. */
export function normalizeLoadedState(state: MinuteVanguardState, nowMs = Date.now()): MinuteVanguardState {
  if (state.schemaVersion === SCHEMA_VERSION && state.definitionVersion === definitionVersion) {
    return {
      ...state,
      gameData: {
        ...state.gameData,
        orbCapacity: state.gameData.orbCapacity ?? ORB_BASE_CAPACITY,
        timeBoosts: state.gameData.timeBoosts ?? { rush: 0, exp: 0, gold: 0 },
        titles: state.gameData.titles ?? createProgressiveTitleCollection(),
        favoriteTitleIds: state.gameData.favoriteTitleIds ?? [],
        titleShop: state.gameData.titleShop ?? { dayKey: jstDayKey(nowMs), offeredTitleIds: computeDailyTitleOfferIds(jstDayKey(nowMs), state.gameData.titles ?? createProgressiveTitleCollection()), purchasedTitleIds: [] },
        permanentUpgrades: { ...state.gameData.permanentUpgrades, freeCooldownSkips: state.gameData.permanentUpgrades.freeCooldownSkips ?? false },
        freeCooldownSkipUsage: state.gameData.freeCooldownSkipUsage ?? { dayKey: jstDayKey(nowMs), used: 0 },
      },
    };
  }
  const next = createInitialState(nowMs, state.rngStreams[ids.rng.encounter]?.state ?? 0x60b0_2026);
  return {
    ...next,
    currencies: {
      ...next.currencies,
      [ids.currency.gold]: state.currencies[ids.currency.gold] ?? next.currencies[ids.currency.gold]!,
      [ids.currency.gem]: state.currencies[ids.currency.gem] ?? next.currencies[ids.currency.gem]!,
    },
  };
}

export function advanceFromWallClock(
  state: MinuteVanguardState,
  currentWallClockMs: number,
  policy: OfflineTimePolicy = {},
): Readonly<{ state: MinuteVanguardState; appliedOfflineSec: number }> {
  const elapsed = resolveOfflineElapsed(state.lastWallClockMs, currentWallClockMs, policy);
  if (elapsed.observedElapsedSec === 0) return { state, appliedOfflineSec: 0 };
  let nextState: MinuteVanguardState = {
    ...state,
    simTimeSec: state.simTimeSec + elapsed.appliedElapsedSec,
    lastWallClockMs: elapsed.nextWallClockMs,
  };
  const currentDayKey = jstDayKey(currentWallClockMs);
  if (nextState.gameData.missionProgress.dayKey !== currentDayKey) {
    nextState = {
      ...nextState,
      gameData: {
        ...nextState.gameData,
        missionProgress: { dayKey: currentDayKey, battles: 0, wins: 0, upgrades: 0, claimed: [] },
        titleShop: { dayKey: currentDayKey, offeredTitleIds: computeDailyTitleOfferIds(currentDayKey, nextState.gameData.titles), purchasedTitleIds: [] },
        freeCooldownSkipUsage: { dayKey: currentDayKey, used: 0 },
      },
    };
  }
  return { state: nextState, appliedOfflineSec: elapsed.appliedElapsedSec };
}

export function battleCooldown(state: MinuteVanguardState): CooldownPreview {
  return previewCooldown(battleCooldownDefinition, state.gameData.battleCooldown, state.simTimeSec);
}

export function timeBoostRemainingSec(state: MinuteVanguardState, kind: TimeBoostKind): number {
  return Math.max(0, Math.ceil((state.gameData.timeBoosts[kind] ?? 0) - state.simTimeSec));
}

export function isTimeBoostActive(state: MinuteVanguardState, kind: TimeBoostKind): boolean {
  return timeBoostRemainingSec(state, kind) > 0;
}

export function effectiveBattleCooldownSec(state: MinuteVanguardState): number {
  if (state.gameData.victories < BEGINNER_FAST_KILLS && state.gameData.lastBattle?.outcome !== 'defeat') return 5;
  if (isTimeBoostActive(state, 'rush')) return 10;
  const base = state.gameData.permanentUpgrades.cooldownReduction ? 50 : 60;
  const orbReduction = Math.min(5, Math.max(0, Math.round(orbEffectValue(state, 'cooldown'))));
  return Math.max(45, base - orbReduction);
}

export function purchaseTimeBoost(
  state: MinuteVanguardState,
  kind: TimeBoostKind,
  durationSec: 180 | 600 | 1800,
): CommandResult<MinuteVanguardState, 'unknown-duration' | 'already-active' | 'insufficient-gems' | 'beginner-fast-cooldown'> {
  const option = TIME_BOOST_OPTIONS.find((candidate) => candidate.durationSec === durationSec);
  if (option === undefined) return reject(state, 'unknown-duration');
  if (kind === 'rush' && effectiveBattleCooldownSec(state) === 5) return reject(state, 'beginner-fast-cooldown');
  if (isTimeBoostActive(state, kind)) return reject(state, 'already-active');
  const spend = spendCurrency(state, ids.currency.gem, option.gemCost, `time-boost.${kind}.${durationSec}`);
  if (!spend.accepted) return reject(state, 'insufficient-gems');
  let cooldown = spend.state.gameData.battleCooldown;
  if (kind === 'rush') {
    const remaining = battleCooldown(spend.state).remainingSec;
    if (remaining > 10) cooldown = reduceCooldown({ cooldown, simTimeSec: spend.state.simTimeSec, reductionSec: remaining - 10 });
  }
  const nextState: MinuteVanguardState = {
    ...spend.state,
    gameData: {
      ...spend.state.gameData,
      battleCooldown: cooldown,
      timeBoosts: { ...spend.state.gameData.timeBoosts, [kind]: spend.state.simTimeSec + durationSec },
    },
  };
  return accept(nextState, [event(nextState, 'timeBoostPurchased', `${kind}:${durationSec}`, { kind, durationSec, gemCost: option.gemCost })]);
}

export function freeCooldownSkipsRemaining(state: MinuteVanguardState): number {
  if (!state.gameData.permanentUpgrades.freeCooldownSkips) return 0;
  if (state.gameData.freeCooldownSkipUsage.dayKey !== jstDayKey(state.lastWallClockMs)) return 3;
  return Math.max(0, 3 - state.gameData.freeCooldownSkipUsage.used);
}

export function cooldownSkipCost(state: MinuteVanguardState): number {
  const remaining = battleCooldown(state).remainingSec;
  if (remaining <= 0) return 0;
  if (freeCooldownSkipsRemaining(state) > 0) return 0;
  return Math.min(6, Math.max(1, Math.ceil(remaining / 10)));
}

/** The public reference intentionally hides skip controls during the 5-second beginner cadence. */
export function canSkipBattleCooldown(state: MinuteVanguardState): boolean {
  const preview = battleCooldown(state);
  return !preview.ready && effectiveBattleCooldownSec(state) > 5 && !isTimeBoostActive(state, 'rush');
}

export function skipBattleCooldown(
  state: MinuteVanguardState,
): CommandResult<MinuteVanguardState, 'already-ready' | 'insufficient-gems'> {
  const preview = battleCooldown(state);
  if (preview.ready || !canSkipBattleCooldown(state)) return reject(state, 'already-ready');
  const cost = cooldownSkipCost(state);
  const free = cost === 0 && freeCooldownSkipsRemaining(state) > 0;
  const paid = free ? { accepted: true as const, state } : spendCurrency(state, ids.currency.gem, cost, 'battle.cooldown-skip');
  if (!paid.accepted) return reject(state, 'insufficient-gems');
  const reduced = reduceCooldown({ cooldown: paid.state.gameData.battleCooldown, simTimeSec: state.simTimeSec, reductionSec: preview.remainingSec });
  const nextState: MinuteVanguardState = {
    ...paid.state,
    gameData: {
      ...paid.state.gameData,
      battleCooldown: reduced,
      freeCooldownSkipUsage: free
        ? { ...paid.state.gameData.freeCooldownSkipUsage, used: paid.state.gameData.freeCooldownSkipUsage.used + 1 }
        : paid.state.gameData.freeCooldownSkipUsage,
    },
  };
  return accept(nextState, [event(nextState, 'battleCooldownSkipped', `${state.gameData.totalBattles}`, { cost, free })]);
}

export function activateRareGuarantee(
  state: MinuteVanguardState,
): CommandResult<MinuteVanguardState, 'already-active' | 'insufficient-gems'> {
  if (state.gameData.rareGuaranteeActive) return reject(state, 'already-active');
  const spend = spendCurrency(state, ids.currency.gem, 10, 'battle.rare-guarantee');
  if (!spend.accepted) return reject(state, 'insufficient-gems');
  const nextState = { ...spend.state, gameData: { ...spend.state.gameData, rareGuaranteeActive: true } };
  return accept(nextState, [event(nextState, 'rareGuaranteeActivated', `${state.gameData.totalBattles}`)]);
}

export function playerCombatStats(state: MinuteVanguardState): StatValues {
  const flat = zeroStats();
  const percent = zeroStats();
  for (const instanceId of Object.values(state.gameData.loadout.equipped)) {
    if (instanceId === null || instanceId === undefined) continue;
    const item = state.gameData.inventory[instanceId];
    if (item?.data === undefined) continue;
    addPartialStats(flat, item.data.flatStats);
    addPartialStats(percent, item.data.percentStats ?? {});
  }
  const output = zeroStats();
  for (const key of STAT_KEYS) {
    const raw = state.gameData.player.baseStats[key] + state.gameData.player.permanentStats[key] + flat[key];
    output[key] = Math.max(key === 'hp' ? 1 : 0, Math.round(raw * (1 + percent[key] / 100)));
  }
  return output;
}

export function currentJob(state: MinuteVanguardState): JobDefinition {
  return jobs.find((job) => job.id === state.gameData.player.jobId) ?? jobs[0]!;
}

export function availableJobs(state: MinuteVanguardState): readonly JobDefinition[] {
  return jobs.filter((job) => {
    if (job.id === 'job.adventurer') return false;
    if (job.unlock === 'job-change-10') return state.gameData.player.totalJobChanges >= 10;
    if (job.unlock === 'pet-10') return state.gameData.player.petCount >= 10;
    return true;
  });
}

export function expRequiredForNextLevel(level: number): number {
  return Math.max(20, Math.round(25 + 18 * Math.pow(level, 1.22)));
}

export function fight(state: MinuteVanguardState): CommandResult<MinuteVanguardState, 'cooldown-active'> {
  if (!battleCooldown(state).ready) return reject(state, 'cooldown-active');

  let nextState = state;
  const selection = selectEnemy(nextState);
  nextState = selection.state;
  const enemy = selection.enemy;
  const mutatedRoll = draw(nextState, ids.rng.encounter);
  nextState = mutatedRoll.state;
  const mutated = mutatedRoll.value < 0.01;
  const mutationStat = mutated ? 1.5 : 1;
  const rewardMultiplier = mutated ? 3 : 1;
  const enemyHpMax = Math.max(1, Math.round(enemy.hp * mutationStat));
  const stats = playerCombatStats(nextState);
  const maxHp = stats.hp;
  let playerHp = Math.max(1, Math.min(maxHp, nextState.gameData.player.currentHp));
  const playerHpStart = playerHp;
  let enemyHp = enemyHpMax;
  const turns: BattleTurn[] = [];
  const job = currentJob(nextState);
  let curseStacks = 0;
  let wraithMultiplier = 1;

  for (let turn = 1; turn <= MAX_BATTLE_TURNS && playerHp > 0 && enemyHp > 0; turn += 1) {
    const logs: string[] = [];
    const attackRoll = draw(nextState, ids.rng.combat); nextState = attackRoll.state;
    const critRoll = draw(nextState, ids.rng.combat); nextState = critRoll.state;
    const skillRoll = draw(nextState, ids.rng.combat); nextState = skillRoll.state;
    const variance = 0.9 + attackRoll.value * 0.2;
    const magicUser = ['job.mage', 'job.wraith', 'job.hexer'].includes(job.id)
      || (job.id === 'job.tamer' && stats.magicAttack > stats.attack);
    const offensive = magicUser ? stats.magicAttack : stats.attack;
    const enemyGuard = magicUser ? Math.round(enemy.magicDefense * mutationStat) : Math.round(enemy.defense * mutationStat);
    const critChance = Math.min(0.65, 0.05 + stats.luck / (stats.luck + 240) * 0.25 + orbEffectValue(nextState, 'critical') / 100 + titleEffectValue(nextState, 'criticalChance'));
    const critical = critRoll.value < critChance;
    let skillMultiplier = 1;
    if (job.id === 'job.warrior' && playerHp / maxHp <= 0.3) skillMultiplier *= 2;
    if (job.id === 'job.gambler') skillMultiplier *= gamblerMultiplier(skillRoll.value);
    if (job.id === 'job.wraith') {
      wraithMultiplier = Math.min(10, wraithMultiplier * 1.5);
      skillMultiplier *= wraithMultiplier;
    }
    const titleDirectMultiplier = Math.max(1, titleEffectValue(nextState, 'battleDamage'))
      * Math.max(1, titleEffectValue(nextState, magicUser ? 'magicDamage' : 'physicalDamage'))
      * (turn === 1 ? Math.max(1, titleEffectValue(nextState, 'openingDamage')) : 1);
    const titleCriticalMultiplier = Math.max(1.8, titleEffectValue(nextState, 'criticalDamage'));
    let playerDamage = damage(offensive * skillMultiplier * titleDirectMultiplier, enemyGuard, variance, critical ? titleCriticalMultiplier : 1);

    if (job.id === 'job.ninja' && enemy.rarity !== 'boss' && enemy.rarity !== 'legendary') {
      const executeChance = Math.min(0.18, stats.luck / 1200);
      if (skillRoll.value < executeChance) {
        playerDamage = enemyHp;
        logs.push('暗殺が決まった！');
      }
    }
    enemyHp = Math.max(0, enemyHp - playerDamage);
    logs.push(`${job.displayName}の攻撃！ ${enemy.displayName}に ${playerDamage} ダメージ！`);

    let playerExtraDamage = 0;
    if (enemyHp > 0 && job.id === 'job.mage' && skillRoll.value < 0.35) {
      playerExtraDamage = damage(stats.magicAttack, Math.round(enemy.magicDefense * mutationStat), 1, 1);
      enemyHp = Math.max(0, enemyHp - playerExtraDamage);
      logs.push(`魔法連鎖！ さらに ${playerExtraDamage} ダメージ！`);
    }

    let petDamage = 0;
    if (enemyHp > 0 && nextState.gameData.activePetEnemyIds.length > 0) {
      const petBase = Math.max(1, Math.round((stats.attack + stats.magicAttack) * 0.14 * (job.id === 'job.tamer' ? 1.4 : 1) * Math.max(1, titleEffectValue(nextState, 'petDamage'))));
      petDamage = petBase + (nextState.gameData.activePetEnemyIds.length > 1 ? Math.max(1, Math.round(petBase * 0.6)) : 0);
      enemyHp = Math.max(0, enemyHp - petDamage);
      logs.push(`ペットの追撃！ ${petDamage} ダメージ！`);
    }

    if (enemyHp > 0 && job.id === 'job.hexer') {
      curseStacks = Math.min(5, curseStacks + 1);
      const curseDamage = Math.max(1, Math.round(stats.magicAttack * 0.12 * curseStacks));
      enemyHp = Math.max(0, enemyHp - curseDamage);
      playerExtraDamage += curseDamage;
      logs.push(`呪詛 ${curseStacks}：防御無視 ${curseDamage} ダメージ！`);
    }

    let enemyDamage = 0;
    let dodged = false;
    let enemySpecial = false;
    if (enemyHp > 0) {
      const dodgeRoll = draw(nextState, ids.rng.combat); nextState = dodgeRoll.state;
      const specialRoll = draw(nextState, ids.rng.combat); nextState = specialRoll.state;
      const baseDodge = job.id === 'job.ninja' ? 0.3 : job.id === 'job.wraith' ? 0.7 : 0;
      const dodgeChance = Math.min(0.9, baseDodge + orbEffectValue(nextState, 'evasion') / 100);
      dodged = dodgeRoll.value < dodgeChance;
      if (!dodged && titleEffectValue(nextState, 'evasion') > 0) {
        const titleDodgeRoll = draw(nextState, ids.rng.combat); nextState = titleDodgeRoll.state;
        dodged = titleDodgeRoll.value < titleEffectValue(nextState, 'evasion');
      }
      enemySpecial = specialRoll.value < enemy.specialChance;
      if (dodged) {
        logs.push(`${enemy.displayName}の攻撃を回避！`);
      } else {
        const enemyPower = (enemy.attackType === 'magic' ? enemy.magicAttack : enemy.attack) * mutationStat;
        const guard = enemy.attackType === 'magic' ? stats.magicDefense : stats.defense;
        enemyDamage = Math.max(1, Math.round(damage(enemyPower * (enemySpecial ? 1.75 : 1), guard, 1, 1) * (1 - Math.min(0.75, titleEffectValue(nextState, 'damageReduction')))));
        playerHp = Math.max(0, playerHp - enemyDamage);
        logs.push(`${enemy.displayName}${enemySpecial ? 'の必殺技' : 'の攻撃'}！ ${enemyDamage} ダメージ！`);
        if (job.id === 'job.wraith') wraithMultiplier = Math.max(1, wraithMultiplier / 3);
      }
    }

    let heal = 0;
    if (playerHp > 0 && job.id === 'job.priest') heal += Math.max(1, Math.floor(maxHp * 0.05));
    if (playerHp > 0) heal += Math.max(0, Math.floor(maxHp * orbEffectValue(nextState, 'regen') / 100));
    if (playerHp > 0) heal += Math.max(0, Math.floor(maxHp * titleEffectValue(nextState, 'regen')));
    if (heal > 0) {
      const before = playerHp;
      playerHp = Math.min(maxHp, playerHp + heal);
      heal = playerHp - before;
      if (heal > 0) logs.push(`HPを ${heal} 回復。`);
    }

    turns.push({
      turn, playerDamage, playerExtraDamage, enemyDamage, petDamage, heal, critical, dodged, enemySpecial,
      playerHpAfter: playerHp, enemyHpAfter: enemyHp, logs,
    });
  }

  const outcome: BattleResult['outcome'] = enemyHp <= 0 ? 'victory' : playerHp <= 0 ? 'defeat' : 'draw';
  const firstDefeat = outcome === 'victory' && (nextState.gameData.killCounts[enemy.id] ?? 0) === 0;
  let streak = 0;
  let streakMultiplier = 1;
  let jackpotMultiplier = 1;
  let goldDelta = 0;
  let expGained = 0;
  let gemGained = 0;
  let permanentStatReward: PermanentStatReward | null = null;
  let levelGrowths: readonly LevelGrowthResult[] = [];
  let droppedItemInstanceId: string | null = null;
  let droppedOrbInstanceId: string | null = null;
  let capturedPetEnemyId: string | null = null;
  let droppedTitleId: string | null = null;
  let titleCopyAdded = false;

  if (outcome === 'victory') {
    streak = nextState.gameData.lastDefeatedEnemyId === enemy.id ? nextState.gameData.consecutiveDefeats + 1 : 1;
    streakMultiplier = streak >= 5 ? 2 : streak >= 3 ? 1.5 : streak >= 2 ? 1.2 : 1;
    const jackpotRoll = draw(nextState, ids.rng.loot); nextState = jackpotRoll.state;
    jackpotMultiplier = rollJackpotMultiplier(jackpotRoll.value);
    const goldMultiplier = (nextState.gameData.permanentUpgrades.goldMultiplier ? 1.2 : 1) * (1 + orbEffectValue(nextState, 'gold') / 100) * (1 + titleEffectValue(nextState, 'gold')) * (isTimeBoostActive(nextState, 'gold') ? 2 : 1);
    goldDelta = Math.max(1, Math.round(enemy.gold * rewardMultiplier * streakMultiplier * jackpotMultiplier * goldMultiplier));
    if (job.id === 'job.thief') goldDelta += Math.max(1, Math.round(stats.luck * 0.35));
    expGained = Math.max(1, Math.round(enemy.exp * rewardMultiplier * (nextState.gameData.permanentUpgrades.expMultiplier ? 1.2 : 1) * (1 + orbEffectValue(nextState, 'exp') / 100) * (1 + titleEffectValue(nextState, 'exp')) * (isTimeBoostActive(nextState, 'exp') ? 2 : 1)));
    nextState = grantCurrency(nextState, ids.currency.gold, goldDelta, `battle.${enemy.id}`);

    if (firstDefeat) {
      const firstGemRoll = draw(nextState, ids.rng.loot); nextState = firstGemRoll.state;
      gemGained += 1 + Math.floor(firstGemRoll.value * 3);
    }
    const gemRoll = draw(nextState, ids.rng.loot); nextState = gemRoll.state;
    if (gemRoll.value < enemy.gemDropChance * (1 + orbEffectValue(nextState, 'gemDrop') / 100)) gemGained += 1;
    if (gemGained > 0) nextState = grantCurrency(nextState, ids.currency.gem, gemGained, `battle.${enemy.id}`);

    const permanentRoll = draw(nextState, ids.rng.loot); nextState = permanentRoll.state;
    if (permanentRoll.value < 0.01) {
      const reward = rollPermanentStat(nextState);
      nextState = reward.state;
      permanentStatReward = reward.reward;
    }

    const equipmentRoll = draw(nextState, ids.rng.loot); nextState = equipmentRoll.state;
    if (equipmentRoll.value < 0.035 * rewardMultiplier) {
      const dropped = createEquipmentDrop(nextState, enemy);
      nextState = dropped.state;
      droppedItemInstanceId = dropped.itemInstanceId;
    }
    const orbRoll = draw(nextState, ids.rng.loot); nextState = orbRoll.state;
    const orbRate = enemy.orbDropChance * (nextState.gameData.permanentUpgrades.orbDropMultiplier ? 1.5 : 1) * rewardMultiplier;
    if (orbRoll.value < orbRate && orbFreeSlots(nextState) > 0) {
      const dropped = createOrb(nextState, enemy.rarity, false);
      nextState = dropped.state;
      droppedOrbInstanceId = dropped.itemInstanceId;
    }

    const killsAfterThisBattle = (nextState.gameData.killCounts[enemy.id] ?? 0) + 1;
    if (killsAfterThisBattle >= 30 && !nextState.gameData.ownedPetEnemyIds.includes(enemy.id)) {
      const captureRoll = draw(nextState, ids.rng.loot);
      nextState = captureRoll.state;
      const captureChance = 0.01 * (job.id === 'job.tamer' ? 1.5 : 1) + titleEffectValue(nextState, 'capture');
      if (captureRoll.value < captureChance) {
        capturedPetEnemyId = enemy.id;
        const ownedPetEnemyIds = [...nextState.gameData.ownedPetEnemyIds, enemy.id];
        const maxActive = job.id === 'job.tamer' ? 2 : 1;
        const activePetEnemyIds = nextState.gameData.activePetEnemyIds.length < maxActive
          ? [...nextState.gameData.activePetEnemyIds, enemy.id]
          : nextState.gameData.activePetEnemyIds;
        nextState = {
          ...nextState,
          gameData: {
            ...nextState.gameData,
            ownedPetEnemyIds,
            activePetEnemyIds,
            player: { ...nextState.gameData.player, petCount: ownedPetEnemyIds.length },
          },
        };
      }
    }

    const titleDropRoll = draw(nextState, ids.rng.loot); nextState = titleDropRoll.state;
    if (titleDropRoll.value < TITLE_DROP_CHANCE) {
      const titlePick = draw(nextState, ids.rng.loot); nextState = titlePick.state;
      const definition = titleDefinitions[Math.min(titleDefinitions.length - 1, Math.floor(titlePick.value * titleDefinitions.length))]!;
      droppedTitleId = definition.id;
      const acquired = addProgressiveTitleCopy(nextState.gameData.titles, definition.id, titleRules);
      titleCopyAdded = acquired.added;
      if (acquired.added) {
        nextState = { ...nextState, gameData: { ...nextState.gameData, titles: acquired.collection } };
      }
    }

    const leveled = applyExperience(nextState, expGained);
    nextState = leveled.state;
    levelGrowths = leveled.growths;
    playerHp = leveled.leveledUp ? playerCombatStats(nextState).hp : playerHp;
  } else if (outcome === 'draw') {
    const drawRatio = nextState.gameData.permanentUpgrades.drawExpMultiplier || orbEffectValue(nextState, 'drawExp') > 0 ? 0.1 : 0.05;
    expGained = Math.max(1, Math.round(enemy.exp * rewardMultiplier * drawRatio * (isTimeBoostActive(nextState, 'exp') ? 2 : 1)));
    const leveled = applyExperience(nextState, expGained);
    nextState = leveled.state;
    levelGrowths = leveled.growths;
    playerHp = leveled.leveledUp ? playerCombatStats(nextState).hp : playerHp;
  } else {
    const gold = goldBalance(nextState);
    const protection = Math.min(0.8, orbEffectValue(nextState, 'goldProtection') / 100);
    const loss = Math.floor(gold * 0.5 * (1 - protection));
    if (loss > 0) {
      const spent = spendCurrency(nextState, ids.currency.gold, loss, `battle.defeat.${enemy.id}`);
      if (spent.accepted) nextState = spent.state;
      goldDelta = -loss;
    }
    playerHp = 1;
  }

  const battleIndex = nextState.gameData.totalBattles + 1;
  const killCounts = outcome === 'victory'
    ? { ...nextState.gameData.killCounts, [enemy.id]: (nextState.gameData.killCounts[enemy.id] ?? 0) + 1 }
    : nextState.gameData.killCounts;
  const discovered = nextState.gameData.discoveredEnemyIds.includes(enemy.id)
    ? nextState.gameData.discoveredEnemyIds
    : [...nextState.gameData.discoveredEnemyIds, enemy.id];

  nextState = {
    ...nextState,
    gameData: {
      ...nextState.gameData,
      player: { ...nextState.gameData.player, currentHp: playerHp },
      totalBattles: battleIndex,
      victories: nextState.gameData.victories + (outcome === 'victory' ? 1 : 0),
      draws: nextState.gameData.draws + (outcome === 'draw' ? 1 : 0),
      defeats: nextState.gameData.defeats + (outcome === 'defeat' ? 1 : 0),
      killCounts,
      discoveredEnemyIds: discovered,
      lastDefeatedEnemyId: outcome === 'victory' ? enemy.id : nextState.gameData.lastDefeatedEnemyId,
      consecutiveDefeats: outcome === 'victory' ? streak : 0,
      rareGuaranteeActive: false,
      missionProgress: {
        ...nextState.gameData.missionProgress,
        battles: nextState.gameData.missionProgress.battles + 1,
        wins: nextState.gameData.missionProgress.wins + (outcome === 'victory' ? 1 : 0),
      },
    },
  };

  const cooldownDuration = state.gameData.victories < BEGINNER_FAST_KILLS && outcome !== 'defeat'
    ? 5
    : normalCooldownSec(nextState);
  const consumed = consumeCooldown({
    definition: battleCooldownDefinition,
    cooldown: nextState.gameData.battleCooldown,
    simTimeSec: nextState.simTimeSec,
    durationSecOverride: cooldownDuration,
  });
  if (!consumed.accepted) throw new Error('Battle cooldown was unexpectedly unavailable after readiness check.');

  const result: BattleResult = {
    battleIndex,
    enemyId: enemy.id,
    enemyName: `${mutated ? '【変異】' : ''}${enemy.displayName}`,
    enemyGlyph: enemy.glyph,
    enemyRarity: enemy.rarity,
    mutated,
    outcome,
    turns,
    playerHpStart,
    playerHpRemaining: playerHp,
    playerHpMax: playerCombatStats(nextState).hp,
    enemyHpMax,
    enemyHpRemaining: enemyHp,
    goldDelta,
    expGained,
    gemGained,
    streak,
    streakMultiplier,
    jackpotMultiplier,
    permanentStatReward,
    levelGrowths,
    droppedItemInstanceId,
    droppedOrbInstanceId,
    firstDefeat,
    capturedPetEnemyId,
    droppedTitleId,
    titleCopyAdded,
  };
  nextState = {
    ...nextState,
    gameData: { ...nextState.gameData, battleCooldown: consumed.cooldown, lastBattle: result },
  };

  return accept(nextState, [event(nextState, 'battleResolved', `${battleIndex}`, {
    enemyId: enemy.id, outcome, mutated, goldDelta, expGained, gemGained, streak, jackpotMultiplier,
    droppedItemInstanceId, droppedOrbInstanceId, capturedPetEnemyId,
  })]);
}

export function buyEquipment(
  state: MinuteVanguardState,
  itemDefinitionId: string,
): CommandResult<MinuteVanguardState, 'unknown-offer' | 'insufficient-gold'> {
  const offer = shopEquipmentOffers.find((candidate) => candidate.itemDefinitionId === itemDefinitionId);
  if (offer === undefined) return reject(state, 'unknown-offer');
  const spend = spendCurrency(state, ids.currency.gold, offer.price, `equipment.buy.${itemDefinitionId}`);
  if (!spend.accepted) return reject(state, 'insufficient-gold');
  const granted = grantItem(spend.state, itemDefinitionId, offer.data);
  const equipped = equipOwnedItem(granted.state, granted.itemInstanceId);
  const nextState = equipped.accepted ? equipped.state : granted.state;
  return accept(nextState, [event(nextState, 'equipmentPurchased', granted.itemInstanceId, { itemDefinitionId, price: offer.price })]);
}

/** Backward-compatible alias kept for existing simulator/tests while the UI now treats purchases as Equipment-tab actions. */
export const buyShopItem = buyEquipment;

export function equipOwnedItem(
  state: MinuteVanguardState,
  itemInstanceId: string,
): CommandResult<MinuteVanguardState, 'unknown-item' | 'equip-rejected'> {
  const item = state.gameData.inventory[itemInstanceId];
  if (item?.data === undefined) return reject(state, 'unknown-item');
  const slotId = item.data.kind;
  const equipped = equipItem({ inventory: state.gameData.inventory, itemDefinitions, loadoutDefinition, loadout: state.gameData.loadout, slotId, itemInstanceId });
  if (!equipped.accepted) return reject(state, 'equip-rejected');
  const nextState = equipped.loadout === state.gameData.loadout ? state : { ...state, gameData: { ...state.gameData, loadout: equipped.loadout } };
  return accept(nextState, equipped.loadout === state.gameData.loadout ? [] : [event(nextState, 'itemEquipped', `${slotId}:${itemInstanceId}`)]);
}

export function upgradeItem(
  state: MinuteVanguardState,
  itemInstanceId: string,
): CommandResult<MinuteVanguardState, 'unknown-item' | 'max-rank' | 'orb-not-upgradeable' | 'insufficient-gold'> {
  const current = state.gameData.inventory[itemInstanceId];
  if (current?.data === undefined) return reject(state, 'unknown-item');
  if (current.data.kind === 'orb') return reject(state, 'orb-not-upgradeable');
  if (current.data.upgradeRank >= 5) return reject(state, 'max-rank');
  const basePower = Object.values(current.data.flatStats).reduce((sum, value) => sum + (value ?? 0), 0);
  const price = Math.max(30, Math.round(basePower * 12 * (current.data.upgradeRank + 1)));
  const spend = spendCurrency(state, ids.currency.gold, price, `equipment.upgrade.${itemInstanceId}`);
  if (!spend.accepted) return reject(state, 'insufficient-gold');
  const flatStats = Object.fromEntries(Object.entries(current.data.flatStats).map(([key, value]) => [key, Math.round((value ?? 0) * 1.18 + 1)])) as Partial<StatValues>;
  const data: EquipmentData = { ...current.data, upgradeRank: current.data.upgradeRank + 1, flatStats };
  const inventory: InventoryState<EquipmentData> = { ...spend.state.gameData.inventory, [itemInstanceId]: { ...current, data } };
  const nextState = {
    ...spend.state,
    gameData: {
      ...spend.state.gameData,
      inventory,
      missionProgress: { ...spend.state.gameData.missionProgress, upgrades: spend.state.gameData.missionProgress.upgrades + 1 },
    },
  };
  return accept(nextState, [event(nextState, 'equipmentUpgraded', `${itemInstanceId}:${data.upgradeRank}`, { price })]);
}

export function upgradeEquippedItem(
  state: MinuteVanguardState,
  slotId: 'weapon' | 'armor',
): CommandResult<MinuteVanguardState, 'empty-slot' | 'unknown-item' | 'max-rank' | 'orb-not-upgradeable' | 'insufficient-gold'> {
  const itemInstanceId = state.gameData.loadout.equipped[slotId];
  if (itemInstanceId === null || itemInstanceId === undefined) return reject(state, 'empty-slot');
  return upgradeItem(state, itemInstanceId);
}

export function discardItem(
  state: MinuteVanguardState,
  itemInstanceId: string,
): CommandResult<MinuteVanguardState, 'unknown-item' | 'protected-item'> {
  const item = state.gameData.inventory[itemInstanceId];
  if (item === undefined) return reject(state, 'unknown-item');
  if (item.data?.kind === 'orb' && (item.data.favorite === true || item.data.locked === true)) return reject(state, 'protected-item');
  let loadout = state.gameData.loadout;
  for (const [slotId, equippedId] of Object.entries(loadout.equipped)) {
    if (equippedId !== itemInstanceId) continue;
    const result = unequipItem(loadoutDefinition, loadout, slotId);
    if (result.accepted) loadout = result.loadout;
  }
  const removed = removeItemInstance(state.gameData.inventory, itemInstanceId);
  if (!removed.accepted) return reject(state, 'unknown-item');
  const nextState = { ...state, gameData: { ...state.gameData, inventory: removed.inventory, loadout } };
  return accept(nextState, [event(nextState, 'itemDiscarded', itemInstanceId)]);
}

export function orbInventoryCount(state: MinuteVanguardState): number {
  return Object.values(state.gameData.inventory).filter((item) => item.data?.kind === 'orb').length;
}

export function orbFreeSlots(state: MinuteVanguardState): number {
  return Math.max(0, state.gameData.orbCapacity - orbInventoryCount(state));
}

export function drawOrb(
  state: MinuteVanguardState,
  count: 1 | 10,
): CommandResult<MinuteVanguardState, 'insufficient-gems' | 'insufficient-orb-slots'> {
  if (orbFreeSlots(state) < count) return reject(state, 'insufficient-orb-slots');
  const spend = spendCurrency(state, ids.currency.gem, count * 100, `orb.gacha.${count}`);
  if (!spend.accepted) return reject(state, 'insufficient-gems');
  let nextState = spend.state;
  for (let index = 0; index < count; index += 1) {
    const forceA = count === 10 && index === 8;
    const forceEffect = count === 10 && index === 9;
    const generated = createOrb(nextState, forceA ? 'epic' : 'common', forceEffect, forceA ? 'A' : undefined);
    nextState = generated.state;
  }
  return accept(nextState, [event(nextState, 'orbGachaResolved', `${state.gameData.totalBattles}:${count}`, { count })]);
}

export function expandOrbCapacity(
  state: MinuteVanguardState,
): CommandResult<MinuteVanguardState, 'insufficient-gems'> {
  const spend = spendCurrency(state, ids.currency.gem, ORB_CAPACITY_EXPANSION_COST, 'orb.capacity.expand');
  if (!spend.accepted) return reject(state, 'insufficient-gems');
  const nextState: MinuteVanguardState = {
    ...spend.state,
    gameData: { ...spend.state.gameData, orbCapacity: spend.state.gameData.orbCapacity + 1 },
  };
  return accept(nextState, [event(nextState, 'orbCapacityExpanded', `${nextState.gameData.orbCapacity}`, { cost: ORB_CAPACITY_EXPANSION_COST })]);
}

export function toggleOrbFavorite(
  state: MinuteVanguardState,
  itemInstanceId: string,
): CommandResult<MinuteVanguardState, 'unknown-orb'> {
  const item = state.gameData.inventory[itemInstanceId];
  if (item?.data?.kind !== 'orb') return reject(state, 'unknown-orb');
  const data: EquipmentData = { ...item.data, favorite: !(item.data.favorite ?? false) };
  const inventory: InventoryState<EquipmentData> = { ...state.gameData.inventory, [itemInstanceId]: { ...item, data } };
  const nextState: MinuteVanguardState = { ...state, gameData: { ...state.gameData, inventory } };
  return accept(nextState, [event(nextState, 'orbFavoriteToggled', itemInstanceId, { favorite: data.favorite })]);
}

export function toggleOrbLock(
  state: MinuteVanguardState,
  itemInstanceId: string,
): CommandResult<MinuteVanguardState, 'unknown-orb'> {
  const item = state.gameData.inventory[itemInstanceId];
  if (item?.data?.kind !== 'orb') return reject(state, 'unknown-orb');
  const data: EquipmentData = { ...item.data, locked: !(item.data.locked ?? false) };
  const inventory: InventoryState<EquipmentData> = { ...state.gameData.inventory, [itemInstanceId]: { ...item, data } };
  const nextState: MinuteVanguardState = { ...state, gameData: { ...state.gameData, inventory } };
  return accept(nextState, [event(nextState, 'orbLockToggled', itemInstanceId, { locked: data.locked })]);
}

export function orbRerollCost(lockedStats: readonly StatKey[]): number {
  const uniqueCount = new Set(lockedStats).size;
  return ORB_REROLL_COSTS[Math.min(3, uniqueCount)] ?? ORB_REROLL_COSTS[3];
}

export function rerollOrbStats(
  state: MinuteVanguardState,
  itemInstanceId: string,
  lockedStats: readonly StatKey[],
): CommandResult<MinuteVanguardState, 'unknown-orb' | 'too-many-locked-stats' | 'invalid-locked-stat' | 'insufficient-gems'> {
  const item = state.gameData.inventory[itemInstanceId];
  if (item?.data?.kind !== 'orb' || item.data.orbRank === undefined || item.data.percentStats === undefined) return reject(state, 'unknown-orb');
  const uniqueLocked = [...new Set(lockedStats)];
  if (uniqueLocked.length > 3) return reject(state, 'too-many-locked-stats');
  if (uniqueLocked.some((key) => !STAT_KEYS.includes(key))) return reject(state, 'invalid-locked-stat');
  const cost = orbRerollCost(uniqueLocked);
  const spend = spendCurrency(state, ids.currency.gem, cost, `orb.reroll.${itemInstanceId}`);
  if (!spend.accepted) return reject(state, 'insufficient-gems');

  const totalPercent = STAT_KEYS.reduce((sum, key) => sum + (item.data?.percentStats?.[key] ?? 0), 0);
  const rerolled = rerollOrbAllocation(spend.state, totalPercent, item.data.percentStats, uniqueLocked);
  const data: EquipmentData = { ...item.data, percentStats: rerolled.percentStats };
  const inventory: InventoryState<EquipmentData> = {
    ...rerolled.state.gameData.inventory,
    [itemInstanceId]: { ...item, data },
  };
  const nextState: MinuteVanguardState = { ...rerolled.state, gameData: { ...rerolled.state.gameData, inventory } };
  return accept(nextState, [event(nextState, 'orbStatsRerolled', itemInstanceId, { cost, lockedStats: uniqueLocked })]);
}

export function orbCombineCost(parentRank: OrbRank): number | null {
  const currentIndex = orbRanks.indexOf(parentRank);
  if (currentIndex < 0 || currentIndex >= orbRanks.length - 1) return null;
  const target = orbRanks[currentIndex + 1];
  return target === undefined ? null : ORB_COMBINE_COST_BY_TARGET_RANK[target] ?? null;
}

export function combineOrb(
  state: MinuteVanguardState,
  parentId: string,
  materialIds: readonly string[],
): CommandResult<MinuteVanguardState, 'unknown-parent' | 'max-rank' | 'invalid-material-count' | 'invalid-material' | 'protected-material' | 'insufficient-gold'> {
  const parent = state.gameData.inventory[parentId];
  if (parent?.data?.kind !== 'orb' || parent.data.orbRank === undefined) return reject(state, 'unknown-parent');
  const parentRank = parent.data.orbRank;
  const rankIndex = orbRanks.indexOf(parentRank);
  if (rankIndex >= orbRanks.length - 1) return reject(state, 'max-rank');
  const uniqueMaterialIds = [...new Set(materialIds)];
  if (uniqueMaterialIds.length !== 4 || uniqueMaterialIds.includes(parentId)) return reject(state, 'invalid-material-count');

  const equippedOrbId = state.gameData.loadout.equipped.orb;
  const materials = uniqueMaterialIds.map((id) => state.gameData.inventory[id]);
  if (materials.some((item) => item?.data?.kind !== 'orb' || item.data.orbRank !== parentRank)) return reject(state, 'invalid-material');
  if (materials.some((item) => item === undefined || item.data === undefined || item.data.favorite === true || item.data.locked === true || item.instanceId === equippedOrbId)) {
    return reject(state, 'protected-material');
  }

  const targetRank = orbRanks[rankIndex + 1];
  if (targetRank === undefined) return reject(state, 'max-rank');
  const cost = ORB_COMBINE_COST_BY_TARGET_RANK[targetRank];
  if (cost === undefined) return reject(state, 'max-rank');
  const spend = spendCurrency(state, ids.currency.gold, cost, `orb.combine.${parentRank}.${targetRank}`);
  if (!spend.accepted) return reject(state, 'insufficient-gold');

  let nextState = spend.state;
  const rolled = rollOrbStatsForRank(nextState, targetRank);
  nextState = rolled.state;
  const parentEffectId = parent.data.effectId;
  let effectLevel = parent.data.effectLevel ?? inferOrbEffectLevel(parentEffectId, parent.data.effectValue);
  let effectValue = parent.data.effectValue;
  let effectUpgraded = false;
  const matchingEffectCount = parentEffectId === undefined
    ? 0
    : materials.filter((item) => item?.data?.effectId === parentEffectId).length;
  const ladder = parentEffectId === undefined ? undefined : KNOWN_ORB_EFFECT_LADDERS[parentEffectId];
  if (matchingEffectCount > 0 && ladder !== undefined && effectLevel < ladder.length) {
    const roll = draw(nextState, ids.rng.loot);
    nextState = roll.state;
    if (roll.value < Math.min(0.8, matchingEffectCount * 0.2)) {
      effectLevel += 1;
      effectValue = ladder[effectLevel - 1] ?? effectValue;
      effectUpgraded = true;
    }
  }

  let inventory: InventoryState<EquipmentData> = nextState.gameData.inventory;
  for (const materialId of uniqueMaterialIds) {
    const removed = removeItemInstance(inventory, materialId);
    if (!removed.accepted) throw new Error(`Validated orb material unexpectedly disappeared: ${materialId}`);
    inventory = removed.inventory;
  }
  const currentParent = inventory[parentId];
  if (currentParent?.data === undefined) throw new Error(`Validated orb parent unexpectedly disappeared: ${parentId}`);
  const parentData: EquipmentData = {
    ...currentParent.data,
    orbRank: targetRank,
    percentStats: rolled.percentStats,
    ...(currentParent.data.effectId === undefined ? {} : { effectLevel, effectValue }),
  };
  inventory = { ...inventory, [parentId]: { ...currentParent, data: parentData } };
  const combinedState: MinuteVanguardState = { ...nextState, gameData: { ...nextState.gameData, inventory } };
  return accept(combinedState, [event(combinedState, 'orbCombined', parentId, {
    fromRank: parentRank, targetRank, cost, materialIds: uniqueMaterialIds, matchingEffectCount, effectUpgraded,
  })]);
}

export function buyPermanentUpgrade(
  state: MinuteVanguardState,
  upgradeId: PermanentUpgradeId,
): CommandResult<MinuteVanguardState, 'unknown-upgrade' | 'already-owned' | 'insufficient-gems'> {
  const definition = permanentUpgradeDefinitions.find((candidate) => candidate.id === upgradeId);
  if (definition === undefined) return reject(state, 'unknown-upgrade');
  if (state.gameData.permanentUpgrades[upgradeId]) return reject(state, 'already-owned');
  const spend = spendCurrency(state, ids.currency.gem, definition.price, `shop.permanent.${upgradeId}`);
  if (!spend.accepted) return reject(state, 'insufficient-gems');
  const nextState = {
    ...spend.state,
    gameData: { ...spend.state.gameData, permanentUpgrades: { ...spend.state.gameData.permanentUpgrades, [upgradeId]: true } },
  };
  return accept(nextState, [event(nextState, 'permanentUpgradePurchased', upgradeId)]);
}

export function healAtInn(state: MinuteVanguardState): CommandResult<MinuteVanguardState, 'already-full' | 'insufficient-gold'> {
  const maxHp = playerCombatStats(state).hp;
  if (state.gameData.player.currentHp >= maxHp) return reject(state, 'already-full');
  const cost = Math.max(20, state.gameData.player.level * 8);
  const spend = spendCurrency(state, ids.currency.gold, cost, 'inn.heal');
  if (!spend.accepted) return reject(state, 'insufficient-gold');
  const nextState = { ...spend.state, gameData: { ...spend.state.gameData, player: { ...spend.state.gameData.player, currentHp: maxHp } } };
  return accept(nextState, [event(nextState, 'innHealed', `${state.gameData.player.level}`, { cost })]);
}

export function jobChangeCost(state: MinuteVanguardState): number {
  const currentCount = state.gameData.player.jobBonusCounts[state.gameData.player.jobId] ?? 0;
  return currentCount === 0 ? 30_000 : currentCount === 1 ? 200_000 : currentCount === 2 ? 1_000_000 : 5_000_000;
}

export function currentJobBonusRequirement(state: MinuteVanguardState): number {
  const count = state.gameData.player.jobBonusCounts[state.gameData.player.jobId] ?? 0;
  return count === 0 ? 30 : count === 1 ? 50 : count === 2 ? 100 : 200;
}

export function changeJob(
  state: MinuteVanguardState,
  jobId?: string,
): CommandResult<MinuteVanguardState, 'level-too-low' | 'job-locked' | 'insufficient-gold'> {
  if (state.gameData.player.level < 30) return reject(state, 'level-too-low');
  const target = availableJobs(state).find((candidate) => candidate.id === jobId) ?? availableJobs(state)[0];
  if (target === undefined) return reject(state, 'job-locked');
  const cost = jobChangeCost(state);
  const spend = spendCurrency(state, ids.currency.gold, cost, `job.change.${target.id}`);
  if (!spend.accepted) return reject(state, 'insufficient-gold');

  const requirement = currentJobBonusRequirement(state);
  const bonusEarned = state.gameData.player.level >= requirement;
  const totalBonusCount = Object.values(state.gameData.player.jobBonusCounts).reduce((sum, count) => sum + count, 0);
  const growthIncrease = totalBonusCount < 200 ? 5 : totalBonusCount < 300 ? 4 : 3;
  const jobBonusCounts = bonusEarned
    ? { ...state.gameData.player.jobBonusCounts, [state.gameData.player.jobId]: (state.gameData.player.jobBonusCounts[state.gameData.player.jobId] ?? 0) + 1 }
    : state.gameData.player.jobBonusCounts;
  const permanentStats = bonusEarned
    ? { ...state.gameData.player.permanentStats, hp: state.gameData.player.permanentStats.hp + 100 }
    : state.gameData.player.permanentStats;
  const nextStateBase: MinuteVanguardState = {
    ...spend.state,
    gameData: {
      ...spend.state.gameData,
      player: {
        ...spend.state.gameData.player,
        level: 1,
        exp: 0,
        currentHp: BASE_STATS.hp + permanentStats.hp,
        jobId: target.id,
        totalJobChanges: state.gameData.player.totalJobChanges + 1,
        jobBonusCounts,
        growthBonusPct: state.gameData.player.growthBonusPct + (bonusEarned ? growthIncrease : 0),
        baseStats: BASE_STATS,
        permanentStats,
      },
      titles: clearEquippedProgressiveTitles(spend.state.gameData.titles),
    },
  };
  return accept(nextStateBase, [event(nextStateBase, 'jobChanged', `${target.id}:${nextStateBase.gameData.player.totalJobChanges}`, { bonusEarned, cost })]);
}

export function goldBalance(state: MinuteVanguardState): number {
  return readCurrency(state.currencies, ids.currency.gold).toNumber();
}

export function gemBalance(state: MinuteVanguardState): number {
  return readCurrency(state.currencies, ids.currency.gem).toNumber();
}

export function titleCostLimitForLevel(level: number): number {
  const normalized = Math.max(1, Math.floor(level));
  // Public guide exposes these anchors but keeps the full step table inside the game UI.
  // Minute Vanguard interpolates only between verified anchors instead of pretending an unknown table is exact.
  const anchors = [[1, 4], [30, 10], [120, 16], [5000, 40]] as const;
  for (let index = 1; index < anchors.length; index += 1) {
    const previous = anchors[index - 1]!;
    const current = anchors[index]!;
    if (normalized <= current[0]) {
      const ratio = (normalized - previous[0]) / (current[0] - previous[0]);
      return Math.floor(previous[1] + ratio * (current[1] - previous[1]));
    }
  }
  return anchors.at(-1)![1];
}

export function titleLevel(state: MinuteVanguardState, titleId: string): number {
  return progressiveTitleLevelFromCopies(state.gameData.titles.copies[titleId] ?? 0, titleRules.copyThresholds);
}

export function titleEquipCost(state: MinuteVanguardState): number {
  return progressiveTitleTotalCost(state.gameData.titles, titleDefinitions);
}

export function dailyTitleOffers(state: MinuteVanguardState): readonly typeof titleDefinitions[number][] {
  const definitionsById = new Map(titleDefinitions.map((definition) => [definition.id, definition] as const));
  return state.gameData.titleShop.offeredTitleIds
    .map((titleId) => definitionsById.get(titleId))
    .filter((definition): definition is typeof titleDefinitions[number] => definition !== undefined);
}

export function buyDailyTitle(
  state: MinuteVanguardState,
  titleId: string,
): CommandResult<MinuteVanguardState, 'not-offered' | 'already-purchased' | 'already-maxed' | 'insufficient-gems'> {
  if (!dailyTitleOffers(state).some((definition) => definition.id === titleId)) return reject(state, 'not-offered');
  if (state.gameData.titleShop.purchasedTitleIds.includes(titleId)) return reject(state, 'already-purchased');
  if (titleLevel(state, titleId) >= titleRules.copyThresholds.length) return reject(state, 'already-maxed');
  const spend = spendCurrency(state, ids.currency.gem, TITLE_SHOP_PRICE, `title.shop.${titleId}`);
  if (!spend.accepted) return reject(state, 'insufficient-gems');
  const acquired = addProgressiveTitleCopy(spend.state.gameData.titles, titleId, titleRules);
  const nextState: MinuteVanguardState = {
    ...spend.state,
    gameData: {
      ...spend.state.gameData,
      titles: acquired.collection,
      titleShop: {
        ...spend.state.gameData.titleShop,
        purchasedTitleIds: [...spend.state.gameData.titleShop.purchasedTitleIds, titleId],
      },
    },
  };
  return accept(nextState, [event(nextState, 'dailyTitlePurchased', titleId, { price: TITLE_SHOP_PRICE, copies: acquired.copies, level: acquired.level })]);
}

export function equipOwnedTitle(
  state: MinuteVanguardState,
  titleId: string,
  level = titleLevel(state, titleId),
): CommandResult<MinuteVanguardState, 'unknown-title' | 'not-owned' | 'invalid-level' | 'already-equipped' | 'slot-limit' | 'cost-limit'> {
  const result = equipProgressiveTitle({
    collection: state.gameData.titles,
    definitions: titleDefinitions,
    rules: titleRules,
    titleId,
    level,
    costLimit: titleCostLimitForLevel(state.gameData.player.level),
  });
  if (!result.accepted) return reject(state, result.reason);
  const nextState = { ...state, gameData: { ...state.gameData, titles: result.collection } };
  return accept(nextState, [event(nextState, 'titleEquipped', titleId, { level })]);
}

export function setEquippedTitleLevel(
  state: MinuteVanguardState,
  titleId: string,
  level: number,
): CommandResult<MinuteVanguardState, 'not-equipped' | 'invalid-level'> {
  const result = updateProgressiveTitleLevel({ collection: state.gameData.titles, rules: titleRules, titleId, level });
  if (!result.accepted) return reject(state, result.reason);
  const nextState = { ...state, gameData: { ...state.gameData, titles: result.collection } };
  return accept(nextState, [event(nextState, 'titleLevelChanged', titleId, { level })]);
}

export function moveEquippedTitle(state: MinuteVanguardState, titleId: string, targetIndex: number): MinuteVanguardState {
  const titles = reorderProgressiveTitle(state.gameData.titles, titleId, targetIndex);
  return titles === state.gameData.titles ? state : { ...state, gameData: { ...state.gameData, titles } };
}

export function unequipOwnedTitle(
  state: MinuteVanguardState,
  titleId: string,
): CommandResult<MinuteVanguardState, 'locked-until-job-change'> {
  if (state.gameData.player.jobId !== 'job.adventurer') return reject(state, 'locked-until-job-change');
  const titles = unequipProgressiveTitle(state.gameData.titles, titleId);
  const nextState = titles === state.gameData.titles ? state : { ...state, gameData: { ...state.gameData, titles } };
  return accept(nextState, [event(nextState, 'titleUnequipped', titleId)]);
}

export function resetEquippedTitles(
  state: MinuteVanguardState,
): CommandResult<MinuteVanguardState, 'insufficient-gems'> {
  if (state.gameData.titles.equipped.length === 0) return accept(state, []);
  if (state.gameData.player.jobId === 'job.adventurer') {
    const nextState = { ...state, gameData: { ...state.gameData, titles: clearEquippedProgressiveTitles(state.gameData.titles) } };
    return accept(nextState, [event(nextState, 'titlesReset', 'free')]);
  }
  const spend = spendCurrency(state, ids.currency.gem, TITLE_RESET_COST, 'title.reset');
  if (!spend.accepted) return reject(state, 'insufficient-gems');
  const nextState = { ...spend.state, gameData: { ...spend.state.gameData, titles: clearEquippedProgressiveTitles(spend.state.gameData.titles) } };
  return accept(nextState, [event(nextState, 'titlesReset', 'paid', { price: TITLE_RESET_COST })]);
}

export function toggleTitleFavorite(state: MinuteVanguardState, titleId: string): MinuteVanguardState {
  const favorite = state.gameData.favoriteTitleIds.includes(titleId);
  const favoriteTitleIds = favorite
    ? state.gameData.favoriteTitleIds.filter((id) => id !== titleId)
    : [...state.gameData.favoriteTitleIds, titleId];
  return { ...state, gameData: { ...state.gameData, favoriteTitleIds } };
}

export function claimDailyMission(
  state: MinuteVanguardState,
  missionId: string,
): CommandResult<MinuteVanguardState, 'unknown-mission' | 'not-complete' | 'already-claimed'> {
  const missions = {
    battles: { complete: state.gameData.missionProgress.battles >= 3, reward: 3 },
    wins: { complete: state.gameData.missionProgress.wins >= 2, reward: 3 },
    upgrades: { complete: state.gameData.missionProgress.upgrades >= 1, reward: 4 },
    level: { complete: state.gameData.player.level >= 5, reward: 5 },
    discoveries: { complete: state.gameData.discoveredEnemyIds.length >= 3, reward: 5 },
  } as const;
  const mission = missions[missionId as keyof typeof missions];
  if (mission === undefined) return reject(state, 'unknown-mission');
  if (state.gameData.missionProgress.claimed.includes(missionId)) return reject(state, 'already-claimed');
  if (!mission.complete) return reject(state, 'not-complete');
  const rewarded = grantCurrency(state, ids.currency.gem, mission.reward, `mission.daily.${missionId}`);
  const nextState: MinuteVanguardState = {
    ...rewarded,
    gameData: {
      ...rewarded.gameData,
      missionProgress: {
        ...rewarded.gameData.missionProgress,
        claimed: [...rewarded.gameData.missionProgress.claimed, missionId],
      },
    },
  };
  return accept(nextState, [event(nextState, 'dailyMissionClaimed', missionId, { reward: mission.reward })]);
}

export function setActivePet(
  state: MinuteVanguardState,
  enemyId: string,
  active: boolean,
): CommandResult<MinuteVanguardState, 'pet-not-owned' | 'party-full'> {
  if (!state.gameData.ownedPetEnemyIds.includes(enemyId)) return reject(state, 'pet-not-owned');
  const current = state.gameData.activePetEnemyIds;
  const alreadyActive = current.includes(enemyId);
  if (active === alreadyActive) return accept(state, []);
  if (active) {
    const maxActive = currentJob(state).id === 'job.tamer' ? 2 : 1;
    if (current.length >= maxActive) return reject(state, 'party-full');
  }
  const activePetEnemyIds = active ? [...current, enemyId] : current.filter((id) => id !== enemyId);
  const nextState: MinuteVanguardState = { ...state, gameData: { ...state.gameData, activePetEnemyIds } };
  return accept(nextState, [event(nextState, active ? 'petActivated' : 'petDeactivated', enemyId)]);
}

function normalCooldownSec(state: MinuteVanguardState): number {
  if (isTimeBoostActive(state, 'rush')) return 10;
  const base = state.gameData.permanentUpgrades.cooldownReduction ? 50 : 60;
  return Math.max(45, base - Math.min(5, Math.max(0, Math.round(orbEffectValue(state, 'cooldown')))));
}

function selectEnemy(state: MinuteVanguardState): Readonly<{ state: MinuteVanguardState; enemy: EnemyDefinition }> {
  const maxMonsterLevel = state.gameData.player.level >= 30 ? 2 : 1;
  const levelPool = enemies.filter((enemy) => enemy.monsterLevel <= maxMonsterLevel);
  if (state.gameData.rareGuaranteeActive) {
    const roll = draw(state, ids.rng.encounter);
    const rarity: MonsterRarity = roll.value < 0.67 ? 'rare' : roll.value < 0.91 ? 'epic' : roll.value < 0.977 ? 'legendary' : 'boss';
    const candidates = levelPool.filter((enemy) => enemy.rarity === rarity);
    const fallback = levelPool.filter((enemy) => rarityOrder.indexOf(enemy.rarity) >= rarityOrder.indexOf('rare'));
    const source = candidates.length > 0 ? candidates : fallback;
    const pick = draw(roll.state, ids.rng.encounter);
    return { state: pick.state, enemy: source[Math.min(source.length - 1, Math.floor(pick.value * source.length))] ?? levelPool[0]! };
  }

  const beginner = state.gameData.victories < BEGINNER_FAST_KILLS;
  const available = beginner
    ? levelPool.filter((enemy) => ['common', 'uncommon'].includes(enemy.rarity))
    : levelPool;
  const rarityRoll = draw(state, ids.rng.encounter);
  const rarity = rollNormalRarity(rarityRoll.value, beginner);
  const candidates = available.filter((enemy) => enemy.rarity === rarity);
  const source = candidates.length > 0 ? candidates : available;
  const pick = draw(rarityRoll.state, ids.rng.encounter);
  return { state: pick.state, enemy: source[Math.min(source.length - 1, Math.floor(pick.value * source.length))] ?? enemies[0]! };
}

function applyExperience(state: MinuteVanguardState, gained: number): Readonly<{ state: MinuteVanguardState; growths: readonly LevelGrowthResult[]; leveledUp: boolean }> {
  let nextState = state;
  let level = state.gameData.player.level;
  let exp = state.gameData.player.exp + gained;
  const baseStats: Record<StatKey, number> = { ...state.gameData.player.baseStats };
  const growths: LevelGrowthResult[] = [];
  const job = currentJob(state);

  while (exp >= expRequiredForNextLevel(level)) {
    exp -= expRequiredForNextLevel(level);
    level += 1;
    const greatRoll = draw(nextState, ids.rng.growth); nextState = greatRoll.state;
    const greatChance = Math.min(0.2, 0.05 + orbEffectValue(nextState, 'greatGrowth') / 100);
    const greatGrowth = greatRoll.value < greatChance;
    const gains = zeroStats();
    for (const key of STAT_KEYS) {
      const roll = draw(nextState, ids.rng.growth); nextState = roll.state;
      const variation = 0.7 + roll.value * 0.6;
      const permanentGrowth = 1 + state.gameData.player.growthBonusPct / 100;
      gains[key] = Math.max(1, Math.round(job.growth[key] * variation * permanentGrowth * (greatGrowth ? 2 : 1)));
      baseStats[key] += gains[key];
    }
    growths.push({ level, greatGrowth, gains });
  }

  nextState = {
    ...nextState,
    gameData: { ...nextState.gameData, player: { ...nextState.gameData.player, level, exp, baseStats } },
  };
  return { state: nextState, growths, leveledUp: growths.length > 0 };
}

function rollPermanentStat(state: MinuteVanguardState): Readonly<{ state: MinuteVanguardState; reward: PermanentStatReward }> {
  const statRoll = draw(state, ids.rng.loot);
  const stat = STAT_KEYS[Math.min(STAT_KEYS.length - 1, Math.floor(statRoll.value * STAT_KEYS.length))]!;
  const amountRoll = draw(statRoll.state, ids.rng.loot);
  const amount = stat === 'hp' ? 5 + Math.floor(amountRoll.value * 11) : 1 + Math.floor(amountRoll.value * 3);
  const permanentStats = { ...amountRoll.state.gameData.player.permanentStats, [stat]: amountRoll.state.gameData.player.permanentStats[stat] + amount };
  return {
    state: { ...amountRoll.state, gameData: { ...amountRoll.state.gameData, player: { ...amountRoll.state.gameData.player, permanentStats } } },
    reward: { stat, amount },
  };
}

function createEquipmentDrop(state: MinuteVanguardState, enemy: EnemyDefinition): Readonly<{ state: MinuteVanguardState; itemInstanceId: string }> {
  const kindRoll = draw(state, ids.rng.loot);
  const weapon = kindRoll.value < 0.5;
  const magic = enemy.attackType === 'magic';
  const definitionId = weapon ? (magic ? ids.item.arcaneRod : ids.item.ironSword) : (magic ? ids.item.mysticRobe : ids.item.ironMail);
  const tier = rarityOrder.indexOf(enemy.rarity) + 1;
  const data: EquipmentData = {
    kind: weapon ? 'weapon' : 'armor', rarity: enemy.rarity, upgradeRank: 0,
    flatStats: weapon ? (magic ? { magicAttack: 4 + tier * 3 } : { attack: 4 + tier * 3 }) : (magic ? { magicDefense: 3 + tier * 3 } : { defense: 3 + tier * 3 }),
    source: `drop.${enemy.id}`,
  };
  return grantItem(kindRoll.state, definitionId, data);
}

function createOrb(state: MinuteVanguardState, sourceRarity: MonsterRarity, forceEffect: boolean, minimumRank?: OrbRank): Readonly<{ state: MinuteVanguardState; itemInstanceId: string }> {
  const rankRoll = draw(state, ids.rng.loot);
  const rarityBoost = rarityOrder.indexOf(sourceRarity);
  const rankIndex = Math.min(orbRanks.length - 1, Math.floor(rankRoll.value * 5) + Math.floor(rarityBoost / 2));
  const minimumIndex = minimumRank === undefined ? 0 : orbRanks.indexOf(minimumRank);
  const finalRankIndex = Math.max(rankIndex, minimumIndex);
  const rank = orbRanks[finalRankIndex] ?? 'F';
  const rolled = rollOrbStatsForRank(rankRoll.state, rank);
  let nextState = rolled.state;
  const effectRoll = draw(nextState, ids.rng.loot); nextState = effectRoll.state;
  let effectId: OrbEffectId | undefined;
  let effectValue: number | undefined;
  let effectLevel: number | undefined;
  if (forceEffect || effectRoll.value < 0.1) {
    const effectNames: readonly OrbEffectId[] = ['gemDrop', 'goldProtection', 'gold', 'exp', 'drawExp', 'regen', 'greatGrowth', 'critical', 'evasion', 'cooldown'];
    const pick = draw(nextState, ids.rng.loot); nextState = pick.state;
    effectId = effectNames[Math.min(effectNames.length - 1, Math.floor(pick.value * effectNames.length))]!;
    const ladder = KNOWN_ORB_EFFECT_LADDERS[effectId];
    if (ladder !== undefined) {
      // The public docs define the value ladders, but not their rank-by-rank distribution.
      effectLevel = Math.min(effectId === 'cooldown' ? 3 : ladder.length, 1 + Math.floor(finalRankIndex / 2));
      effectValue = ladder[effectLevel - 1] ?? ladder[0];
    } else {
      // Keep non-published ladders on their existing benchmark values rather than inventing reference values.
      effectLevel = 1;
      effectValue = effectId === 'drawExp' ? 1 : Math.max(1, 3 + finalRankIndex * 2);
    }
  }
  const data: EquipmentData = {
    kind: 'orb', rarity: sourceRarity, upgradeRank: 0, flatStats: {}, percentStats: rolled.percentStats, orbRank: rank,
    ...(effectId === undefined || effectValue === undefined || effectLevel === undefined ? {} : { effectId, effectValue, effectLevel }),
    favorite: false, locked: false, source: 'orb',
  };
  return grantItem(nextState, ids.item.orb, data);
}

function rollOrbStatsForRank(
  state: MinuteVanguardState,
  rank: OrbRank,
): Readonly<{ state: MinuteVanguardState; percentStats: StatValues }> {
  const range = orbPercentByRank[rank];
  const totalRoll = draw(state, ids.rng.loot);
  const totalPercent = Math.round(range[0] + totalRoll.value * (range[1] - range[0]));
  return rerollOrbAllocation(totalRoll.state, totalPercent, {}, []);
}

function rerollOrbAllocation(
  state: MinuteVanguardState,
  totalPercent: number,
  currentStats: Partial<StatValues>,
  lockedStats: readonly StatKey[],
): Readonly<{ state: MinuteVanguardState; percentStats: StatValues }> {
  const locked = new Set(lockedStats);
  const percentStats = zeroStats();
  let lockedTotal = 0;
  for (const key of STAT_KEYS) {
    if (!locked.has(key)) continue;
    const value = Math.max(0, currentStats[key] ?? 0);
    percentStats[key] = value;
    lockedTotal += value;
  }
  const remainingTotal = Math.max(0, totalPercent - lockedTotal);
  const openKeys = STAT_KEYS.filter((key) => !locked.has(key));
  let nextState = state;
  const weights: number[] = [];
  let weightTotal = 0;
  for (let index = 0; index < openKeys.length; index += 1) {
    const roll = draw(nextState, ids.rng.loot);
    nextState = roll.state;
    const weight = 0.15 + roll.value;
    weights.push(weight);
    weightTotal += weight;
  }
  let allocated = 0;
  openKeys.forEach((key, index) => {
    const value = index === openKeys.length - 1
      ? remainingTotal - allocated
      : Math.max(0, Math.floor(remainingTotal * (weights[index] ?? 0) / weightTotal));
    percentStats[key] = value;
    allocated += value;
  });
  return { state: nextState, percentStats };
}

function inferOrbEffectLevel(effectId: OrbEffectId | undefined, effectValue: number | undefined): number {
  if (effectId === undefined || effectValue === undefined) return 0;
  const ladder = KNOWN_ORB_EFFECT_LADDERS[effectId];
  if (ladder === undefined) return 1;
  const exact = ladder.indexOf(effectValue);
  if (exact >= 0) return exact + 1;
  let nearest = 0;
  for (let index = 1; index < ladder.length; index += 1) {
    if (Math.abs((ladder[index] ?? 0) - effectValue) < Math.abs((ladder[nearest] ?? 0) - effectValue)) nearest = index;
  }
  return nearest + 1;
}
function grantItem(state: MinuteVanguardState, definitionId: string, data: EquipmentData): Readonly<{ state: MinuteVanguardState; itemInstanceId: string }> {
  const itemInstanceId = `${definitionId}:${state.gameData.nextItemSequence}`;
  const item: ItemInstanceState<EquipmentData> = { instanceId: itemInstanceId, definitionId, quantity: 1, data };
  const added = addItemInstance(state.gameData.inventory, item);
  if (!added.accepted) throw new Error(`Failed to grant item ${itemInstanceId}: ${added.reason}`);
  return {
    state: { ...state, gameData: { ...state.gameData, inventory: added.inventory, nextItemSequence: state.gameData.nextItemSequence + 1 } },
    itemInstanceId,
  };
}

function orbEffectValue(state: MinuteVanguardState, effectId: string): number {
  const orbId = state.gameData.loadout.equipped.orb;
  if (orbId === null || orbId === undefined) return 0;
  const orb = state.gameData.inventory[orbId]?.data;
  return orb?.effectId === effectId ? orb.effectValue ?? 0 : 0;
}

function titleEffectValue(state: MinuteVanguardState, effectFamily: TitleEffectFamily): number {
  let strongest = 0;
  for (const equipped of state.gameData.titles.equipped) {
    const definition = titleDefinitions.find((candidate) => candidate.id === equipped.titleId);
    if (definition?.effectFamily !== effectFamily) continue;
    const value = definition.values[Math.max(0, Math.min(4, equipped.level - 1))] ?? 0;
    strongest = Math.max(strongest, value);
  }
  return strongest;
}

function computeDailyTitleOfferIds(
  dayKey: string,
  collection: ReturnType<typeof createProgressiveTitleCollection>,
): readonly string[] {
  const maxCopies = titleRules.copyThresholds.at(-1)!;
  return titleDefinitions
    .filter((definition) => (collection.copies[definition.id] ?? 0) < maxCopies)
    .map((definition) => ({ id: definition.id, order: hashString(`${dayKey}:${definition.id}`) }))
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .slice(0, 3)
    .map((entry) => entry.id);
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function rollNormalRarity(value: number, beginner: boolean): MonsterRarity {
  if (beginner) return value < 0.72 ? 'common' : 'uncommon';
  if (value < 0.55) return 'common';
  if (value < 0.80) return 'uncommon';
  if (value < 0.92) return 'rare';
  if (value < 0.97) return 'epic';
  if (value < 0.99) return 'legendary';
  return 'boss';
}

function rollJackpotMultiplier(value: number): number {
  if (value < 0.003) return 10;
  if (value < 0.013) return 5;
  if (value < 0.043) return 3;
  if (value < 0.123) return 2;
  return 1;
}

function gamblerMultiplier(value: number): number {
  if (value < 0.002) return 100;
  if (value < 0.02) return 12;
  if (value < 0.12) return 5;
  if (value < 0.42) return 2;
  if (value < 0.72) return 1;
  return 0.2;
}

function damage(power: number, defense: number, variance: number, multiplier: number): number {
  return Math.max(1, Math.round(Math.max(1, power - defense * 0.55) * variance * multiplier));
}

function jstDayKey(wallClockMs: number): string {
  const shifted = new Date(wallClockMs + 9 * 60 * 60 * 1_000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

function zeroStats(): Record<StatKey, number> {
  return { hp: 0, attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, luck: 0 };
}

function addPartialStats(target: Record<StatKey, number>, source: Partial<StatValues>): void {
  for (const key of STAT_KEYS) target[key] += source[key] ?? 0;
}

function draw(state: MinuteVanguardState, streamName: string): Readonly<{ state: MinuteVanguardState; value: number }> {
  const stream = state.rngStreams[streamName];
  if (stream === undefined) throw new Error(`Missing RNG stream ${streamName}`);
  const result = nextRandom(stream);
  return { value: result.value, state: { ...state, rngStreams: { ...state.rngStreams, [streamName]: result.stream } } };
}

function grantCurrency(state: MinuteVanguardState, currencyId: string, amount: number, source: string): MinuteVanguardState {
  return applyRewards(state, [{ type: 'currency', currencyId, amount, source }], { resolveCurrencyDefinition }) as MinuteVanguardState;
}

function spendCurrency(
  state: MinuteVanguardState,
  currencyId: string,
  amount: number,
  source: string,
): Readonly<{ accepted: true; state: MinuteVanguardState }> | Readonly<{ accepted: false; state: MinuteVanguardState }> {
  const transaction = applyCurrencyTransaction(state.currencies, { currencyId, amount, kind: 'spend', source }, resolveCurrencyDefinition(currencyId));
  if (!transaction.accepted) return { accepted: false, state };
  let nextState = { ...state, currencies: transaction.balances } as MinuteVanguardState;
  nextState = recordCurrencySpend(nextState, currencyId, transaction.appliedAmount) as MinuteVanguardState;
  return { accepted: true, state: nextState };
}

function resolveCurrencyDefinition(currencyId: string): CurrencyDefinition | undefined {
  return currencyById.get(currencyId);
}

function event(state: MinuteVanguardState, type: string, key: string, payload?: Readonly<Record<string, unknown>>): DomainEvent {
  return { id: `${type}:${key}:${state.simTimeSec}`, type, simTimeSec: state.simTimeSec, ...(payload === undefined ? {} : { payload }) };
}

function accept(state: MinuteVanguardState, events: readonly DomainEvent[]): CommandResult<MinuteVanguardState, never> {
  return { accepted: true, state, events };
}

function reject<TReason extends string>(state: MinuteVanguardState, reason: TReason): CommandResult<MinuteVanguardState, TReason> {
  return { accepted: false, state, events: [], reason };
}

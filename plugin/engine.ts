import {
  GameNumber,
  addItemInstance,
  applyCurrencyTransaction,
  applyRewards,
  consumeCooldown,
  createCooldownState,
  createLoadoutState,
  createRngStreams,
  equipItem,
  nextRandom,
  previewCooldown,
  readCurrency,
  recordCurrencySpend,
  reduceCooldown,
  removeItemInstance,
  resolveOfflineElapsed,
  unequipItem,
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
import type {
  BattleResult,
  BattleTurn,
  EnemyDefinition,
  EquipmentData,
  JobDefinition,
  LevelGrowthResult,
  MinuteVanguardState,
  MonsterRarity,
  OrbRank,
  PermanentStatReward,
  StatKey,
  StatValues,
} from '../definitions/types';

const SCHEMA_VERSION = 2;
const MAX_BATTLE_TURNS = 20;
const BEGINNER_FAST_KILLS = 10;
const STAT_KEYS: readonly StatKey[] = ['hp', 'attack', 'defense', 'magicAttack', 'magicDefense', 'luck'];
const BASE_STATS: StatValues = { hp: 100, attack: 12, defense: 8, magicAttack: 10, magicDefense: 8, luck: 10 };
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
        cooldownReduction: false,
        expMultiplier: false,
        goldMultiplier: false,
        orbDropMultiplier: false,
        drawExpMultiplier: false,
      },
      ownedPetEnemyIds: [],
      activePetEnemyIds: [],
      missionProgress: { dayKey: jstDayKey(nowMs), battles: 0, wins: 0, upgrades: 0, claimed: [] },
    },
  };
}

/** Old public prototype saves are intentionally upgraded into the richer v1 schema. */
export function normalizeLoadedState(state: MinuteVanguardState, nowMs = Date.now()): MinuteVanguardState {
  if (state.schemaVersion === SCHEMA_VERSION && state.definitionVersion === definitionVersion) return state;
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
      },
    };
  }
  return { state: nextState, appliedOfflineSec: elapsed.appliedElapsedSec };
}

export function battleCooldown(state: MinuteVanguardState): CooldownPreview {
  return previewCooldown(battleCooldownDefinition, state.gameData.battleCooldown, state.simTimeSec);
}

export function effectiveBattleCooldownSec(state: MinuteVanguardState): number {
  if (state.gameData.victories < BEGINNER_FAST_KILLS && state.gameData.lastBattle?.outcome !== 'defeat') return 5;
  const base = state.gameData.permanentUpgrades.cooldownReduction ? 50 : 60;
  const orbReduction = Math.min(5, Math.max(0, Math.round(orbEffectValue(state, 'cooldown'))));
  return Math.max(45, base - orbReduction);
}

export function cooldownSkipCost(state: MinuteVanguardState): number {
  const remaining = battleCooldown(state).remainingSec;
  return remaining <= 0 ? 0 : Math.min(6, Math.max(1, Math.ceil(remaining / 10)));
}

export function skipBattleCooldown(
  state: MinuteVanguardState,
): CommandResult<MinuteVanguardState, 'already-ready' | 'insufficient-gems'> {
  const preview = battleCooldown(state);
  if (preview.ready) return reject(state, 'already-ready');
  const cost = cooldownSkipCost(state);
  const spend = spendCurrency(state, ids.currency.gem, cost, 'battle.cooldown-skip');
  if (!spend.accepted) return reject(state, 'insufficient-gems');
  const reduced = reduceCooldown({ cooldown: spend.state.gameData.battleCooldown, simTimeSec: state.simTimeSec, reductionSec: preview.remainingSec });
  const nextState = { ...spend.state, gameData: { ...spend.state.gameData, battleCooldown: reduced } };
  return accept(nextState, [event(nextState, 'battleCooldownSkipped', `${state.gameData.totalBattles}`, { cost })]);
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
    const critChance = Math.min(0.45, 0.05 + stats.luck / (stats.luck + 240) * 0.25 + orbEffectValue(nextState, 'critical') / 100);
    const critical = critRoll.value < critChance;
    let skillMultiplier = 1;
    if (job.id === 'job.warrior' && playerHp / maxHp <= 0.3) skillMultiplier *= 2;
    if (job.id === 'job.gambler') skillMultiplier *= gamblerMultiplier(skillRoll.value);
    if (job.id === 'job.wraith') {
      wraithMultiplier = Math.min(10, wraithMultiplier * 1.5);
      skillMultiplier *= wraithMultiplier;
    }
    let playerDamage = damage(offensive * skillMultiplier, enemyGuard, variance, critical ? 1.8 : 1);

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
      const petBase = Math.max(1, Math.round((stats.attack + stats.magicAttack) * 0.14 * (job.id === 'job.tamer' ? 1.4 : 1)));
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
      enemySpecial = specialRoll.value < enemy.specialChance;
      if (dodged) {
        logs.push(`${enemy.displayName}の攻撃を回避！`);
      } else {
        const enemyPower = (enemy.attackType === 'magic' ? enemy.magicAttack : enemy.attack) * mutationStat;
        const guard = enemy.attackType === 'magic' ? stats.magicDefense : stats.defense;
        enemyDamage = damage(enemyPower * (enemySpecial ? 1.75 : 1), guard, 1, 1);
        playerHp = Math.max(0, playerHp - enemyDamage);
        logs.push(`${enemy.displayName}${enemySpecial ? 'の必殺技' : 'の攻撃'}！ ${enemyDamage} ダメージ！`);
        if (job.id === 'job.wraith') wraithMultiplier = Math.max(1, wraithMultiplier / 3);
      }
    }

    let heal = 0;
    if (playerHp > 0 && job.id === 'job.priest') heal += Math.max(1, Math.floor(maxHp * 0.05));
    if (playerHp > 0) heal += Math.max(0, Math.floor(maxHp * orbEffectValue(nextState, 'regen') / 100));
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

  if (outcome === 'victory') {
    streak = nextState.gameData.lastDefeatedEnemyId === enemy.id ? nextState.gameData.consecutiveDefeats + 1 : 1;
    streakMultiplier = streak >= 5 ? 2 : streak >= 3 ? 1.5 : streak >= 2 ? 1.2 : 1;
    const jackpotRoll = draw(nextState, ids.rng.loot); nextState = jackpotRoll.state;
    jackpotMultiplier = rollJackpotMultiplier(jackpotRoll.value);
    const goldMultiplier = (nextState.gameData.permanentUpgrades.goldMultiplier ? 1.2 : 1) * (1 + orbEffectValue(nextState, 'gold') / 100);
    goldDelta = Math.max(1, Math.round(enemy.gold * rewardMultiplier * streakMultiplier * jackpotMultiplier * goldMultiplier));
    if (job.id === 'job.thief') goldDelta += Math.max(1, Math.round(stats.luck * 0.35));
    expGained = Math.max(1, Math.round(enemy.exp * rewardMultiplier * (nextState.gameData.permanentUpgrades.expMultiplier ? 1.2 : 1) * (1 + orbEffectValue(nextState, 'exp') / 100)));
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
    if (orbRoll.value < orbRate) {
      const dropped = createOrb(nextState, enemy.rarity, false);
      nextState = dropped.state;
      droppedOrbInstanceId = dropped.itemInstanceId;
    }

    const killsAfterThisBattle = (nextState.gameData.killCounts[enemy.id] ?? 0) + 1;
    if (killsAfterThisBattle >= 30 && !nextState.gameData.ownedPetEnemyIds.includes(enemy.id)) {
      const captureRoll = draw(nextState, ids.rng.loot);
      nextState = captureRoll.state;
      const captureChance = 0.01 * (job.id === 'job.tamer' ? 1.5 : 1);
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

    const leveled = applyExperience(nextState, expGained);
    nextState = leveled.state;
    levelGrowths = leveled.growths;
    playerHp = leveled.leveledUp ? playerCombatStats(nextState).hp : playerHp;
  } else if (outcome === 'draw') {
    const drawRatio = nextState.gameData.permanentUpgrades.drawExpMultiplier || orbEffectValue(nextState, 'drawExp') > 0 ? 0.1 : 0.05;
    expGained = Math.max(1, Math.round(enemy.exp * rewardMultiplier * drawRatio));
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
): CommandResult<MinuteVanguardState, 'unknown-item'> {
  if (state.gameData.inventory[itemInstanceId] === undefined) return reject(state, 'unknown-item');
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

export function drawOrb(
  state: MinuteVanguardState,
  count: 1 | 10,
): CommandResult<MinuteVanguardState, 'insufficient-gems'> {
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
  const range = orbPercentByRank[rank];
  const totalRoll = draw(rankRoll.state, ids.rng.loot);
  const totalPercent = Math.round(range[0] + totalRoll.value * (range[1] - range[0]));
  let nextState = totalRoll.state;
  const weights: number[] = [];
  let weightTotal = 0;
  for (let index = 0; index < STAT_KEYS.length; index += 1) {
    const roll = draw(nextState, ids.rng.loot); nextState = roll.state;
    const weight = 0.15 + roll.value;
    weights.push(weight); weightTotal += weight;
  }
  const percentStats = zeroStats();
  let allocated = 0;
  STAT_KEYS.forEach((key, index) => {
    const value = index === STAT_KEYS.length - 1 ? totalPercent - allocated : Math.max(0, Math.round(totalPercent * (weights[index] ?? 0) / weightTotal));
    percentStats[key] = value; allocated += value;
  });
  const effectRoll = draw(nextState, ids.rng.loot); nextState = effectRoll.state;
  let effectId: string | undefined;
  let effectValue: number | undefined;
  if (forceEffect || effectRoll.value < 0.1) {
    const effectNames = ['gemDrop', 'goldProtection', 'gold', 'exp', 'drawExp', 'regen', 'greatGrowth', 'critical', 'evasion', 'cooldown'] as const;
    const pick = draw(nextState, ids.rng.loot); nextState = pick.state;
    effectId = effectNames[Math.min(effectNames.length - 1, Math.floor(pick.value * effectNames.length))]!;
    effectValue = effectId === 'cooldown' ? 1 + Math.floor(finalRankIndex / 3) : Math.max(1, 3 + finalRankIndex * 2);
  }
  const data: EquipmentData = {
    kind: 'orb', rarity: sourceRarity, upgradeRank: 0, flatStats: {}, percentStats, orbRank: rank,
    ...(effectId === undefined || effectValue === undefined ? {} : { effectId, effectValue }), source: 'orb',
  };
  return grantItem(nextState, ids.item.orb, data);
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

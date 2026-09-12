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
  resolveOfflineElapsed,
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
  loadoutDefinition,
  shopOffers,
  vocations,
} from '../definitions/game-definitions';
import type {
  BattleResult,
  EnemyDefinition,
  EquipmentData,
  EquipmentRarity,
  MinuteVanguardState,
} from '../definitions/types';

const SCHEMA_VERSION = 0;
const MAX_BATTLE_TURNS = 12;
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
      [ids.currency.shard]: GameNumber.zero().serialize(),
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
    statistics: { lifetimeCurrencyEarned: {}, lifetimeCurrencySpent: {} },
    gameData: {
      player: {
        level: 1,
        exp: 0,
        jobRank: 0,
        vocationId: vocations[0]!.id,
        baseAttack: 10,
        baseDefense: 4,
        baseHp: 70,
        permanentPower: 0,
      },
      battleCooldown: createCooldownState(),
      inventory: {},
      loadout: createLoadoutState(loadoutDefinition),
      totalBattles: 0,
      victories: 0,
      defeats: 0,
      discoveredEnemyIds: [],
      nextItemSequence: 1,
      lastBattle: null,
    },
  };
}

/** Advance wall-clock time through the same authoritative simulation clock used by cooldowns. */
export function advanceFromWallClock(
  state: MinuteVanguardState,
  currentWallClockMs: number,
  policy: OfflineTimePolicy = {},
): Readonly<{ state: MinuteVanguardState; appliedOfflineSec: number }> {
  const elapsed = resolveOfflineElapsed(state.lastWallClockMs, currentWallClockMs, policy);
  if (elapsed.observedElapsedSec === 0) return { state, appliedOfflineSec: 0 };
  return {
    state: {
      ...state,
      simTimeSec: state.simTimeSec + elapsed.appliedElapsedSec,
      lastWallClockMs: elapsed.nextWallClockMs,
    },
    appliedOfflineSec: elapsed.appliedElapsedSec,
  };
}

export function battleCooldown(state: MinuteVanguardState): CooldownPreview {
  return previewCooldown(battleCooldownDefinition, state.gameData.battleCooldown, state.simTimeSec);
}

export function effectiveBattleCooldownSec(state: MinuteVanguardState): number {
  // The opening teaches the loop quickly; normal cadence begins after three resolved battles.
  if (state.gameData.totalBattles < 3) return 5;
  const vocation = currentVocation(state);
  return Math.max(30, battleCooldownDefinition.durationSec - vocation.cooldownReductionSec);
}

export function playerCombatStats(state: MinuteVanguardState): Readonly<{ hp: number; attack: number; defense: number }> {
  const equipment = Object.values(state.gameData.inventory);
  const equippedIds = new Set(Object.values(state.gameData.loadout.equipped).filter((id): id is string => id !== null));
  let itemAttack = 0;
  let itemDefense = 0;
  for (const item of equipment) {
    if (!equippedIds.has(item.instanceId)) continue;
    itemAttack += item.data?.attack ?? 0;
    itemDefense += item.data?.defense ?? 0;
  }
  const player = state.gameData.player;
  const vocation = currentVocation(state);
  return {
    hp: player.baseHp + (player.level - 1) * 7 + player.jobRank * 14,
    attack: Math.max(1, Math.round((player.baseAttack + (player.level - 1) * 2 + player.permanentPower + itemAttack) * vocation.attackMultiplier)),
    defense: Math.max(0, Math.round((player.baseDefense + (player.level - 1) + itemDefense) * vocation.defenseMultiplier)),
  };
}

export function fight(state: MinuteVanguardState): CommandResult<MinuteVanguardState, 'cooldown-active'> {
  const consumed = consumeCooldown({
    definition: battleCooldownDefinition,
    cooldown: state.gameData.battleCooldown,
    simTimeSec: state.simTimeSec,
    durationSecOverride: effectiveBattleCooldownSec(state),
  });
  if (!consumed.accepted) return reject(state, 'cooldown-active');

  let nextState: MinuteVanguardState = {
    ...state,
    gameData: { ...state.gameData, battleCooldown: consumed.cooldown },
  };
  const selected = selectEnemy(nextState);
  nextState = selected.state;
  const elite = selected.elite;
  const enemyScale = 1 + Math.floor(nextState.gameData.victories / 8) * 0.12;
  const enemyHpMax = Math.round(selected.enemy.hp * enemyScale * (elite ? 1.55 : 1));
  const enemyAttack = Math.round(selected.enemy.attack * enemyScale * (elite ? 1.35 : 1));
  const enemyDefense = Math.round(selected.enemy.defense * enemyScale * (elite ? 1.3 : 1));
  const stats = playerCombatStats(nextState);
  let playerHp = stats.hp;
  let enemyHp = enemyHpMax;
  const turns = [];

  for (let turn = 1; turn <= MAX_BATTLE_TURNS && playerHp > 0 && enemyHp > 0; turn += 1) {
    const critRoll = draw(nextState, ids.rng.combat);
    nextState = critRoll.state;
    const dodgeRoll = draw(nextState, ids.rng.combat);
    nextState = dodgeRoll.state;
    const critical = critRoll.value < 0.12;
    const dodged = dodgeRoll.value < 0.08;
    const playerBaseDamage = Math.max(1, stats.attack - Math.floor(enemyDefense * 0.62));
    const playerDamage = Math.max(1, Math.round(playerBaseDamage * (critical ? 1.8 : 1)));
    enemyHp = Math.max(0, enemyHp - playerDamage);
    const enemyDamage = enemyHp <= 0 || dodged ? 0 : Math.max(1, enemyAttack - Math.floor(stats.defense * 0.58));
    playerHp = Math.max(0, playerHp - enemyDamage);
    turns.push({ turn, playerDamage, enemyDamage, critical, dodged });
  }

  const victory = enemyHp <= 0;
  const discoveredEnemy = !nextState.gameData.discoveredEnemyIds.includes(selected.enemy.id);
  let goldGained = 0;
  let expGained = 0;
  let jackpotGold = 0;
  let permanentPowerGain = 0;
  let droppedItemInstanceId: string | null = null;

  if (victory) {
    const jackpotRoll = draw(nextState, ids.rng.loot);
    nextState = jackpotRoll.state;
    const permanentRoll = draw(nextState, ids.rng.loot);
    nextState = permanentRoll.state;
    const dropRoll = draw(nextState, ids.rng.loot);
    nextState = dropRoll.state;

    jackpotGold = jackpotRoll.value < 0.04 ? selected.enemy.gold * (elite ? 7 : 5) : 0;
    goldGained = Math.round(selected.enemy.gold * (elite ? 1.8 : 1)) + jackpotGold;
    expGained = Math.round(selected.enemy.exp * (elite ? 1.5 : 1));
    permanentPowerGain = permanentRoll.value < 0.025 ? 1 : 0;
    nextState = grantCurrency(nextState, ids.currency.gold, goldGained, `battle.${selected.enemy.id}`);
    if (elite) nextState = grantCurrency(nextState, ids.currency.shard, 1, `elite.${selected.enemy.id}`);
    nextState = addExperience(nextState, expGained, permanentPowerGain);

    if (dropRoll.value < selected.enemy.dropChance) {
      const dropped = createDrop(nextState, selected.enemy, elite);
      nextState = dropped.state;
      droppedItemInstanceId = dropped.itemInstanceId;
    }
  }

  const battleIndex = nextState.gameData.totalBattles + 1;
  const result: BattleResult = {
    battleIndex,
    enemyId: selected.enemy.id,
    enemyName: elite ? `Elite ${selected.enemy.displayName}` : selected.enemy.displayName,
    enemyGlyph: selected.enemy.glyph,
    victory,
    turns,
    playerHpRemaining: playerHp,
    enemyHpRemaining: enemyHp,
    goldGained,
    expGained,
    jackpotGold,
    permanentPowerGain,
    droppedItemInstanceId,
    discoveredEnemy,
  };
  nextState = {
    ...nextState,
    gameData: {
      ...nextState.gameData,
      totalBattles: battleIndex,
      victories: nextState.gameData.victories + (victory ? 1 : 0),
      defeats: nextState.gameData.defeats + (victory ? 0 : 1),
      discoveredEnemyIds: discoveredEnemy
        ? [...nextState.gameData.discoveredEnemyIds, selected.enemy.id]
        : nextState.gameData.discoveredEnemyIds,
      lastBattle: result,
    },
  };

  return accept(nextState, [event(nextState, 'battleResolved', `${battleIndex}`, {
    victory,
    enemyId: selected.enemy.id,
    elite,
    goldGained,
    expGained,
    jackpotGold,
    permanentPowerGain,
    droppedItemInstanceId,
  })]);
}

export function buyShopItem(
  state: MinuteVanguardState,
  itemDefinitionId: string,
): CommandResult<MinuteVanguardState, 'unknown-offer' | 'insufficient-gold'> {
  const offer = shopOffers.find((candidate) => candidate.itemDefinitionId === itemDefinitionId);
  if (offer === undefined) return reject(state, 'unknown-offer');
  const spend = applyCurrencyTransaction(state.currencies, {
    currencyId: ids.currency.gold,
    amount: offer.price,
    kind: 'spend',
    source: `shop.${itemDefinitionId}`,
  }, resolveCurrencyDefinition(ids.currency.gold));
  if (!spend.accepted) return reject(state, 'insufficient-gold');

  let nextState: MinuteVanguardState = { ...state, currencies: spend.balances };
  nextState = recordCurrencySpend(nextState, ids.currency.gold, spend.appliedAmount) as MinuteVanguardState;
  const granted = grantItem(nextState, itemDefinitionId, offer.data);
  nextState = granted.state;
  return accept(nextState, [event(nextState, 'shopItemPurchased', granted.itemInstanceId, { itemDefinitionId, price: offer.price })]);
}

export function equipOwnedItem(
  state: MinuteVanguardState,
  itemInstanceId: string,
): CommandResult<MinuteVanguardState, 'unknown-item' | 'equip-rejected'> {
  const item = state.gameData.inventory[itemInstanceId];
  if (item === undefined) return reject(state, 'unknown-item');
  const slotId = item.data?.kind;
  if (slotId !== 'weapon' && slotId !== 'armor') return reject(state, 'equip-rejected');
  const equipped = equipItem({
    inventory: state.gameData.inventory,
    itemDefinitions,
    loadoutDefinition,
    loadout: state.gameData.loadout,
    slotId,
    itemInstanceId,
  });
  if (!equipped.accepted) return reject(state, 'equip-rejected');
  if (equipped.loadout === state.gameData.loadout) return accept(state, []);
  const nextState = {
    ...state,
    gameData: { ...state.gameData, loadout: equipped.loadout },
  };
  return accept(nextState, [event(nextState, 'itemEquipped', `${slotId}:${itemInstanceId}`, { slotId, itemInstanceId })]);
}

export function upgradeEquippedItem(
  state: MinuteVanguardState,
  slotId: 'weapon' | 'armor',
): CommandResult<MinuteVanguardState, 'empty-slot' | 'insufficient-gold'> {
  const itemInstanceId = state.gameData.loadout.equipped[slotId];
  if (itemInstanceId === null || itemInstanceId === undefined) return reject(state, 'empty-slot');
  const current = state.gameData.inventory[itemInstanceId];
  if (current?.data === undefined) return reject(state, 'empty-slot');
  const price = 25 * (current.data.upgradeRank + 1);
  const spend = applyCurrencyTransaction(state.currencies, {
    currencyId: ids.currency.gold,
    amount: price,
    kind: 'spend',
    source: `upgrade.${slotId}`,
  }, resolveCurrencyDefinition(ids.currency.gold));
  if (!spend.accepted) return reject(state, 'insufficient-gold');

  const data: EquipmentData = {
    ...current.data,
    upgradeRank: current.data.upgradeRank + 1,
    attack: current.data.attack + (slotId === 'weapon' ? 2 : 0),
    defense: current.data.defense + (slotId === 'armor' ? 2 : 0),
  };
  const inventory: InventoryState<EquipmentData> = {
    ...state.gameData.inventory,
    [itemInstanceId]: { ...current, data },
  };
  let nextState: MinuteVanguardState = {
    ...state,
    currencies: spend.balances,
    gameData: { ...state.gameData, inventory },
  };
  nextState = recordCurrencySpend(nextState, ids.currency.gold, spend.appliedAmount) as MinuteVanguardState;
  return accept(nextState, [event(nextState, 'equipmentUpgraded', `${itemInstanceId}:${data.upgradeRank}`, { itemInstanceId, slotId, rank: data.upgradeRank, price })]);
}

export function changeJob(state: MinuteVanguardState): CommandResult<MinuteVanguardState, 'level-too-low'> {
  if (state.gameData.player.level < 10) return reject(state, 'level-too-low');
  const jobRank = state.gameData.player.jobRank + 1;
  const vocation = [...vocations].reverse().find((candidate) => candidate.requiredJobRank <= jobRank) ?? vocations[0]!;
  const nextState: MinuteVanguardState = {
    ...state,
    gameData: {
      ...state.gameData,
      player: {
        ...state.gameData.player,
        level: 1,
        exp: 0,
        jobRank,
        vocationId: vocation.id,
        permanentPower: state.gameData.player.permanentPower + 3,
      },
    },
  };
  return accept(nextState, [event(nextState, 'jobChanged', `${jobRank}`, { jobRank, vocationId: vocation.id })]);
}

export function currentVocation(state: MinuteVanguardState) {
  return vocations.find((candidate) => candidate.id === state.gameData.player.vocationId) ?? vocations[0]!;
}

export function expRequiredForNextLevel(level: number): number {
  return 18 + level * 12;
}

export function goldBalance(state: MinuteVanguardState): number {
  return readCurrency(state.currencies, ids.currency.gold).toNumber();
}

function selectEnemy(state: MinuteVanguardState): Readonly<{ state: MinuteVanguardState; enemy: EnemyDefinition; elite: boolean }> {
  const eligible = enemies.filter((enemy) => enemy.unlockWins <= state.gameData.victories);
  const encounterRoll = draw(state, ids.rng.encounter);
  const index = Math.min(eligible.length - 1, Math.floor(encounterRoll.value * eligible.length));
  const enemy = eligible[index] ?? enemies[0]!;
  const eliteRoll = draw(encounterRoll.state, ids.rng.encounter);
  return { state: eliteRoll.state, enemy, elite: eliteRoll.value < 0.06 };
}

function addExperience(state: MinuteVanguardState, gained: number, permanentPowerGain: number): MinuteVanguardState {
  let level = state.gameData.player.level;
  let exp = state.gameData.player.exp + gained;
  while (exp >= expRequiredForNextLevel(level)) {
    exp -= expRequiredForNextLevel(level);
    level += 1;
  }
  return {
    ...state,
    gameData: {
      ...state.gameData,
      player: {
        ...state.gameData.player,
        level,
        exp,
        permanentPower: state.gameData.player.permanentPower + permanentPowerGain,
      },
    },
  };
}

function createDrop(
  state: MinuteVanguardState,
  enemy: EnemyDefinition,
  elite: boolean,
): Readonly<{ state: MinuteVanguardState; itemInstanceId: string }> {
  const itemRoll = draw(state, ids.rng.loot);
  const definitionId = enemy.itemPool[Math.min(enemy.itemPool.length - 1, Math.floor(itemRoll.value * enemy.itemPool.length))] ?? ids.item.rustSpear;
  const rarityRoll = draw(itemRoll.state, ids.rng.loot);
  const rarity = rollRarity(rarityRoll.value, elite);
  const scale = rarity === 'epic' ? 2 : rarity === 'rare' ? 1.55 : rarity === 'uncommon' ? 1.25 : 1;
  const weapon = itemDefinitions[definitionId]?.tags?.includes('weapon') === true;
  const tier = definitionId === ids.item.watchblade || definitionId === ids.item.sentryPlate ? 7
    : definitionId === ids.item.bronzeGlaive || definitionId === ids.item.brassMail ? 5
      : 3;
  const data: EquipmentData = {
    kind: weapon ? 'weapon' : 'armor',
    attack: weapon ? Math.round(tier * scale) : 0,
    defense: weapon ? 0 : Math.round(tier * scale),
    rarity,
    upgradeRank: 0,
    source: `drop.${enemy.id}`,
  };
  return grantItem(rarityRoll.state, definitionId, data);
}

function grantItem(
  state: MinuteVanguardState,
  definitionId: string,
  data: EquipmentData,
): Readonly<{ state: MinuteVanguardState; itemInstanceId: string }> {
  const itemInstanceId = `${definitionId}:${state.gameData.nextItemSequence}`;
  const item: ItemInstanceState<EquipmentData> = { instanceId: itemInstanceId, definitionId, quantity: 1, data };
  const added = addItemInstance(state.gameData.inventory, item);
  if (!added.accepted) throw new Error(`Failed to grant item ${itemInstanceId}: ${added.reason}`);
  let nextState: MinuteVanguardState = {
    ...state,
    gameData: {
      ...state.gameData,
      inventory: added.inventory,
      nextItemSequence: state.gameData.nextItemSequence + 1,
    },
  };

  const slotId = data.kind;
  const currentEquippedId = nextState.gameData.loadout.equipped[slotId];
  const currentEquipped = currentEquippedId === null || currentEquippedId === undefined
    ? undefined
    : nextState.gameData.inventory[currentEquippedId];
  const currentPower = currentEquipped?.data === undefined ? -1 : currentEquipped.data.attack + currentEquipped.data.defense;
  const newPower = data.attack + data.defense;
  if (currentPower < newPower) {
    const equipped = equipItem({
      inventory: nextState.gameData.inventory,
      itemDefinitions,
      loadoutDefinition,
      loadout: nextState.gameData.loadout,
      slotId,
      itemInstanceId,
    });
    if (equipped.accepted) {
      nextState = { ...nextState, gameData: { ...nextState.gameData, loadout: equipped.loadout } };
    }
  }
  return { state: nextState, itemInstanceId };
}

function rollRarity(value: number, elite: boolean): EquipmentRarity {
  const epic = elite ? 0.12 : 0.035;
  const rare = elite ? 0.35 : 0.14;
  const uncommon = elite ? 0.7 : 0.42;
  if (value < epic) return 'epic';
  if (value < rare) return 'rare';
  if (value < uncommon) return 'uncommon';
  return 'common';
}

function draw(state: MinuteVanguardState, streamName: string): Readonly<{ state: MinuteVanguardState; value: number }> {
  const stream = state.rngStreams[streamName];
  if (stream === undefined) throw new Error(`Missing RNG stream ${streamName}`);
  const result = nextRandom(stream);
  return {
    value: result.value,
    state: { ...state, rngStreams: { ...state.rngStreams, [streamName]: result.stream } },
  };
}

function grantCurrency(state: MinuteVanguardState, currencyId: string, amount: number, source: string): MinuteVanguardState {
  return applyRewards(state, [{ type: 'currency', currencyId, amount, source }], {
    resolveCurrencyDefinition,
  }) as MinuteVanguardState;
}

function resolveCurrencyDefinition(currencyId: string): CurrencyDefinition | undefined {
  return currencyById.get(currencyId);
}

function event(state: MinuteVanguardState, type: string, key: string, payload?: Readonly<Record<string, unknown>>): DomainEvent {
  return {
    id: `${type}:${key}:${state.simTimeSec}`,
    type,
    simTimeSec: state.simTimeSec,
    ...(payload === undefined ? {} : { payload }),
  };
}

function accept(state: MinuteVanguardState, events: readonly DomainEvent[]): CommandResult<MinuteVanguardState, never> {
  return { accepted: true, state, events };
}

function reject<TReason extends string>(state: MinuteVanguardState, reason: TReason): CommandResult<MinuteVanguardState, TReason> {
  return { accepted: false, state, events: [], reason };
}

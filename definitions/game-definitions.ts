import type {
  CooldownDefinition,
  CurrencyDefinition,
  ItemDefinition,
  LoadoutDefinition,
} from 'idle-game-kit';
import type { EnemyDefinition, VocationDefinition } from './types';

export const definitionVersion = '0.1.0';

export const ids = {
  currency: {
    gold: 'currency.gold',
    shard: 'currency.shard',
  },
  rng: {
    encounter: 'rng.encounter',
    combat: 'rng.combat',
    loot: 'rng.loot',
  },
  cooldown: {
    battle: 'cooldown.battle',
  },
  loadout: {
    hero: 'loadout.hero',
  },
  item: {
    rustSpear: 'item.rust_spear',
    bronzeGlaive: 'item.bronze_glaive',
    watchblade: 'item.watchblade',
    paddedCoat: 'item.padded_coat',
    brassMail: 'item.brass_mail',
    sentryPlate: 'item.sentry_plate',
  },
} as const;

export const currencyDefinitions: readonly CurrencyDefinition[] = [
  { id: ids.currency.gold, displayName: 'Gold', symbol: 'G', precision: 0, roundingMode: 'floor', resetPolicy: 'retain' },
  { id: ids.currency.shard, displayName: 'Bell Shard', symbol: '◆', precision: 0, roundingMode: 'floor', resetPolicy: 'retain' },
];

export const battleCooldownDefinition: CooldownDefinition = {
  id: ids.cooldown.battle,
  durationSec: 60,
};

export const itemDefinitions: Readonly<Record<string, ItemDefinition>> = {
  [ids.item.rustSpear]: { id: ids.item.rustSpear, displayName: 'Rust Spear', tags: ['weapon'] },
  [ids.item.bronzeGlaive]: { id: ids.item.bronzeGlaive, displayName: 'Bronze Glaive', tags: ['weapon'] },
  [ids.item.watchblade]: { id: ids.item.watchblade, displayName: 'Watchblade', tags: ['weapon'] },
  [ids.item.paddedCoat]: { id: ids.item.paddedCoat, displayName: 'Padded Coat', tags: ['armor'] },
  [ids.item.brassMail]: { id: ids.item.brassMail, displayName: 'Brass Mail', tags: ['armor'] },
  [ids.item.sentryPlate]: { id: ids.item.sentryPlate, displayName: 'Sentry Plate', tags: ['armor'] },
};

export const loadoutDefinition: LoadoutDefinition = {
  id: ids.loadout.hero,
  slots: [
    { id: 'weapon', acceptsTags: ['weapon'] },
    { id: 'armor', acceptsTags: ['armor'] },
  ],
};

export const enemies: readonly EnemyDefinition[] = [
  {
    id: 'enemy.dustling',
    displayName: 'Dustling',
    glyph: '✦',
    unlockWins: 0,
    hp: 34,
    attack: 7,
    defense: 1,
    exp: 7,
    gold: 12,
    dropChance: 0.16,
    itemPool: [ids.item.rustSpear, ids.item.paddedCoat],
  },
  {
    id: 'enemy.brass_hound',
    displayName: 'Brass Hound',
    glyph: '◆',
    unlockWins: 4,
    hp: 58,
    attack: 10,
    defense: 3,
    exp: 12,
    gold: 22,
    dropChance: 0.18,
    itemPool: [ids.item.bronzeGlaive, ids.item.brassMail],
  },
  {
    id: 'enemy.hollow_sentry',
    displayName: 'Hollow Sentry',
    glyph: '♜',
    unlockWins: 10,
    hp: 96,
    attack: 16,
    defense: 6,
    exp: 20,
    gold: 38,
    dropChance: 0.2,
    itemPool: [ids.item.watchblade, ids.item.sentryPlate],
  },
  {
    id: 'enemy.bell_eater',
    displayName: 'Bell Eater',
    glyph: '◉',
    unlockWins: 20,
    hp: 170,
    attack: 23,
    defense: 9,
    exp: 34,
    gold: 70,
    dropChance: 0.24,
    itemPool: [ids.item.watchblade, ids.item.sentryPlate],
  },
];

export const vocations: readonly VocationDefinition[] = [
  { id: 'vocation.watchman', displayName: 'Watchman', requiredJobRank: 0, attackMultiplier: 1, defenseMultiplier: 1, cooldownReductionSec: 0 },
  { id: 'vocation.lancer', displayName: 'Lancer', requiredJobRank: 1, attackMultiplier: 1.18, defenseMultiplier: 1.04, cooldownReductionSec: 5 },
  { id: 'vocation.clockguard', displayName: 'Clockguard', requiredJobRank: 2, attackMultiplier: 1.12, defenseMultiplier: 1.18, cooldownReductionSec: 10 },
];

export const shopOffers = [
  { itemDefinitionId: ids.item.rustSpear, price: 35, data: { kind: 'weapon', attack: 4, defense: 0, rarity: 'common', upgradeRank: 0, source: 'shop' } as const },
  { itemDefinitionId: ids.item.paddedCoat, price: 35, data: { kind: 'armor', attack: 0, defense: 3, rarity: 'common', upgradeRank: 0, source: 'shop' } as const },
] as const;

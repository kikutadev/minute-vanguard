import type {
  CooldownDefinition,
  CurrencyDefinition,
  ItemDefinition,
  LoadoutDefinition,
} from 'idle-game-kit';
import type { EnemyDefinition, JobDefinition, MonsterRarity, OrbRank, StatValues } from './types';

export const definitionVersion = '0.2.0';

export const ids = {
  currency: { gold: 'currency.gold', gem: 'currency.gem' },
  rng: { encounter: 'rng.encounter', combat: 'rng.combat', loot: 'rng.loot', growth: 'rng.growth' },
  cooldown: { battle: 'cooldown.battle' },
  loadout: { hero: 'loadout.hero' },
  item: {
    trainingSword: 'item.training_sword', ironSword: 'item.iron_sword', arcaneRod: 'item.arcane_rod',
    travelClothes: 'item.travel_clothes', ironMail: 'item.iron_mail', mysticRobe: 'item.mystic_robe',
    orb: 'item.orb',
  },
} as const;

export const currencyDefinitions: readonly CurrencyDefinition[] = [
  { id: ids.currency.gold, displayName: 'ゴールド', symbol: 'G', precision: 0, roundingMode: 'floor', resetPolicy: 'retain' },
  { id: ids.currency.gem, displayName: 'ジェム', symbol: '💎', precision: 0, roundingMode: 'floor', resetPolicy: 'retain' },
];

export const battleCooldownDefinition: CooldownDefinition = { id: ids.cooldown.battle, durationSec: 60 };

export const itemDefinitions: Readonly<Record<string, ItemDefinition>> = {
  [ids.item.trainingSword]: { id: ids.item.trainingSword, displayName: '駆け出しの剣', tags: ['weapon'] },
  [ids.item.ironSword]: { id: ids.item.ironSword, displayName: '鉄の長剣', tags: ['weapon'] },
  [ids.item.arcaneRod]: { id: ids.item.arcaneRod, displayName: '星読みの杖', tags: ['weapon'] },
  [ids.item.travelClothes]: { id: ids.item.travelClothes, displayName: '旅人の服', tags: ['armor'] },
  [ids.item.ironMail]: { id: ids.item.ironMail, displayName: '鉄の鎧', tags: ['armor'] },
  [ids.item.mysticRobe]: { id: ids.item.mysticRobe, displayName: '星布のローブ', tags: ['armor'] },
  [ids.item.orb]: { id: ids.item.orb, displayName: 'オーブ', tags: ['orb'] },
};

export const loadoutDefinition: LoadoutDefinition = {
  id: ids.loadout.hero,
  slots: [
    { id: 'weapon', acceptsTags: ['weapon'] },
    { id: 'armor', acceptsTags: ['armor'] },
    { id: 'orb', acceptsTags: ['orb'] },
  ],
};

const stats = (hp: number, attack: number, defense: number, magicAttack: number, magicDefense: number, luck: number): StatValues =>
  ({ hp, attack, defense, magicAttack, magicDefense, luck });

export const jobs: readonly JobDefinition[] = [
  { id: 'job.adventurer', displayName: '冒険者', skillName: 'なし', skillDescription: 'ゲーム開始時の職業。Lv.30で転職できます。', growth: stats(9, 2, 2, 2, 2, 2), unlock: 'always' },
  { id: 'job.warrior', displayName: '戦士', skillName: '怒りの一撃', skillDescription: 'HP30%以下で物理攻撃が2倍。', growth: stats(13, 4, 3, 1, 2, 1), unlock: 'always' },
  { id: 'job.mage', displayName: '魔法使い', skillName: '魔法連鎖', skillDescription: '35%で魔法攻撃がもう1回発動。', growth: stats(8, 1, 1, 5, 3, 2), unlock: 'always' },
  { id: 'job.thief', displayName: '盗賊', skillName: '強奪', skillDescription: '勝利時、LUKに応じて追加ゴールドを獲得。', growth: stats(9, 3, 2, 1, 2, 5), unlock: 'always' },
  { id: 'job.priest', displayName: '僧侶', skillName: '回復の祈り', skillDescription: '毎ターン最大HPの5%を回復。', growth: stats(11, 1, 2, 3, 5, 2), unlock: 'always' },
  { id: 'job.ninja', displayName: '忍者', skillName: '分身', skillDescription: '30%で敵の攻撃を回避。LUKも高く伸びる。', growth: stats(8, 4, 2, 1, 2, 5), unlock: 'always' },
  { id: 'job.gambler', displayName: '賭博師', skillName: 'イカサマダンス', skillDescription: '攻撃倍率が毎ターン大きく揺れる。', growth: stats(8, 3, 2, 3, 2, 6), unlock: 'always' },
  { id: 'job.wraith', displayName: '幽鬼', skillName: '怨念蓄積', skillDescription: '70%回避。長期戦ほど魔法攻撃が増幅。', growth: stats(7, 1, 1, 6, 2, 3), unlock: 'job-change-10' },
  { id: 'job.tamer', displayName: 'テイマー', skillName: '多頭飼い', skillDescription: 'ペット攻撃を強化し、条件を満たすと2体編成。', growth: stats(10, 3, 2, 3, 2, 3), unlock: 'pet-10' },
  { id: 'job.hexer', displayName: '呪術師', skillName: '呪詛', skillDescription: 'ターンごとに呪いを蓄積し、防御無視ダメージ。', growth: stats(9, 1, 2, 5, 4, 2), unlock: 'always' },
];

export const enemies: readonly EnemyDefinition[] = [
  { id: 'enemy.pebble', displayName: '妙に硬い石ころ', glyph: '🪨', rarity: 'common', monsterLevel: 1, hp: 42, attack: 7, defense: 2, magicAttack: 0, magicDefense: 1, luck: 3, exp: 18, gold: 20, gemDropChance: .005, orbDropChance: .04, specialChance: .01, attackType: 'physical', quote: 'そこにいるだけで道をふさぐ。' },
  { id: 'enemy.alarm', displayName: '止まらない目覚まし', glyph: '⏰', rarity: 'common', monsterLevel: 1, hp: 50, attack: 8, defense: 2, magicAttack: 0, magicDefense: 2, luck: 4, exp: 20, gold: 24, gemDropChance: .005, orbDropChance: .045, specialChance: .02, attackType: 'physical', quote: 'あと5分、を許さない。' },
  { id: 'enemy.crowd', displayName: '朝の満員馬車', glyph: '🚃', rarity: 'uncommon', monsterLevel: 1, hp: 62, attack: 10, defense: 4, magicAttack: 0, magicDefense: 3, luck: 5, exp: 27, gold: 34, gemDropChance: .015, orbDropChance: .065, specialChance: .04, attackType: 'physical', quote: '逃げ場が、ない。' },
  { id: 'enemy.cold_soup', displayName: '冷めきった夕食', glyph: '🥣', rarity: 'common', monsterLevel: 1, hp: 55, attack: 8, defense: 3, magicAttack: 0, magicDefense: 3, luck: 4, exp: 22, gold: 26, gemDropChance: .005, orbDropChance: .045, specialChance: .02, attackType: 'physical', quote: '温め直す気力も奪ってくる。' },
  { id: 'enemy.broken_sheet', displayName: '壊れた集計表', glyph: '📊', rarity: 'rare', monsterLevel: 1, hp: 82, attack: 6, defense: 5, magicAttack: 15, magicDefense: 7, luck: 8, exp: 42, gold: 62, gemDropChance: .05, orbDropChance: .11, specialChance: .08, attackType: 'magic', quote: '#REF! がこちらを見ている。' },
  { id: 'enemy.dead_wifi', displayName: '圏外の魔導網', glyph: '📡', rarity: 'uncommon', monsterLevel: 1, hp: 70, attack: 5, defense: 3, magicAttack: 13, magicDefense: 6, luck: 6, exp: 34, gold: 46, gemDropChance: .015, orbDropChance: .075, specialChance: .06, attackType: 'magic', quote: 'あと一歩だけ届かない。' },
  { id: 'enemy.deadline', displayName: '締切前夜', glyph: '🌙', rarity: 'epic', monsterLevel: 1, hp: 108, attack: 18, defense: 7, magicAttack: 12, magicDefense: 7, luck: 11, exp: 66, gold: 100, gemDropChance: .1, orbDropChance: .16, specialChance: .12, attackType: 'physical', quote: '時間だけが加速している。' },
  { id: 'enemy.monday', displayName: '月曜の朝・真', glyph: '☀️', rarity: 'boss', monsterLevel: 1, hp: 150, attack: 21, defense: 10, magicAttack: 22, magicDefense: 10, luck: 13, exp: 110, gold: 180, gemDropChance: .3, orbDropChance: .28, specialChance: .22, attackType: 'magic', quote: '週は、また始まる。' },
  { id: 'enemy.overflow_mail', displayName: '未読999+', glyph: '✉️', rarity: 'rare', monsterLevel: 2, hp: 165, attack: 25, defense: 12, magicAttack: 18, magicDefense: 11, luck: 13, exp: 90, gold: 145, gemDropChance: .05, orbDropChance: .12, specialChance: .1, attackType: 'physical', quote: '消しても増える。' },
  { id: 'enemy.meeting_dragon', displayName: '会議竜', glyph: '🐉', rarity: 'legendary', monsterLevel: 2, hp: 260, attack: 33, defense: 17, magicAttack: 34, magicDefense: 18, luck: 18, exp: 170, gold: 300, gemDropChance: .18, orbDropChance: .22, specialChance: .18, attackType: 'magic', quote: '結論は次回へ持ち越された。' },
];

export const rarityOrder: readonly MonsterRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'boss'];
export const orbRanks: readonly OrbRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
export const orbPercentByRank: Readonly<Record<OrbRank, readonly [number, number]>> = {
  F: [5, 10], E: [11, 20], D: [21, 30], C: [31, 40], B: [41, 50], A: [51, 65], S: [66, 80], SS: [81, 94], SSS: [95, 100],
};

export const shopEquipmentOffers = [
  { itemDefinitionId: ids.item.trainingSword, price: 60, data: { kind: 'weapon', rarity: 'common', upgradeRank: 0, flatStats: { attack: 7 }, source: 'shop' } as const },
  { itemDefinitionId: ids.item.travelClothes, price: 60, data: { kind: 'armor', rarity: 'common', upgradeRank: 0, flatStats: { defense: 5, magicDefense: 3 }, source: 'shop' } as const },
  { itemDefinitionId: ids.item.ironSword, price: 260, data: { kind: 'weapon', rarity: 'uncommon', upgradeRank: 0, flatStats: { attack: 15 }, source: 'shop' } as const },
  { itemDefinitionId: ids.item.arcaneRod, price: 280, data: { kind: 'weapon', rarity: 'uncommon', upgradeRank: 0, flatStats: { magicAttack: 16 }, source: 'shop' } as const },
  { itemDefinitionId: ids.item.ironMail, price: 260, data: { kind: 'armor', rarity: 'uncommon', upgradeRank: 0, flatStats: { defense: 12, magicDefense: 5 }, source: 'shop' } as const },
] as const;

export const permanentUpgradeDefinitions = [
  { id: 'cooldownReduction', label: 'クールダウン短縮', description: 'モンスター戦 60秒 → 50秒', price: 3000 },
  { id: 'expMultiplier', label: '獲得EXP 1.2倍', description: '獲得EXPが永久に20%増加', price: 2000 },
  { id: 'goldMultiplier', label: '獲得Gold 1.2倍', description: '獲得Goldが永久に20%増加', price: 2000 },
  { id: 'orbDropMultiplier', label: 'オーブドロップ ×1.5', description: 'オーブのドロップ率が永久に増加', price: 2000 },
  { id: 'drawExpMultiplier', label: '引き分けEXP 2倍', description: '引き分け時EXP 5% → 10%', price: 500 },
] as const;

export type PermanentUpgradeId = typeof permanentUpgradeDefinitions[number]['id'];

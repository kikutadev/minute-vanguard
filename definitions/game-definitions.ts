import type {
  CooldownDefinition,
  CurrencyDefinition,
  ItemDefinition,
  LoadoutDefinition,
} from 'idle-game-kit';
import type { EnemyDefinition, JobDefinition, MonsterRarity, OrbRank, StatValues } from './types';
import { highLevelEnemies } from './high-level-enemies';

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
    trailCrook: 'item.trail_crook', lureCodex: 'item.lure_codex',
    trackerVest: 'item.tracker_vest', whisperCloak: 'item.whisper_cloak',
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
  [ids.item.trailCrook]: { id: ids.item.trailCrook, displayName: '追跡の杖', tags: ['weapon'] },
  [ids.item.lureCodex]: { id: ids.item.lureCodex, displayName: '誘いの魔導書', tags: ['weapon'] },
  [ids.item.trackerVest]: { id: ids.item.trackerVest, displayName: '足跡読みのベスト', tags: ['armor'] },
  [ids.item.whisperCloak]: { id: ids.item.whisperCloak, displayName: '気配寄せの外套', tags: ['armor'] },
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
  { id: 'job.ninja', displayName: '忍者', skillName: '分身＆暗殺', skillDescription: '30%回避＋LUK依存、最大15%でboss/legendary以外を即死。', growth: stats(8, 4, 2, 1, 2, 5), unlock: 'always' },
  { id: 'job.gambler', displayName: '賭博師', skillName: 'イカサマダンス', skillDescription: '毎ターン0.2〜100倍の7段階。期待値は約3.2倍。', growth: stats(8, 3, 2, 3, 2, 6), unlock: 'always' },
  { id: 'job.wraith', displayName: '幽鬼', skillName: '怨念蓄積', skillDescription: '全装備無効。70%回避、魔力は毎ターン×1.5・被弾で1/3（最低0.5倍）。', growth: stats(7, 0, 0, 6, 0, 0), unlock: 'job-change-10' },
  { id: 'job.tamer', displayName: 'テイマー', skillName: '多頭飼い', skillDescription: 'ペット2体・攻撃+40%。剣は物理、杖なら自分も魔法攻撃。', growth: stats(10, 3, 2, 3, 2, 3), unlock: 'pet-10' },
  { id: 'job.hexer', displayName: '呪術師', skillName: '呪詛', skillDescription: 'ターンごとに呪いを蓄積し、防御無視ダメージ。', growth: stats(9, 1, 2, 5, 4, 2), unlock: 'always' },
];

const CORE_ENEMIES: readonly EnemyDefinition[] = [
  { id: 'enemy.pebble', displayName: '妙に硬い石ころ', glyph: '🪨', rarity: 'common', monsterLevel: 1, hp: 42, attack: 7, defense: 2, magicAttack: 0, magicDefense: 1, luck: 3, exp: 18, gold: 20, gemDropChance: .005, orbDropChance: .002, specialChance: .01, attackType: 'physical', quote: 'そこにいるだけで道をふさぐ。' },
  { id: 'enemy.alarm', displayName: '止まらない目覚まし', glyph: '⏰', rarity: 'common', monsterLevel: 1, hp: 50, attack: 8, defense: 2, magicAttack: 0, magicDefense: 2, luck: 4, exp: 20, gold: 24, gemDropChance: .005, orbDropChance: .002, specialChance: .02, attackType: 'physical', quote: 'あと5分、を許さない。' },
  { id: 'enemy.crowd', displayName: '朝の満員馬車', glyph: '🚃', rarity: 'uncommon', monsterLevel: 1, hp: 62, attack: 10, defense: 4, magicAttack: 0, magicDefense: 3, luck: 5, exp: 27, gold: 34, gemDropChance: .012, orbDropChance: .005, specialChance: .04, attackType: 'physical', quote: '逃げ場が、ない。' },
  { id: 'enemy.cold_soup', displayName: '冷めきった夕食', glyph: '🥣', rarity: 'common', monsterLevel: 1, hp: 55, attack: 8, defense: 3, magicAttack: 0, magicDefense: 3, luck: 4, exp: 22, gold: 26, gemDropChance: .005, orbDropChance: .002, specialChance: .02, attackType: 'physical', quote: '温め直す気力も奪ってくる。' },
  { id: 'enemy.broken_sheet', displayName: '壊れた集計表', glyph: '📊', rarity: 'rare', monsterLevel: 1, hp: 82, attack: 6, defense: 5, magicAttack: 15, magicDefense: 7, luck: 8, exp: 42, gold: 62, gemDropChance: .035, orbDropChance: .012, specialChance: .08, attackType: 'magic', quote: '#REF! がこちらを見ている。' },
  { id: 'enemy.dead_wifi', displayName: '圏外の魔導網', glyph: '📡', rarity: 'uncommon', monsterLevel: 1, hp: 70, attack: 5, defense: 3, magicAttack: 13, magicDefense: 6, luck: 6, exp: 34, gold: 46, gemDropChance: .012, orbDropChance: .005, specialChance: .06, attackType: 'magic', quote: 'あと一歩だけ届かない。' },
  { id: 'enemy.deadline', displayName: '締切前夜', glyph: '🌙', rarity: 'epic', monsterLevel: 1, hp: 108, attack: 18, defense: 7, magicAttack: 12, magicDefense: 7, luck: 11, exp: 66, gold: 100, gemDropChance: .08, orbDropChance: .022, specialChance: .12, attackType: 'physical', quote: '時間だけが加速している。' },
  { id: 'enemy.monday', displayName: '月曜の朝・真', glyph: '☀️', rarity: 'boss', monsterLevel: 1, hp: 150, attack: 21, defense: 10, magicAttack: 22, magicDefense: 10, luck: 13, exp: 110, gold: 180, gemDropChance: .3, orbDropChance: .06, specialChance: .22, attackType: 'magic', quote: '週は、また始まる。' },
  { id: 'enemy.overflow_mail', displayName: '未読999+', glyph: '✉️', rarity: 'rare', monsterLevel: 2, hp: 165, attack: 25, defense: 12, magicAttack: 18, magicDefense: 11, luck: 13, exp: 90, gold: 145, gemDropChance: .035, orbDropChance: .012, specialChance: .1, attackType: 'physical', quote: '消しても増える。' },
  { id: 'enemy.meeting_dragon', displayName: '会議竜', glyph: '🐉', rarity: 'legendary', monsterLevel: 2, hp: 260, attack: 33, defense: 17, magicAttack: 34, magicDefense: 18, luck: 18, exp: 170, gold: 300, gemDropChance: .18, orbDropChance: .04, specialChance: .18, attackType: 'magic', quote: '結論は次回へ持ち越された。' },
];

type EnemySeed = readonly [displayName: string, glyph: string, attackType: 'physical' | 'magic'];

const LEVEL_1_ADDITIONAL_SEEDS: readonly EnemySeed[] = [
  ['片方だけ消えた靴下', '🧦', 'physical'], ['終わらない赤信号', '🚦', 'physical'], ['折れた傘の骨', '☂️', 'physical'],
  ['釣銭切れの自販機', '🥤', 'physical'], ['絡まったイヤホン', '🎧', 'physical'], ['軋む事務椅子', '🪑', 'physical'],
  ['残量1%の端末', '🔋', 'magic'], ['端だけ貼りつくラップ', '🫧', 'physical'], ['噛みこんだファスナー', '🧥', 'physical'],
  ['一画素のひび割れ', '📱', 'magic'], ['ぬるい湯船', '🛁', 'physical'], ['溢れた小ゴミ箱', '🗑️', 'physical'],
  ['不在票の幻', '📮', 'magic'], ['少し曲がった鍵', '🔑', 'physical'], ['眠そうなエスカレーター', '🛗', 'physical'],
  ['消えたペンのキャップ', '🖊️', 'physical'], ['開かない自動扉', '🚪', 'physical'], ['飛ばせない広告', '📺', 'magic'],
  ['乾かないタオル', '🧻', 'physical'], ['瞬く蛍光灯', '💡', 'magic'], ['古いパスワードメモ', '📝', 'magic'],
  ['捨てられないレシート', '🧾', 'physical'],
  ['止まらないエレベーター', '🛗', 'magic'], ['くしゃみするプリンタ', '🖨️', 'physical'], ['自走する買い物かご', '🛒', 'physical'],
  ['疑わしい自動変換', '🔤', 'magic'], ['取り憑かれた予定表', '📅', 'magic'], ['幻の通知バッジ', '🔴', 'magic'],
  ['詰まった排水口', '🚿', 'physical'], ['回り続ける読込輪', '🔄', 'magic'], ['逃げるキャスター椅子', '🪑', 'physical'],
  ['終電の影', '🚇', 'magic'],
  ['再配達迷宮', '📦', 'physical'], ['破損した書類棚', '🗄️', 'physical'], ['通知の暴風', '🌪️', 'magic'],
  ['パケット喰いの霧', '🌫️', 'magic'], ['申告書ゴーレム', '📑', 'physical'], ['残業の分身', '👥', 'magic'],
  ['日曜23時59分', '⏳', 'magic'], ['保存できない文書', '💾', 'magic'],
  ['通勤螺旋の主', '🚉', 'physical'], ['全充電器の停電', '⚡', 'magic'],
];

const LEVEL_2_ADDITIONAL_SEEDS: readonly EnemySeed[] = [
  ['未送信の下書き', '📨', 'magic'], ['増殖する付箋', '🟨', 'physical'], ['二重予約の会議室', '🚪', 'physical'],
  ['返信全員の亡霊', '📧', 'magic'], ['押せない承認ボタン', '✅', 'magic'], ['期限切れ証明書', '📜', 'magic'],
  ['迷子のVPN', '🔐', 'magic'], ['無名の共有フォルダ', '📁', 'magic'], ['巨大な添付ファイル', '📎', 'physical'],
  ['終わらない同期', '☁️', 'magic'], ['再起動待ち端末', '💻', 'physical'], ['鳴りやまぬ着信', '📞', 'magic'],
  ['壊れた勤怠打刻', '🕒', 'physical'], ['空欄だらけの議事録', '📒', 'magic'], ['半角全角の壁', '⌨️', 'physical'],
  ['謎の権限不足', '🔒', 'magic'], ['迷走するカーソル', '🖱️', 'physical'], ['真っ赤な差分', '🟥', 'magic'],
  ['深夜のビルド待ち', '🏗️', 'physical'], ['無限スクロール', '📜', 'magic'], ['切れたセッション', '🧵', 'magic'],
  ['期限直前のレビュー', '👀', 'physical'], ['自動更新の奇襲', '🔁', 'magic'], ['消えたブックマーク', '🔖', 'magic'],
  ['既読のつかない連絡', '💬', 'magic'],
  ['承認ループ四天王', '♻️', 'magic'], ['再現しない不具合', '🐞', 'physical'], ['競合する予約表', '📆', 'physical'],
  ['仕様変更の足音', '👣', 'physical'], ['散らばる権限設定', '🗝️', 'magic'], ['眠らない監視灯', '🚨', 'magic'],
  ['行方不明の依存関係', '🧩', 'magic'], ['折り返すエラー通知', '📣', 'magic'], ['終わらない棚卸し', '📦', 'physical'],
  ['逆流するログ', '📜', 'magic'], ['壊れたキャッシュ', '🧊', 'magic'], ['暴走する自動補完', '🤖', 'magic'],
  ['差し戻しの精', '🧚', 'magic'], ['無限承認回廊', '🏛️', 'physical'], ['深夜再デプロイ', '🚀', 'magic'],
  ['本番だけ落ちる影', '🌑', 'magic'], ['依存地獄の番犬', '🐕', 'physical'], ['赤点灯の監視塔', '🗼', 'magic'],
  ['巻き戻る進捗表', '📉', 'magic'], ['終わらぬ緊急会議', '📢', 'physical'], ['深夜障害の化身', '🌃', 'magic'],
  ['要件増殖王', '👑', 'magic'], ['無限リリース列車', '🚄', 'physical'],
];

const GEM_DROP_BY_RARITY: Readonly<Record<MonsterRarity, number>> = {
  common: .005, uncommon: .012, rare: .035, epic: .08, legendary: .18, boss: .30,
};
const ORB_DROP_BY_RARITY: Readonly<Record<MonsterRarity, number>> = {
  common: .002, uncommon: .005, rare: .012, epic: .022, legendary: .04, boss: .06,
};
const SPECIAL_BY_RARITY: Readonly<Record<MonsterRarity, number>> = {
  common: .01, uncommon: .03, rare: .07, epic: .12, legendary: .18, boss: .24,
};
const RARITY_SCALE: Readonly<Record<MonsterRarity, number>> = {
  common: 1, uncommon: 1.16, rare: 1.48, epic: 1.82, legendary: 2.32, boss: 3.05,
};

function additionalRarity(monsterLevel: 1 | 2, index: number): MonsterRarity {
  if (monsterLevel === 1) {
    if (index < 22) return 'common';
    if (index < 32) return 'uncommon';
    if (index < 38) return 'rare';
    if (index < 40) return 'epic';
    return 'legendary';
  }
  if (index < 25) return 'common';
  if (index < 37) return 'uncommon';
  if (index < 43) return 'rare';
  if (index < 46) return 'epic';
  if (index < 47) return 'legendary';
  return 'boss';
}

function buildAdditionalEnemies(monsterLevel: 1 | 2, seeds: readonly EnemySeed[]): readonly EnemyDefinition[] {
  const base = monsterLevel === 1
    ? { hp: 47, attack: 8, defense: 2.6, magicDefense: 2.4, luck: 4, exp: 19, gold: 22 }
    : { hp: 108, attack: 17, defense: 7.5, magicDefense: 7, luck: 8, exp: 48, gold: 68 };
  const quoteTemplates = [
    '小さな不便ほど、しぶとい。', '今日も当然のように立ちはだかる。', '無視すると、だいたい悪化する。',
    '見なかったことにはできない。', '一度気になると、もう戻れない。', 'こちらの予定など気にしていない。',
    '放っておけば消える、とは限らない。', 'なぜか今に限って本気を出している。',
  ] as const;
  return seeds.map(([displayName, glyph, attackType], index) => {
    const rarity = additionalRarity(monsterLevel, index);
    const scale = RARITY_SCALE[rarity];
    const wobble = 0.95 + (index % 7) * 0.018;
    const primary = Math.max(1, Math.round(base.attack * scale * wobble));
    const defensiveWobble = 0.96 + (index % 5) * 0.025;
    return {
      id: `enemy.lv${monsterLevel}_${String(index + 1).padStart(2, '0')}`,
      displayName,
      glyph,
      rarity,
      monsterLevel,
      hp: Math.max(1, Math.round(base.hp * scale * (0.96 + (index % 9) * 0.016))),
      attack: attackType === 'physical' ? primary : Math.max(1, Math.round(primary * .35)),
      defense: Math.max(1, Math.round(base.defense * scale * defensiveWobble)),
      magicAttack: attackType === 'magic' ? Math.round(primary * 1.08) : Math.max(0, Math.round(primary * .28)),
      magicDefense: Math.max(1, Math.round(base.magicDefense * scale * (attackType === 'magic' ? 1.12 : 1))),
      luck: Math.max(1, Math.round(base.luck * (1 + (index % 6) * .08) * Math.sqrt(scale))),
      exp: Math.max(1, Math.round(base.exp * scale * (1 + Math.max(0, rarityIndex(rarity) - 1) * .09))),
      gold: Math.max(1, Math.round(base.gold * scale * (1 + Math.max(0, rarityIndex(rarity) - 1) * .11))),
      gemDropChance: GEM_DROP_BY_RARITY[rarity],
      orbDropChance: ORB_DROP_BY_RARITY[rarity],
      specialChance: SPECIAL_BY_RARITY[rarity],
      attackType,
      quote: quoteTemplates[index % quoteTemplates.length]!,
    } satisfies EnemyDefinition;
  });
}

function rarityIndex(rarity: MonsterRarity): number {
  return ['common', 'uncommon', 'rare', 'epic', 'legendary', 'boss'].indexOf(rarity);
}

export const enemies: readonly EnemyDefinition[] = [
  ...CORE_ENEMIES,
  ...buildAdditionalEnemies(1, LEVEL_1_ADDITIONAL_SEEDS),
  ...buildAdditionalEnemies(2, LEVEL_2_ADDITIONAL_SEEDS),
  ...highLevelEnemies,
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

export const specialEquipmentOffers = [
  { itemDefinitionId: ids.item.trailCrook, price: 2000, data: { kind: 'weapon', rarity: 'epic', upgradeRank: 0, flatStats: { attack: 5 }, captureMultiplier: 2, source: 'special-shop' } as const },
  { itemDefinitionId: ids.item.lureCodex, price: 2000, data: { kind: 'weapon', rarity: 'epic', upgradeRank: 0, flatStats: { magicAttack: 5 }, captureMultiplier: 2, source: 'special-shop' } as const },
  { itemDefinitionId: ids.item.trackerVest, price: 2000, data: { kind: 'armor', rarity: 'epic', upgradeRank: 0, flatStats: { defense: 5 }, captureMultiplier: 2, source: 'special-shop' } as const },
  { itemDefinitionId: ids.item.whisperCloak, price: 2000, data: { kind: 'armor', rarity: 'epic', upgradeRank: 0, flatStats: { defense: 3, magicDefense: 5 }, captureMultiplier: 2, source: 'special-shop' } as const },
] as const;

export const permanentUpgradeDefinitions = [
  { id: 'freeCooldownSkips', label: '無料カウントダウンスキップ', description: '待ち時間スキップが毎日3回まで無料', price: 500 },
  { id: 'cooldownReduction', label: 'クールダウン短縮', description: 'モンスター戦 60秒 → 50秒', price: 3000 },
  { id: 'expMultiplier', label: '獲得EXP 1.2倍', description: '獲得EXPが永久に20%増加', price: 2000 },
  { id: 'goldMultiplier', label: '獲得Gold 1.2倍', description: '獲得Goldが永久に20%増加', price: 2000 },
  { id: 'orbDropMultiplier', label: 'オーブドロップ ×1.5', description: 'オーブのドロップ率が永久に増加', price: 2000 },
  { id: 'drawExpMultiplier', label: '引き分けEXP 2倍', description: '引き分け時EXP 5% → 10%', price: 500 },
] as const;

export type PermanentUpgradeId = typeof permanentUpgradeDefinitions[number]['id'];

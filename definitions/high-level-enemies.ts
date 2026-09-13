import type { EnemyDefinition, MonsterRarity } from './types';

type AttackType = 'physical' | 'magic';
type Subject = readonly [name: string, glyph: string, attackType: AttackType];
type Theme = Readonly<{ modifiers: readonly string[]; subjects: readonly Subject[] }>;

const THEMES: Readonly<Record<number, Theme>> = {
  3: {
    modifiers: ['焦げた', '凍りついた', '暴走する', '酸っぱすぎる', '禁断の'],
    subjects: [['トースト', '🍞', 'physical'], ['炊飯器', '🍚', 'magic'], ['鍋', '🍲', 'physical'], ['冷蔵庫', '🧊', 'magic'], ['ケトル', '🫖', 'magic'], ['包丁', '🔪', 'physical'], ['まな板', '🪵', 'physical'], ['電子レンジ', '📻', 'magic'], ['調味瓶', '🧂', 'magic'], ['弁当箱', '🍱', 'physical']],
  },
  4: {
    modifiers: ['遅延する', '逆走する', '満員の', '封鎖された', '迷走する'],
    subjects: [['改札', '🚉', 'physical'], ['交差点', '🚦', 'magic'], ['バス', '🚌', 'physical'], ['地下道', '🚇', 'magic'], ['信号機', '🚥', 'magic'], ['歩道橋', '🌉', 'physical'], ['タクシー', '🚕', 'physical'], ['駐輪場', '🚲', 'physical'], ['高架線', '🛤️', 'magic'], ['案内板', '🪧', 'magic']],
  },
  5: {
    modifiers: ['差し戻された', '承認待ちの', '増殖を続ける', '期限切れの', '終わらない'],
    subjects: [['稟議書', '📑', 'magic'], ['会議室', '🏢', 'physical'], ['議事録', '📒', 'magic'], ['勤怠表', '🕒', 'physical'], ['共有資料', '📚', 'magic'], ['付箋', '🟨', 'physical'], ['申請書', '🧾', 'magic'], ['レビュー', '👀', 'physical'], ['受信箱', '📥', 'magic'], ['締切表', '📅', 'magic']],
  },
  6: {
    modifiers: ['切断された', '暗号化された', '再起動する', '無限同期の', '暴走する'],
    subjects: [['ルーター', '📡', 'magic'], ['サーバー', '🖥️', 'magic'], ['端末群', '💻', 'physical'], ['セッション', '🧵', 'magic'], ['キャッシュ', '🧊', 'magic'], ['パケット', '📦', 'physical'], ['認証鍵', '🔐', 'magic'], ['クラウド', '☁️', 'magic'], ['プロセス', '⚙️', 'physical'], ['ログ列', '📜', 'magic']],
  },
  7: {
    modifiers: ['眠れない', '午前三時の', '寝落ちした', '悪夢化した', '目覚めない'],
    subjects: [['枕', '🛏️', 'physical'], ['時計', '⏰', 'magic'], ['カーテン', '🪟', 'physical'], ['コーヒー', '☕', 'magic'], ['夢日記', '📓', 'magic'], ['毛布', '🧣', 'physical'], ['常夜灯', '💡', 'magic'], ['寝室', '🌙', 'magic'], ['アラーム', '🔔', 'physical'], ['月明かり', '🌕', 'magic']],
  },
  8: {
    modifiers: ['錆びついた', '封印された', '埃まみれの', '忘れられた', '再起動した'],
    subjects: [['タイプライター', '⌨️', 'physical'], ['映写機', '📽️', 'magic'], ['金庫', '🗄️', 'physical'], ['蓄音機', '📻', 'magic'], ['歯車箱', '⚙️', 'physical'], ['古時計', '🕰️', 'magic'], ['工具棚', '🧰', 'physical'], ['写真機', '📷', 'magic'], ['書庫扉', '🚪', 'physical'], ['真空管', '💡', 'magic']],
  },
  9: {
    modifiers: ['祭り上げられた', '祈られすぎた', '神話化した', '黄金の', '禁忌となった'],
    subjects: [['リモコン', '🎛️', 'magic'], ['冷暖房機', '❄️', 'magic'], ['掃除機', '🧹', 'physical'], ['洗濯機', '🫧', 'physical'], ['充電器', '🔌', 'magic'], ['ソファ', '🛋️', 'physical'], ['玄関鍵', '🔑', 'physical'], ['食卓', '🍽️', 'physical'], ['テレビ', '📺', 'magic'], ['照明', '💡', 'magic']],
  },
  10: {
    modifiers: ['文字化けした', '欠損した', '循環参照の', '破損した', '復元不能の'],
    subjects: [['文字列', '🔤', 'magic'], ['データ表', '📊', 'magic'], ['保存領域', '💾', 'physical'], ['索引', '🗂️', 'magic'], ['差分', '🟥', 'physical'], ['文字コード', '🔣', 'magic'], ['バックアップ', '📀', 'physical'], ['設定値', '🎚️', 'magic'], ['参照先', '🔗', 'magic'], ['履歴', '📜', 'physical']],
  },
  11: {
    modifiers: ['暴風の', '豪雨の', '灼熱の', '凍結した', '雷鳴の'],
    subjects: [['駅前広場', '🏙️', 'physical'], ['歩道', '🛣️', 'physical'], ['屋上', '🏢', 'magic'], ['電柱', '⚡', 'magic'], ['排水路', '🌊', 'physical'], ['公園', '🌳', 'physical'], ['横断歩道', '🚸', 'magic'], ['商店街', '🏪', 'physical'], ['河川敷', '🏞️', 'magic'], ['高層窓', '🪟', 'magic']],
  },
  12: {
    modifiers: ['封印記憶の', '改ざんされた', '忘却された', '逆再生する', '増殖記録の'],
    subjects: [['アルバム', '📔', 'magic'], ['日報', '📝', 'physical'], ['録音機', '🎙️', 'magic'], ['手紙束', '✉️', 'physical'], ['映像庫', '🎞️', 'magic'], ['名簿', '📋', 'physical'], ['記憶箱', '📦', 'magic'], ['古新聞', '📰', 'physical'], ['年表', '📆', 'magic'], ['証言録', '📖', 'magic']],
  },
  13: {
    modifiers: ['終末の', '巻き戻る', '無限反復の', '千年先の', '時を喰う'],
    subjects: [['カレンダー', '📅', 'magic'], ['秒針', '⏱️', 'physical'], ['砂時計', '⌛', 'magic'], ['予定表', '🗓️', 'physical'], ['締切鐘', '🔔', 'magic'], ['時報塔', '🗼', 'physical'], ['未来便', '🚄', 'physical'], ['過去帳', '📜', 'magic'], ['時計盤', '🕰️', 'magic'], ['午前零時', '🌑', 'magic']],
  },
};

const BASE: Readonly<Record<number, Readonly<{ hp: number; attack: number; defense: number; magicDefense: number; luck: number; exp: number; gold: number }>>> = {
  3: { hp: 220, attack: 32, defense: 14, magicDefense: 13, luck: 12, exp: 105, gold: 150 },
  4: { hp: 430, attack: 58, defense: 25, magicDefense: 23, luck: 17, exp: 205, gold: 300 },
  5: { hp: 820, attack: 105, defense: 43, magicDefense: 40, luck: 23, exp: 390, gold: 570 },
  6: { hp: 1_500, attack: 185, defense: 73, magicDefense: 68, luck: 30, exp: 710, gold: 1_020 },
  7: { hp: 2_700, attack: 320, defense: 120, magicDefense: 113, luck: 39, exp: 1_260, gold: 1_800 },
  8: { hp: 4_800, attack: 540, defense: 198, magicDefense: 186, luck: 50, exp: 2_200, gold: 3_100 },
  9: { hp: 8_500, attack: 900, defense: 320, magicDefense: 302, luck: 63, exp: 3_800, gold: 5_300 },
  10: { hp: 15_000, attack: 1_500, defense: 515, magicDefense: 486, luck: 78, exp: 6_500, gold: 9_000 },
  11: { hp: 26_000, attack: 2_450, defense: 830, magicDefense: 785, luck: 95, exp: 11_000, gold: 15_000 },
  12: { hp: 45_000, attack: 3_900, defense: 1_320, magicDefense: 1_250, luck: 114, exp: 18_500, gold: 25_000 },
  13: { hp: 76_000, attack: 6_100, defense: 2_080, magicDefense: 1_970, luck: 136, exp: 30_500, gold: 41_000 },
};

const GEM_DROP_BY_RARITY: Readonly<Record<MonsterRarity, number>> = { common: .005, uncommon: .012, rare: .035, epic: .08, legendary: .18, boss: .30 };
const ORB_DROP_BY_RARITY: Readonly<Record<MonsterRarity, number>> = { common: .002, uncommon: .005, rare: .012, epic: .022, legendary: .04, boss: .06 };
const SPECIAL_BY_RARITY: Readonly<Record<MonsterRarity, number>> = { common: .01, uncommon: .03, rare: .07, epic: .12, legendary: .18, boss: .24 };
const RARITY_SCALE: Readonly<Record<MonsterRarity, number>> = { common: 1, uncommon: 1.16, rare: 1.48, epic: 1.82, legendary: 2.32, boss: 3.05 };

function rarityForIndex(index: number): MonsterRarity {
  if (index < 25) return 'common';
  if (index < 37) return 'uncommon';
  if (index < 43) return 'rare';
  if (index < 46) return 'epic';
  if (index < 48) return 'legendary';
  return 'boss';
}

function buildLevel(level: number, theme: Theme): readonly EnemyDefinition[] {
  const base = BASE[level];
  if (base === undefined) throw new Error(`Missing monster base for level ${level}.`);
  const combinations = theme.modifiers.flatMap((modifier) => theme.subjects.map((subject) => [modifier, subject] as const));
  if (combinations.length !== 50) throw new Error(`Monster level ${level} must generate exactly 50 entries.`);
  return combinations.map(([modifier, [subject, glyph, attackType]], index) => {
    const rarity = rarityForIndex(index);
    const scale = RARITY_SCALE[rarity];
    const wobble = .96 + (index % 7) * .014;
    const primary = Math.max(1, Math.round(base.attack * scale * wobble));
    return {
      id: `enemy.lv${level}_${String(index + 1).padStart(2, '0')}`,
      displayName: `${modifier}${subject}`,
      glyph,
      rarity,
      monsterLevel: level,
      hp: Math.max(1, Math.round(base.hp * scale * (.96 + (index % 9) * .012))),
      attack: attackType === 'physical' ? primary : Math.max(1, Math.round(primary * .34)),
      defense: Math.max(1, Math.round(base.defense * scale * (.96 + (index % 5) * .02))),
      magicAttack: attackType === 'magic' ? Math.round(primary * 1.08) : Math.max(0, Math.round(primary * .27)),
      magicDefense: Math.max(1, Math.round(base.magicDefense * scale * (attackType === 'magic' ? 1.12 : 1))),
      luck: Math.max(1, Math.round(base.luck * Math.sqrt(scale) * (1 + (index % 6) * .05))),
      exp: Math.max(1, Math.round(base.exp * scale * (1 + Math.max(0, rarityIndex(rarity) - 1) * .09))),
      gold: Math.max(1, Math.round(base.gold * scale * (1 + Math.max(0, rarityIndex(rarity) - 1) * .11))),
      gemDropChance: GEM_DROP_BY_RARITY[rarity],
      orbDropChance: ORB_DROP_BY_RARITY[rarity],
      specialChance: SPECIAL_BY_RARITY[rarity],
      attackType,
      quote: `Lv.${level}の異常が、日常の顔をして立ちはだかる。`,
    } satisfies EnemyDefinition;
  });
}

function rarityIndex(rarity: MonsterRarity): number {
  return ['common', 'uncommon', 'rare', 'epic', 'legendary', 'boss'].indexOf(rarity);
}

export const highLevelEnemies: readonly EnemyDefinition[] = Object.entries(THEMES)
  .sort(([a], [b]) => Number(a) - Number(b))
  .flatMap(([level, theme]) => buildLevel(Number(level), theme));

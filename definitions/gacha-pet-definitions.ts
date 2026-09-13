import type { MonsterRarity } from './types';

export type GachaPetDefinition = Readonly<{
  id: string;
  displayName: string;
  glyph: string;
  rarity: MonsterRarity;
  attackType: 'physical' | 'magic';
}>;

const pet = (
  id: string,
  displayName: string,
  glyph: string,
  rarity: MonsterRarity,
  attackType: 'physical' | 'magic',
): GachaPetDefinition => ({ id: `gacha-pet.${id}`, displayName, glyph, rarity, attackType });

export const gachaPetDefinitions: readonly GachaPetDefinition[] = [
  pet('second_mouse', '秒針ネズミ', '🐭', 'common', 'physical'),
  pet('memo_moth', 'メモ蛾', '🦋', 'common', 'magic'),
  pet('sock_wisp', '片靴下ウィスプ', '🧦', 'common', 'magic'),
  pet('sand_slime', '砂時計スライム', '⏳', 'common', 'physical'),
  pet('ink_sparrow', 'インク雀', '🐦', 'common', 'magic'),
  pet('key_crab', '鍵束ガニ', '🦀', 'common', 'physical'),
  pet('receipt_snake', 'レシートヘビ', '🐍', 'common', 'physical'),
  pet('mug_bug', 'マグカップ虫', '☕', 'common', 'magic'),
  pet('staple_hedgehog', 'ホチキスハリネズミ', '🦔', 'common', 'physical'),
  pet('eraser_blob', '消しゴムぷるん', '🧽', 'common', 'physical'),
  pet('bookmark_cat', 'しおり猫', '🐈', 'common', 'magic'),
  pet('coin_beetle', '小銭カブト', '🪲', 'common', 'physical'),

  pet('calendar_fox', 'カレンダー狐', '🦊', 'uncommon', 'magic'),
  pet('lamp_jelly', '卓上灯クラゲ', '🪼', 'uncommon', 'magic'),
  pet('folder_turtle', '書類亀', '🐢', 'uncommon', 'physical'),
  pet('cable_ferret', '絡まりケーブル鼬', '🦦', 'uncommon', 'physical'),
  pet('stamp_frog', '印鑑カエル', '🐸', 'uncommon', 'magic'),
  pet('pencil_wolf', '鉛筆狼', '🐺', 'uncommon', 'physical'),
  pet('clock_owl', '残業時計フクロウ', '🦉', 'uncommon', 'magic'),
  pet('mail_bat', '未送信コウモリ', '🦇', 'uncommon', 'magic'),
  pet('ruler_lizard', '定規トカゲ', '🦎', 'uncommon', 'physical'),
  pet('paperplane_hawk', '紙飛行機鷹', '🦅', 'uncommon', 'physical'),

  pet('deadline_hound', '締切猟犬', '🐕', 'rare', 'physical'),
  pet('archive_stag', '書庫の大鹿', '🦌', 'rare', 'magic'),
  pet('coffee_golem', '深煎りゴーレム', '🗿', 'rare', 'physical'),
  pet('blueprint_ray', '設計図エイ', '🐟', 'rare', 'magic'),
  pet('whiteboard_ram', '白板ヒツジ', '🐏', 'rare', 'physical'),
  pet('elevator_mimic', '昇降箱ミミック', '📦', 'rare', 'physical'),
  pet('signal_puma', '電波ピューマ', '🐆', 'rare', 'magic'),
  pet('ledger_boar', '台帳イノシシ', '🐗', 'rare', 'physical'),
  pet('printer_octopus', '複合機タコ', '🐙', 'rare', 'magic'),
  pet('night_train', '終電の仔馬', '🐎', 'rare', 'physical'),

  pet('neon_griffin', 'ネオングリフォン', '🦅', 'epic', 'magic'),
  pet('overtime_oni', '残業鬼童', '👹', 'epic', 'physical'),
  pet('cloud_whale', 'クラウド鯨', '🐋', 'epic', 'magic'),
  pet('invoice_tiger', '請求書虎', '🐅', 'epic', 'physical'),
  pet('backup_phoenix', 'バックアップ不死鳥', '🔥', 'epic', 'magic'),
  pet('meeting_hydra', '会議ヒュドラ', '🐲', 'epic', 'physical'),
  pet('pixel_kirin', '画素麒麟', '🦄', 'epic', 'magic'),
  pet('deadline_knight', '締切騎獣', '🐎', 'epic', 'physical'),

  pet('midnight_dragon', '零時竜', '🐉', 'legendary', 'magic'),
  pet('archive_leviathan', '大書庫リヴァイアサン', '🐋', 'legendary', 'magic'),
  pet('golden_week_beast', '黄金週獣', '🦁', 'legendary', 'physical'),
  pet('silent_server', '静寂サーバー獣', '🖥️', 'legendary', 'magic'),
  pet('infinite_task', '無限タスク獣', '♾️', 'legendary', 'physical'),
  pet('last_train_roc', '最終便ロック鳥', '🦅', 'legendary', 'physical'),

  pet('month_end_titan', '月末巨神', '🗿', 'boss', 'physical'),
  pet('zero_inbox_seraph', '受信箱ゼロの熾天使', '😇', 'boss', 'magic'),
  pet('eternal_monday', '永劫月曜獣', '🌞', 'boss', 'physical'),
  pet('master_clock', '万象時計王', '🕰️', 'boss', 'magic'),
] as const;

export const duplicateSnackRewardByRarity: Readonly<Record<MonsterRarity, number>> = {
  common: 100,
  uncommon: 100,
  rare: 200,
  epic: 225,
  legendary: 250,
  boss: 300,
};

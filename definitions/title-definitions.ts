import type { ProgressiveTitleDefinition } from 'idle-game-kit';

export type TitleEffectFamily =
  | 'openingDamage'
  | 'damageReduction'
  | 'battleDamage'
  | 'physicalDamage'
  | 'magicDamage'
  | 'criticalChance'
  | 'criticalDamage'
  | 'evasion'
  | 'regen'
  | 'gold'
  | 'exp'
  | 'petDamage'
  | 'capture';

export type MinuteVanguardTitleDefinition = ProgressiveTitleDefinition & Readonly<{
  displayName: string;
  description: string;
  effectFamily: TitleEffectFamily;
  values: readonly [number, number, number, number, number];
}>;

const title = (
  id: string,
  displayName: string,
  cost: 1 | 2 | 3 | 4,
  effectFamily: TitleEffectFamily,
  values: readonly [number, number, number, number, number],
  description: string,
): MinuteVanguardTitleDefinition => ({ id, displayName, cost, effectFamily, values, description });

/**
 * 52 original titles arranged as 13 effect families × 4 cost profiles.
 * The collection/equipment cadence follows the public behavioral reference,
 * while names and concrete effect balance remain Minute Vanguard-owned.
 */
export const titleDefinitions: readonly MinuteVanguardTitleDefinition[] = [
  title('title.dawn_runner', '夜明け走り', 1, 'openingDamage', [1.08, 1.11, 1.14, 1.17, 1.20], '1ターン目の直接ダメージが上がる。'),
  title('title.first_bell', '一番鐘', 2, 'openingDamage', [1.12, 1.18, 1.24, 1.30, 1.36], '1ターン目の直接ダメージが上がる。'),
  title('title.vanguard_note', '先陣の覚書', 3, 'openingDamage', [1.18, 1.28, 1.38, 1.48, 1.60], '1ターン目の直接ダメージが大きく上がる。'),
  title('title.opening_salvo', '開幕号令', 4, 'openingDamage', [1.25, 1.40, 1.55, 1.75, 2.00], '1ターン目の直接ダメージが大幅に上がる。'),

  title('title.padding', '緩衝材係', 1, 'damageReduction', [0.03, 0.04, 0.05, 0.06, 0.07], '受けるダメージを少し減らす。'),
  title('title.safety_check', '安全確認役', 2, 'damageReduction', [0.06, 0.08, 0.10, 0.12, 0.14], '受けるダメージを減らす。'),
  title('title.wall_keeper', '壁際の番人', 3, 'damageReduction', [0.10, 0.14, 0.18, 0.22, 0.26], '受けるダメージを大きく減らす。'),
  title('title.last_bastion', '最後の防波堤', 4, 'damageReduction', [0.14, 0.19, 0.24, 0.29, 0.34], '受けるダメージを大幅に減らす。'),

  title('title.small_push', 'あと一押し', 1, 'battleDamage', [1.02, 1.03, 1.04, 1.05, 1.06], 'モンスターへの直接ダメージが上がる。'),
  title('title.momentum', '勢い任せ', 2, 'battleDamage', [1.04, 1.06, 1.08, 1.10, 1.12], 'モンスターへの直接ダメージが上がる。'),
  title('title.closer', '締め切り役', 3, 'battleDamage', [1.06, 1.09, 1.12, 1.15, 1.18], 'モンスターへの直接ダメージが上がる。'),
  title('title.full_commit', '全力担当', 4, 'battleDamage', [1.08, 1.12, 1.16, 1.20, 1.25], 'モンスターへの直接ダメージが大きく上がる。'),

  title('title.box_lifter', '箱持ち', 1, 'physicalDamage', [1.03, 1.04, 1.05, 1.06, 1.07], '物理攻撃のダメージが上がる。'),
  title('title.iron_arm', '鉄腕係', 2, 'physicalDamage', [1.05, 1.07, 1.09, 1.11, 1.13], '物理攻撃のダメージが上がる。'),
  title('title.heavy_swing', '大振り番', 3, 'physicalDamage', [1.08, 1.11, 1.14, 1.17, 1.20], '物理攻撃のダメージが大きく上がる。'),
  title('title.gate_breaker', '門砕き', 4, 'physicalDamage', [1.10, 1.14, 1.18, 1.22, 1.28], '物理攻撃のダメージが大幅に上がる。'),

  title('title.memo_reader', '走り書き読み', 1, 'magicDamage', [1.03, 1.04, 1.05, 1.06, 1.07], '魔法攻撃のダメージが上がる。'),
  title('title.symbol_keeper', '記号番', 2, 'magicDamage', [1.05, 1.07, 1.09, 1.11, 1.13], '魔法攻撃のダメージが上がる。'),
  title('title.star_reader', '星読み見習い', 3, 'magicDamage', [1.08, 1.11, 1.14, 1.17, 1.20], '魔法攻撃のダメージが大きく上がる。'),
  title('title.formula_sage', '式の賢者', 4, 'magicDamage', [1.10, 1.14, 1.18, 1.22, 1.28], '魔法攻撃のダメージが大幅に上がる。'),

  title('title.good_eye', '目利き', 1, 'criticalChance', [0.01, 0.015, 0.02, 0.025, 0.03], 'クリティカル率が上がる。'),
  title('title.aimed_hand', '狙い手', 2, 'criticalChance', [0.02, 0.03, 0.04, 0.05, 0.06], 'クリティカル率が上がる。'),
  title('title.weak_point', '急所読み', 3, 'criticalChance', [0.03, 0.045, 0.06, 0.075, 0.09], 'クリティカル率が大きく上がる。'),
  title('title.single_focus', '一点集中', 4, 'criticalChance', [0.04, 0.06, 0.08, 0.10, 0.12], 'クリティカル率が大幅に上がる。'),

  title('title.aftershock', '余震係', 1, 'criticalDamage', [1.82, 1.84, 1.86, 1.88, 1.90], 'クリティカル時の倍率が上がる。'),
  title('title.deep_cut', '深追い', 2, 'criticalDamage', [1.86, 1.90, 1.94, 1.98, 2.02], 'クリティカル時の倍率が上がる。'),
  title('title.sharp_finish', '鋭い締め', 3, 'criticalDamage', [1.90, 1.96, 2.02, 2.08, 2.14], 'クリティカル時の倍率が大きく上がる。'),
  title('title.break_point', '決壊点', 4, 'criticalDamage', [1.95, 2.05, 2.15, 2.25, 2.40], 'クリティカル時の倍率が大幅に上がる。'),

  title('title.side_step', '横歩き', 1, 'evasion', [0.01, 0.015, 0.02, 0.025, 0.03], '敵の攻撃を別判定で回避する。'),
  title('title.slip_through', 'すり抜け役', 2, 'evasion', [0.02, 0.03, 0.04, 0.05, 0.06], '敵の攻撃を別判定で回避する。'),
  title('title.no_shadow', '影踏まず', 3, 'evasion', [0.03, 0.045, 0.06, 0.075, 0.09], '敵の攻撃を別判定で回避する。'),
  title('title.vanish', '消える人', 4, 'evasion', [0.04, 0.055, 0.07, 0.085, 0.10], '敵の攻撃を別判定で回避する。'),

  title('title.water_bottle', '水筒持ち', 1, 'regen', [0.005, 0.007, 0.009, 0.011, 0.013], '毎ターン最大HPの一部を回復する。'),
  title('title.break_master', '休憩上手', 2, 'regen', [0.01, 0.014, 0.018, 0.022, 0.026], '毎ターン最大HPの一部を回復する。'),
  title('title.deep_breath', '深呼吸', 3, 'regen', [0.015, 0.021, 0.027, 0.033, 0.039], '毎ターン最大HPの一部を回復する。'),
  title('title.second_wind', '息継ぎ名人', 4, 'regen', [0.02, 0.028, 0.036, 0.044, 0.052], '毎ターン最大HPの一部を回復する。'),

  title('title.coin_picker', '小銭拾い', 1, 'gold', [0.02, 0.03, 0.04, 0.05, 0.06], '勝利時のGoldが増える。'),
  title('title.ledger_keeper', '帳簿係', 2, 'gold', [0.04, 0.06, 0.08, 0.10, 0.12], '勝利時のGoldが増える。'),
  title('title.good_deal', '商談上手', 3, 'gold', [0.06, 0.09, 0.12, 0.15, 0.18], '勝利時のGoldが大きく増える。'),
  title('title.gold_vein', '金脈探し', 4, 'gold', [0.08, 0.12, 0.16, 0.20, 0.25], '勝利時のGoldが大幅に増える。'),

  title('title.note_taker', 'メモ取り', 1, 'exp', [0.02, 0.03, 0.04, 0.05, 0.06], '戦闘EXPが増える。'),
  title('title.reviewer', '復習家', 2, 'exp', [0.04, 0.06, 0.08, 0.10, 0.12], '戦闘EXPが増える。'),
  title('title.study_lead', '学習係', 3, 'exp', [0.06, 0.09, 0.12, 0.15, 0.18], '戦闘EXPが大きく増える。'),
  title('title.lesson_master', '反省会長', 4, 'exp', [0.08, 0.12, 0.16, 0.20, 0.25], '戦闘EXPが大幅に増える。'),

  title('title.feeder', '餌やり係', 1, 'petDamage', [1.04, 1.06, 1.08, 1.10, 1.12], '連れ歩くペットの追撃が強くなる。'),
  title('title.walker', '散歩係', 2, 'petDamage', [1.08, 1.12, 1.16, 1.20, 1.24], '連れ歩くペットの追撃が強くなる。'),
  title('title.sync_breather', '呼吸合わせ', 3, 'petDamage', [1.12, 1.18, 1.24, 1.30, 1.36], '連れ歩くペットの追撃が大きく強くなる。'),
  title('title.pack_leader', '群れの先導', 4, 'petDamage', [1.16, 1.24, 1.32, 1.40, 1.50], '連れ歩くペットの追撃が大幅に強くなる。'),

  title('title.soothe_hand', 'なだめ役', 1, 'capture', [0.002, 0.003, 0.004, 0.005, 0.006], '捕獲解禁後の仲間になる確率が上がる。'),
  title('title.friendly_voice', 'やさしい声', 2, 'capture', [0.004, 0.006, 0.008, 0.010, 0.012], '捕獲解禁後の仲間になる確率が上がる。'),
  title('title.trust_builder', '信頼づくり', 3, 'capture', [0.006, 0.009, 0.012, 0.015, 0.018], '捕獲解禁後の仲間になる確率が大きく上がる。'),
  title('title.heart_bridge', '心の橋渡し', 4, 'capture', [0.010, 0.015, 0.020, 0.025, 0.030], '捕獲解禁後の仲間になる確率が大幅に上がる。'),
] as const;

export const titleRules = { copyThresholds: [1, 3, 6, 10, 15], maxSlots: 5 } as const;
export const TITLE_SHOP_PRICE = 300;
export const TITLE_DROP_CHANCE = 0.01;
export const TITLE_RESET_COST = 300;

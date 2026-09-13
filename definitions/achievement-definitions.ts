import type { AchievementDefinition } from 'idle-game-kit';

export type SoloAchievementCategory = 'battle' | 'codex' | 'progression' | 'pet' | 'orb' | 'title' | 'wealth' | 'arena';
export type SoloAchievementMetric =
  | 'battles' | 'wins' | 'discoveries' | 'monsterLevel' | 'jobChanges'
  | 'pets' | 'mutatedPets' | 'training'
  | 'orbs' | 'orbRank' | 'titleUnique' | 'titleMastered'
  | 'gold' | 'playerLevel' | 'arenaBestTier' | 'arenaChampionships';

export type SoloAchievementDefinition = AchievementDefinition & Readonly<{
  category: SoloAchievementCategory;
  metricId: SoloAchievementMetric;
  target: number;
}>;

const tierMarks = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII'] as const;

function track(
  category: SoloAchievementCategory,
  metricId: SoloAchievementMetric,
  label: string,
  targets: readonly number[],
  unit: string,
): readonly SoloAchievementDefinition[] {
  return targets.map((target, index) => ({
    id: `achievement.${metricId}.${target}`,
    displayName: `${label} ${tierMarks[index] ?? index + 1}`,
    description: `${target.toLocaleString()}${unit}に到達`,
    category,
    metricId,
    target,
    condition: { type: 'activity-progress-at-least', activityId: metricId, progress: target },
    progressMetric: { type: 'activity-progress', activityId: metricId, target },
    rewards: [],
  }));
}


const arenaTierAchievementNames = [
  '闘技場の門番', '青銅の挑戦者', '白銀の闘士', '黄金の勝者', '白金の競争者',
  '翠玉の守人', '蒼玉の強者', '紅玉の覇者', '金剛の王手', '頂点到達者',
] as const;

export const arenaAchievementTierIds = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'sapphire', 'ruby', 'diamond', 'master'] as const;

export function arenaAchievementTierRank(tierId: string): number {
  const index = arenaAchievementTierIds.indexOf(tierId as (typeof arenaAchievementTierIds)[number]);
  return index < 0 ? 0 : index + 1;
}

const arenaTierAchievements: readonly SoloAchievementDefinition[] = arenaAchievementTierIds.map((tierId, index) => ({
  id: `achievement.arenaTier.${tierId}`,
  displayName: arenaTierAchievementNames[index]!,
  description: `Arenaで${['アイアン','ブロンズ','シルバー','ゴールド','プラチナ','エメラルド','サファイア','ルビー','ダイヤ','マスター'][index]}に到達`,
  category: 'arena',
  metricId: 'arenaBestTier',
  target: index + 1,
  condition: { type: 'activity-progress-at-least', activityId: 'arenaBestTier', progress: index + 1 },
  progressMetric: { type: 'activity-progress', activityId: 'arenaBestTier', target: index + 1 },
  rewards: [],
}));

const arenaChampionAchievement: SoloAchievementDefinition = {
  id: 'achievement.arenaChampion.1',
  displayName: '週冠の覇者',
  description: 'Arenaの週間Championになる',
  category: 'arena',
  metricId: 'arenaChampionships',
  target: 1,
  condition: { type: 'activity-progress-at-least', activityId: 'arenaChampionships', progress: 1 },
  progressMetric: { type: 'activity-progress', activityId: 'arenaChampionships', target: 1 },
  rewards: [],
};

export const soloAchievementDefinitions: readonly SoloAchievementDefinition[] = [
  ...track('battle', 'battles', '戦場の記録', [1, 10, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000], '戦'),
  ...track('battle', 'wins', '勝者の足跡', [1, 10, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000], '勝'),
  ...track('codex', 'discoveries', '観測者', [1, 10, 50, 100, 250, 500, 650], '種発見'),
  ...track('codex', 'monsterLevel', '深層踏破', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], '層解放'),
  ...track('progression', 'playerLevel', '積み上げる者', [10, 30, 100, 300, 1_000, 3_000, 5_000], 'Lv'),
  ...track('progression', 'jobChanges', '職歴の旅人', [1, 5, 10, 25, 50, 100, 300], '回転職'),
  ...track('pet', 'pets', '仲間集め', [1, 5, 10, 25, 50, 100, 250, 500], '体'),
  ...track('pet', 'mutatedPets', '変異の友', [1, 5, 10, 25, 50, 100], '体'),
  ...track('pet', 'training', '育成家', [20, 100, 500, 1_000, 2_500, 5_000], '訓練Lv'),
  ...track('orb', 'orbs', '輝石蒐集', [1, 5, 10, 25, 50, 100], '個'),
  ...track('orb', 'orbRank', '輝石到達', [2, 3, 4, 5, 6, 7, 8, 9], '段階'),
  ...track('title', 'titleUnique', '肩書き蒐集', [1, 10, 25, 40, 52], '種'),
  ...track('title', 'titleMastered', '肩書き極致', [1, 5, 10, 25, 52], '種極め'),
  ...track('wealth', 'gold', '金庫番', [1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000], 'G所持'),
  ...arenaTierAchievements,
  arenaChampionAchievement,
];

export const soloAchievementCategoryLabels: Readonly<Record<SoloAchievementCategory, string>> = {
  battle: '戦闘', codex: '図鑑', progression: '成長', pet: 'ペット', orb: 'オーブ', title: '肩書き', wealth: '財産', arena: 'Arena',
};

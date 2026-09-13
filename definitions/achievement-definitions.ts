import type { AchievementDefinition } from 'idle-game-kit';

export type SoloAchievementCategory = 'battle' | 'codex' | 'progression' | 'pet' | 'orb' | 'title' | 'wealth';
export type SoloAchievementMetric =
  | 'battles' | 'wins' | 'discoveries' | 'monsterLevel' | 'jobChanges'
  | 'pets' | 'mutatedPets' | 'training'
  | 'orbs' | 'orbRank' | 'titleUnique' | 'titleMastered'
  | 'gold' | 'playerLevel';

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
];

export const soloAchievementCategoryLabels: Readonly<Record<SoloAchievementCategory, string>> = {
  battle: '戦闘', codex: '図鑑', progression: '成長', pet: 'ペット', orb: 'オーブ', title: '肩書き', wealth: '財産',
};

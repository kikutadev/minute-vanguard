export type BattleSceneDaypart = 'morning' | 'day' | 'evening' | 'night';

export type BattleSceneDefinition = Readonly<{
  monsterLevel: number;
  displayName: string;
  cssClass: string;
}>;

export const battleSceneDayparts: readonly BattleSceneDaypart[] = ['morning', 'day', 'evening', 'night'];

export const battleSceneDefinitions: readonly BattleSceneDefinition[] = [
  { monsterLevel: 1, displayName: '朝靄の外縁', cssClass: 'scene-level-1' },
  { monsterLevel: 2, displayName: '錆びた通勤路', cssClass: 'scene-level-2' },
  { monsterLevel: 3, displayName: '眠らない倉庫街', cssClass: 'scene-level-3' },
  { monsterLevel: 4, displayName: '雨漏り工業区', cssClass: 'scene-level-4' },
  { monsterLevel: 5, displayName: '書類砂漠', cssClass: 'scene-level-5' },
  { monsterLevel: 6, displayName: '停電街区', cssClass: 'scene-level-6' },
  { monsterLevel: 7, displayName: '通知嵐高架', cssClass: 'scene-level-7' },
  { monsterLevel: 8, displayName: '凍結データ庭園', cssClass: 'scene-level-8' },
  { monsterLevel: 9, displayName: '失敗神話区', cssClass: 'scene-level-9' },
  { monsterLevel: 10, displayName: '文字化け境界', cssClass: 'scene-level-10' },
  { monsterLevel: 11, displayName: '逆襲の素材原', cssClass: 'scene-level-11' },
  { monsterLevel: 12, displayName: '崩れた業務区', cssClass: 'scene-level-12' },
  { monsterLevel: 13, displayName: '腐食食堂跡', cssClass: 'scene-level-13' },
];

export function battleSceneDefinition(monsterLevel: number): BattleSceneDefinition {
  const level = Math.max(1, Math.min(battleSceneDefinitions.length, Math.round(monsterLevel)));
  return battleSceneDefinitions[level - 1]!;
}

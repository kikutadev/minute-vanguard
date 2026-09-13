import { describe, expect, it } from 'vitest';
import { battleSceneDefinition, battleSceneDefinitions, battleSceneDayparts } from '../definitions/battle-scene-definitions';
import { createInitialState, fight } from '../plugin/engine';

describe('battle scenes', () => {
  it('ships one original scene for every supported monster level', () => {
    expect(battleSceneDefinitions).toHaveLength(13);
    expect(new Set(battleSceneDefinitions.map((scene) => scene.displayName)).size).toBe(13);
    expect(battleSceneDefinitions.map((scene) => scene.monsterLevel)).toEqual(Array.from({ length: 13 }, (_, index) => index + 1));
    expect(battleSceneDayparts).toEqual(['morning', 'day', 'evening', 'night']);
  });

  it('clamps scene lookup to the supported range', () => {
    expect(battleSceneDefinition(-2).monsterLevel).toBe(1);
    expect(battleSceneDefinition(99).monsterLevel).toBe(13);
  });

  it('carries the selected monster level into the resolved battle for result-scene continuity', () => {
    const initial = createInitialState(0, 17);
    const result = fight(initial);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.state.gameData.lastBattle?.monsterLevel).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import {
  activateBattleBoost,
  createInitialState,
  fight,
  healAtInn,
  innHealCost,
} from '../plugin/engine';

describe('battle prep and inn parity', () => {
  it('spends 10 Gem up front for one Battle Boost and consumes it on the next battle', () => {
    const initial = createInitialState(0, 900);
    const funded = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(10).serialize() },
      gameData: {
        ...initial.gameData,
        player: {
          ...initial.gameData.player,
          currentHp: 10_000,
          baseStats: { hp: 10_000, attack: 5_000, defense: 5_000, magicAttack: 5_000, magicDefense: 5_000, luck: 10 },
        },
      },
    };
    const activated = activateBattleBoost(funded);
    expect(activated.accepted).toBe(true);
    if (!activated.accepted) return;
    expect(GameNumber.deserialize(activated.state.currencies[ids.currency.gem]!).toNumber()).toBe(0);
    expect(activated.state.gameData.battleBoostActive).toBe(true);
    const battle = fight(activated.state);
    expect(battle.accepted).toBe(true);
    if (!battle.accepted) return;
    expect(battle.state.gameData.battleBoostActive).toBe(false);
    expect(battle.state.gameData.lastBattle?.goldBreakdown).toContainEqual({ label: 'Battle Boost', mode: 'multiplier', value: 2 });
    expect(battle.state.gameData.lastBattle?.expBreakdown).toContainEqual({ label: 'Battle Boost', mode: 'multiplier', value: 2 });
  });

  it('prices the inn at 10% of carried Gold capped by level x100 and is free at 9G or less', () => {
    const initial = createInitialState(0, 901);
    const state = (gold: number, level: number) => ({
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gold]: GameNumber.from(gold).serialize() },
      gameData: { ...initial.gameData, player: { ...initial.gameData.player, level, currentHp: 1 } },
    });
    expect(innHealCost(state(9, 1))).toBe(0);
    expect(innHealCost(state(500, 1))).toBe(50);
    expect(innHealCost(state(100_000, 10))).toBe(1_000);
    const healed = healAtInn(state(500, 1));
    expect(healed.accepted).toBe(true);
    if (!healed.accepted) return;
    expect(GameNumber.deserialize(healed.state.currencies[ids.currency.gold]!).toNumber()).toBe(450);
  });
});

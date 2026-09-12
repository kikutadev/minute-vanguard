import { describe, expect, it } from 'vitest';
import { GameNumber } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import {
  advanceFromWallClock,
  battleCooldown,
  buyShopItem,
  changeJob,
  createInitialState,
  fight,
} from '../plugin/engine';
import { simulateBattles } from '../simulator/progression';

describe('Minute Vanguard vertical slice', () => {
  it('resolves one battle immediately, blocks repeat input, then unlocks at the cooldown boundary', () => {
    const initial = createInitialState(1_000, 1234);
    const first = fight(initial);
    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(first.state.gameData.totalBattles).toBe(1);
    expect(battleCooldown(first.state).remainingSec).toBe(5);

    const blocked = fight(first.state);
    expect(blocked.accepted).toBe(false);
    if (blocked.accepted) return;
    expect(blocked.reason).toBe('cooldown-active');
    expect(blocked.state).toBe(first.state);

    const advanced = advanceFromWallClock(first.state, first.state.lastWallClockMs + 5_000).state;
    expect(battleCooldown(advanced).ready).toBe(true);
    expect(fight(advanced).accepted).toBe(true);
  });

  it('is deterministic for the same seed, state and command sequence', () => {
    const left = fight(createInitialState(0, 991));
    const right = fight(createInitialState(0, 991));
    expect(left.accepted).toBe(true);
    expect(right.accepted).toBe(true);
    if (!left.accepted || !right.accepted) return;
    expect(left.state.gameData.lastBattle).toEqual(right.state.gameData.lastBattle);
    expect(left.state.rngStreams).toEqual(right.state.rngStreams);
  });

  it('uses Kit inventory/loadout in product shop purchases', () => {
    const initial = createInitialState(0, 77);
    const funded = {
      ...initial,
      currencies: {
        ...initial.currencies,
        [ids.currency.gold]: GameNumber.from(100).serialize(),
      },
    };
    const bought = buyShopItem(funded, ids.item.rustSpear);
    expect(bought.accepted).toBe(true);
    if (!bought.accepted) return;
    const equippedId = bought.state.gameData.loadout.equipped.weapon;
    expect(equippedId).toBeDefined();
    expect(equippedId).not.toBeNull();
    if (equippedId === null || equippedId === undefined) return;
    expect(bought.state.gameData.inventory[equippedId]?.definitionId).toBe(ids.item.rustSpear);
  });

  it('job change resets level but retains durable inventory and resources', () => {
    const initial = createInitialState(0, 44);
    const prepared = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gold]: GameNumber.from(100).serialize() },
      gameData: {
        ...initial.gameData,
        player: { ...initial.gameData.player, level: 10 },
      },
    };
    const bought = buyShopItem(prepared, ids.item.paddedCoat);
    expect(bought.accepted).toBe(true);
    if (!bought.accepted) return;
    const changed = changeJob(bought.state);
    expect(changed.accepted).toBe(true);
    if (!changed.accepted) return;
    expect(changed.state.gameData.player.level).toBe(1);
    expect(changed.state.gameData.player.jobRank).toBe(1);
    expect(changed.state.gameData.player.permanentPower).toBe(3);
    expect(Object.keys(changed.state.gameData.inventory)).toHaveLength(1);
    expect(GameNumber.deserialize(changed.state.currencies[ids.currency.gold]!).compare(0)).toBeGreaterThan(0);
  });

  it('same-core simulator can advance a compact progression run without UI timers', () => {
    const summary = simulateBattles(12, 2026);
    expect(summary.battles).toBe(12);
    expect(summary.victories + summary.defeats).toBe(12);
    expect(summary.elapsedSec).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import { GameNumber, addProgressiveTitleCopy } from 'idle-game-kit';
import { ids } from '../definitions/game-definitions';
import { TITLE_SHOP_PRICE, titleDefinitions, titleRules } from '../definitions/title-definitions';
import {
  advanceFromWallClock,
  buyDailyTitle,
  changeJob,
  createInitialState,
  dailyTitleOffers,
  equipOwnedTitle,
  fight,
  resetEquippedTitles,
  titleCostLimitForLevel,
  titleEquipCost,
  titleLevel,
} from '../plugin/engine';

describe('Minute Vanguard title loop', () => {
  it('keeps the 52-title density, five slots, cumulative level thresholds and verified cost anchors', () => {
    expect(titleDefinitions).toHaveLength(52);
    expect(titleRules).toEqual({ copyThresholds: [1, 3, 6, 10, 15], maxSlots: 5 });
    expect(titleCostLimitForLevel(1)).toBe(4);
    expect(titleCostLimitForLevel(30)).toBe(10);
    expect(titleCostLimitForLevel(120)).toBe(16);
    expect(titleCostLimitForLevel(5000)).toBe(40);
    expect(titleCostLimitForLevel(9000)).toBe(40);
  });

  it('offers exactly three fixed daily titles and sells each offer at most once for 300 Gem', () => {
    const initial = createInitialState(0, 90);
    const funded = {
      ...initial,
      currencies: { ...initial.currencies, [ids.currency.gem]: GameNumber.from(1_000).serialize() },
    };
    const offers = dailyTitleOffers(funded);
    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((definition) => definition.id)).size).toBe(3);

    const purchased = buyDailyTitle(funded, offers[0]!.id);
    expect(purchased.accepted).toBe(true);
    if (!purchased.accepted) return;
    expect(titleLevel(purchased.state, offers[0]!.id)).toBe(1);
    expect(GameNumber.deserialize(purchased.state.currencies[ids.currency.gem]!).toNumber()).toBe(1_000 - TITLE_SHOP_PRICE);
    expect(dailyTitleOffers(purchased.state).map((definition) => definition.id)).toEqual(offers.map((definition) => definition.id));

    const duplicate = buyDailyTitle(purchased.state, offers[0]!.id);
    expect(duplicate.accepted).toBe(false);
    if (duplicate.accepted) return;
    expect(duplicate.reason).toBe('already-purchased');
  });

  it('refreshes title offers and purchase flags on the JST day boundary without touching ownership', () => {
    const startMs = Date.UTC(2026, 8, 12, 14, 59, 58); // 23:59:58 JST
    let state = createInitialState(startMs, 91);
    state = { ...state, currencies: { ...state.currencies, [ids.currency.gem]: GameNumber.from(300).serialize() } };
    const firstOffers = dailyTitleOffers(state);
    const bought = buyDailyTitle(state, firstOffers[0]!.id);
    expect(bought.accepted).toBe(true);
    if (!bought.accepted) return;

    const advanced = advanceFromWallClock(bought.state, startMs + 4_000).state;
    expect(advanced.gameData.titleShop.purchasedTitleIds).toEqual([]);
    expect(titleLevel(advanced, firstOffers[0]!.id)).toBe(1);
    expect(dailyTitleOffers(advanced)).toHaveLength(3);
  });

  it('uses Kit ownership/equipment rules and applies an equipped opening title in real combat', () => {
    const initial = createInitialState(0, 1234);
    const opening = titleDefinitions.find((definition) => definition.effectFamily === 'openingDamage' && definition.cost === 4)!;
    let collection = initial.gameData.titles;
    for (let index = 0; index < 15; index += 1) collection = addProgressiveTitleCopy(collection, opening.id, titleRules).collection;
    const owned = { ...initial, gameData: { ...initial.gameData, titles: collection } };
    const equipped = equipOwnedTitle(owned, opening.id, 5);
    expect(equipped.accepted).toBe(true);
    if (!equipped.accepted) return;
    expect(titleEquipCost(equipped.state)).toBe(4);

    const baseBattle = fight(initial);
    const titleBattle = fight(equipped.state);
    expect(baseBattle.accepted).toBe(true);
    expect(titleBattle.accepted).toBe(true);
    if (!baseBattle.accepted || !titleBattle.accepted) return;
    expect(titleBattle.state.gameData.lastBattle?.enemyId).toBe(baseBattle.state.gameData.lastBattle?.enemyId);
    expect(titleBattle.state.gameData.lastBattle!.turns[0]!.playerDamage)
      .toBeGreaterThan(baseBattle.state.gameData.lastBattle!.turns[0]!.playerDamage);
  });

  it('clears all equipped titles on job change and allows a free reset before the first job change', () => {
    const initial = createInitialState(0, 92);
    const definition = titleDefinitions.find((candidate) => candidate.cost === 1)!;
    const acquired = addProgressiveTitleCopy(initial.gameData.titles, definition.id, titleRules);
    let state = { ...initial, gameData: { ...initial.gameData, titles: acquired.collection } };
    const equipped = equipOwnedTitle(state, definition.id, 1);
    expect(equipped.accepted).toBe(true);
    if (!equipped.accepted) return;
    const reset = resetEquippedTitles(equipped.state);
    expect(reset.accepted).toBe(true);
    if (!reset.accepted) return;
    expect(reset.state.gameData.titles.equipped).toEqual([]);

    const equippedAgain = equipOwnedTitle(reset.state, definition.id, 1);
    expect(equippedAgain.accepted).toBe(true);
    if (!equippedAgain.accepted) return;
    state = {
      ...equippedAgain.state,
      currencies: { ...equippedAgain.state.currencies, [ids.currency.gold]: GameNumber.from(100_000).serialize() },
      gameData: {
        ...equippedAgain.state.gameData,
        player: { ...equippedAgain.state.gameData.player, level: 30 },
      },
    };
    const changed = changeJob(state, 'job.warrior');
    expect(changed.accepted).toBe(true);
    if (!changed.accepted) return;
    expect(changed.state.gameData.titles.equipped).toEqual([]);
    expect(changed.state.gameData.titles.copies[definition.id]).toBe(1);
  });
});

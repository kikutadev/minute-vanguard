import { describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../plugin/engine';
import { MinuteVanguardOnlineClient } from '../web/public-player-online';

class MemoryStorage {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  setItem(key: string, value: string): void { this.data.set(key, value); }
  removeItem(key: string): void { this.data.delete(key); }
}

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
});

describe('MinuteVanguardOnlineClient', () => {
  it('claims an anonymous owner, publishes only the public projection, and enables publishing', async () => {
    const storage = new MemoryStorage();
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.endsWith('/players/claim')) return jsonResponse({ playerId: 'player-1', writeToken: 'x'.repeat(43), revision: 0 }, 201);
      return jsonResponse({ accepted: true, revision: 1, updatedAtMs: 1234 });
    });
    const fetcher = fetchMock as unknown as typeof fetch;
    const client = new MinuteVanguardOnlineClient({ apiBaseUrl: 'https://api.example.test', fetcher, storage, now: () => 1000 });

    await client.enablePublishing(createInitialState(0, 1));

    expect(client.isPublishingEnabled()).toBe(true);
    expect(requests).toHaveLength(2);
    expect(requests[0]?.init?.method).toBe('POST');
    expect(requests[1]?.init?.method).toBe('PUT');
    expect(new Headers(requests[1]?.init?.headers).get('authorization')).toBe(`Bearer ${'x'.repeat(43)}`);
    const body = JSON.parse(String(requests[1]?.init?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({ gameId: 'minute-vanguard', playerId: 'player-1', revision: 1, displayName: '勇者' });
    expect(body).not.toHaveProperty('currencies');
    expect(body).not.toHaveProperty('gameData');
  });

  it('recovers from a stale revision by adopting the server revision and retrying', async () => {
    const storage = new MemoryStorage();
    let publishCount = 0;
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/players/claim')) return jsonResponse({ playerId: 'player-2', writeToken: 'y'.repeat(43), revision: 0 }, 201);
      publishCount += 1;
      if (publishCount === 1) return jsonResponse({ error: 'stale-revision', currentRevision: 5 }, 409);
      return jsonResponse({ accepted: true, revision: 6, updatedAtMs: 2000 });
    });
    const fetcher = fetchMock as unknown as typeof fetch;
    const client = new MinuteVanguardOnlineClient({ apiBaseUrl: 'https://api.example.test', fetcher, storage, now: () => 2000 });

    await client.publish(createInitialState(0, 2));

    expect(publishCount).toBe(2);
    const identityRaw = [...storage.data.entries()].find(([key]) => key.includes('identity'))?.[1];
    expect(JSON.parse(identityRaw ?? '{}')).toMatchObject({ playerId: 'player-2', revision: 6 });
  });

  it('reads a ranked page and can unpublish the owned profile', async () => {
    const storage = new MemoryStorage();
    const player = {
      gameId: 'minute-vanguard', playerId: 'player-3', displayName: 'Courier', schemaVersion: 1, revision: 2, updatedAtMs: 3000,
      data: { level: 9, jobId: 'job.adventurer', totalJobChanges: 0, totalBattles: 10, victories: 8, discoveredEnemyCount: 5, ownedPetCount: 0, equippedWeaponName: null, equippedArmorName: null, equippedOrbRank: null },
    };
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/players/claim')) return jsonResponse({ playerId: 'player-3', writeToken: 'z'.repeat(43), revision: 0 }, 201);
      if (init?.method === 'PUT') return jsonResponse({ accepted: true, revision: 1, updatedAtMs: 3000 });
      if (init?.method === 'DELETE') return new Response(null, { status: 204 });
      return jsonResponse({ metric: 'level', players: [player] });
    });
    const fetcher = fetchMock as unknown as typeof fetch;
    const client = new MinuteVanguardOnlineClient({ apiBaseUrl: 'https://api.example.test', fetcher, storage });
    await client.enablePublishing(createInitialState(0, 3));

    const ranked = await client.listLeaderboard('level');
    expect(ranked[0]?.playerId).toBe('player-3');
    await client.disablePublishing();
    expect(client.isPublishingEnabled()).toBe(false);
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
  });

  it('joins Arena with the anonymous owner and uses server-owned battle/ranking endpoints', async () => {
    const storage = new MemoryStorage();
    const arena = {
      playerId: 'arena-1', displayName: '勇者', jobId: 'job.adventurer', rating: 1000, bestRating: 1000,
      seasonKey: '2026-09-07', seasonScore: 0, seasonAttackScore: 0, seasonDefenseScore: 0,
      wins: 0, losses: 0, draws: 0, nextAttackAtMs: 0, barrierUntilMs: 0, barrierEnabled: true,
      loadout: { weaponId: 'arena.weapon.vanguard-blade', armorId: 'arena.armor.guard-plate', orbId: 'arena.orb.balance' },
      pets: { primary: 'none', secondary: 'none' },
      rank: 1, tierId: 'iron', tierName: 'アイアン', nextTierName: 'ブロンズ', nextTierScore: 300,
    };
    const requests: Array<{ url: string; method: string }> = [];
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      requests.push({ url, method });
      if (url.endsWith('/players/claim')) return jsonResponse({ playerId: 'arena-1', writeToken: 'a'.repeat(43), revision: 0 }, 201);
      if (url.endsWith('/arena/battles/random') || url.endsWith('/arena/battles/challenge')) return jsonResponse({
        arena: { ...arena, rating: 1016, seasonScore: 20, wins: 1, nextAttackAtMs: 60_000 },
        battle: {
          battleId: 'battle-1', matchType: url.endsWith('/arena/battles/challenge') ? 'challenge' : 'random', combatVersion: 3, resolvedAtMs: 1_000, seed: 4, outcome: 'win', firstSide: 'attacker',
          attackerMaxHp: 118, defenderMaxHp: 118, attackerHpAfter: 50, defenderHpAfter: 0, turns: [],
          opponent: { playerId: 'opponent-1', displayName: 'Rival', jobId: 'job.mage', ratingBefore: 1000, isBot: false, loadout: { weaponId: 'arena.weapon.vanguard-blade', armorId: 'arena.armor.guard-plate', orbId: 'arena.orb.balance' }, pets: { primary: 'magic', secondary: 'none' } },
          ratingBefore: 1000, ratingAfter: 1016, ratingDelta: 16, seasonScoreGain: 20, seasonScoreAfter: 20,
          weekendMultiplier: 2, nextAttackAtMs: 60_000,
        },
      });
      if (url.endsWith('/arena/loadout')) return jsonResponse({ arena: { ...arena, loadout: JSON.parse(String(init?.body)) } });
      if (url.endsWith('/arena/barrier')) return jsonResponse({ arena: { ...arena, barrierEnabled: false } });
      if (url.endsWith('/arena/pets')) return jsonResponse({ arena: { ...arena, pets: { primary: 'physical', secondary: 'none' } } });
      if (url.includes('/arena/leaderboard')) return jsonResponse({ entries: [{ rank: 1, playerId: 'arena-1', displayName: '勇者', jobId: 'job.adventurer', rating: 1016, bestRating: 1016, seasonScore: 20, wins: 1, losses: 0, draws: 0, isChampion: true }] });
      if (url.endsWith('/arena/hall')) return jsonResponse({ entries: [{ seasonKey: '2026-08-31', finalizedAtMs: 10, participantCount: 2, playerId: 'arena-1', displayName: '勇者', jobId: 'job.adventurer', rating: 1100, seasonScore: 400 }] });
      if (url.endsWith('/arena/rewards') && method === 'GET') return jsonResponse({ rewards: [{ receiptId: 'receipt-1', seasonKey: '2026-08-31', rank: 1, tierId: 'bronze', gold: 201000, gems: 125, baseGold: 1000, baseGems: 5, championBonusGold: 200000, championBonusGems: 120, grantsMasterToken: false, champion: true }] });
      if (url.endsWith('/arena/rewards/ack') && method === 'POST') return jsonResponse({ receiptId: 'receipt-1', acknowledged: true });
      if (url.endsWith('/arena/history')) return jsonResponse({ entries: [{ battleId: 'battle-1', matchType: 'random', resolvedAtMs: 1_000, role: 'attack', opponentName: 'Rival', opponentJobId: 'job.mage', outcome: 'win', ratingDelta: 16, scoreGain: 20 }] });
      if (method === 'DELETE' && url.endsWith('/arena')) return new Response(null, { status: 204 });
      if (method === 'POST' && url.endsWith('/arena')) return jsonResponse({ arena }, 201);
      return jsonResponse({ arena });
    });
    const fetcher = fetchMock as unknown as typeof fetch;
    const client = new MinuteVanguardOnlineClient({ apiBaseUrl: 'https://api.example.test', fetcher, storage });

    const joined = await client.joinArena(createInitialState(0, 9));
    expect(joined.rating).toBe(1000);
    const battle = await client.randomArenaBattle();
    expect(battle.battle.ratingDelta).toBe(16);
    expect(battle.arena.seasonScore).toBe(20);
    expect((await client.listArenaLeaderboard())[0]?.isChampion).toBe(true);
    expect((await client.listArenaHall())[0]?.displayName).toBe('勇者');
    expect((await client.listArenaSeasonRewards())[0]?.champion).toBe(true);
    await client.acknowledgeArenaSeasonReward('receipt-1');
    expect((await client.challengeArenaPlayer('opponent-1')).battle.matchType).toBe('challenge');
    expect((await client.listArenaHistory())[0]?.role).toBe('attack');
    expect((await client.setArenaPets({ primary: 'physical', secondary: 'none' })).pets.primary).toBe('physical');
    expect((await client.setArenaBarrier(false)).barrierEnabled).toBe(false);
    const loadout = { weaponId: 'arena.weapon.arc-focus', armorId: 'arena.armor.ward-robe', orbId: 'arena.orb.shelter' } as const;
    expect((await client.setArenaLoadout(loadout)).loadout).toEqual(loadout);
    await client.leaveArena();

    expect(requests.some((request) => request.url.endsWith('/players/claim') && request.method === 'POST')).toBe(true);
    expect(requests.some((request) => request.url.endsWith('/arena/battles/random') && request.method === 'POST')).toBe(true);
    expect(requests.some((request) => request.url.endsWith('/arena/battles/challenge') && request.method === 'POST')).toBe(true);
    expect(requests.some((request) => request.url.endsWith('/arena/pets') && request.method === 'PUT')).toBe(true);
    expect(requests.some((request) => request.url.endsWith('/arena/loadout') && request.method === 'PUT')).toBe(true);
    expect(requests.some((request) => request.url.endsWith('/arena') && request.method === 'DELETE')).toBe(true);
  });

});

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
});

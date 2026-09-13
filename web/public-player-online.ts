import type { PublicPlayerSnapshot } from 'idle-game-kit';
import type { ArenaBattleResult, ArenaHistoryEntry, ArenaLeaderboardEntry, ArenaPlayerView } from '../application/arena-contract';
import { isArenaLoadout, isArenaPetLoadout, type ArenaLoadout, type ArenaPetLoadout } from '../application/arena-domain';
import type { MinuteVanguardState } from '../definitions/types';
import {
  createMinuteVanguardPublicSnapshot,
  MINUTE_VANGUARD_GAME_ID,
  type MinuteVanguardPublicData,
} from '../application/public-player-profile';

const IDENTITY_KEY = 'minute-vanguard.public-profile.identity.v1';
const ENABLED_KEY = 'minute-vanguard.public-profile.enabled.v1';
const PROD_API_BASE_URL = 'https://minute-vanguard-online.kikutadev.workers.dev';

export type PublicLeaderboardMetric = 'level' | 'victories' | 'codex';

type PublicIdentity = Readonly<{
  playerId: string;
  writeToken: string;
  revision: number;
}>;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type OnlineClientOptions = Readonly<{
  apiBaseUrl: string;
  fetcher?: typeof fetch;
  storage?: StorageLike;
  now?: () => number;
}>;

export class PublicProfileOnlineError extends Error {
  readonly status: number;
  readonly code: string;
  readonly payload: unknown;

  constructor(status: number, code: string, payload: unknown) {
    super(`Public profile request failed (${status} ${code}).`);
    this.name = 'PublicProfileOnlineError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export class MinuteVanguardOnlineClient {
  readonly #apiBaseUrl: string;
  readonly #fetcher: typeof fetch;
  readonly #storage: StorageLike;
  readonly #now: () => number;

  constructor(options: OnlineClientOptions) {
    this.#apiBaseUrl = options.apiBaseUrl.replace(/\/$/u, '');
    this.#fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
    this.#storage = options.storage ?? window.localStorage;
    this.#now = options.now ?? Date.now;
  }

  isPublishingEnabled(): boolean {
    return this.#storage.getItem(ENABLED_KEY) === '1';
  }

  async enablePublishing(state: MinuteVanguardState): Promise<void> {
    await this.publish(state);
    this.#storage.setItem(ENABLED_KEY, '1');
  }

  async disablePublishing(): Promise<void> {
    const identity = this.#readIdentity();
    this.#storage.removeItem(ENABLED_KEY);
    if (identity === null) return;
    try {
      const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}`), {
        method: 'DELETE',
        headers: { authorization: `Bearer ${identity.writeToken}` },
      });
      if (!response.ok) throw await responseError(response);
    } catch (error) {
      this.#storage.setItem(ENABLED_KEY, '1');
      throw error;
    }
  }

  async publish(state: MinuteVanguardState): Promise<void> {
    let identity = await this.#ensureIdentity();
    let attempts = 0;
    while (attempts < 3) {
      attempts += 1;
      const nextRevision = identity.revision + 1;
      const snapshot = createMinuteVanguardPublicSnapshot({
        state,
        playerId: identity.playerId,
        revision: nextRevision,
        updatedAtMs: this.#now(),
      });
      const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}`), {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${identity.writeToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(snapshot),
      });
      const payload = await readJson(response);
      if (response.ok) {
        const revision = isRecord(payload) && Number.isSafeInteger(payload.revision) ? Number(payload.revision) : nextRevision;
        identity = { ...identity, revision };
        this.#writeIdentity(identity);
        return;
      }
      if (response.status === 409 && isRecord(payload) && payload.error === 'stale-revision' && Number.isSafeInteger(payload.currentRevision)) {
        identity = { ...identity, revision: Number(payload.currentRevision) };
        this.#writeIdentity(identity);
        continue;
      }
      if (response.status === 429 && isRecord(payload) && payload.error === 'publish-rate-limited' && Number.isFinite(payload.retryAfterMs) && attempts < 3) {
        await sleep(Math.min(6_000, Math.max(0, Number(payload.retryAfterMs)) + 25));
        continue;
      }
      throw responseErrorFromPayload(response.status, payload);
    }
    throw new PublicProfileOnlineError(409, 'publish-retry-exhausted', null);
  }

  async listLeaderboard(metric: PublicLeaderboardMetric, limit = 20): Promise<readonly PublicPlayerSnapshot<MinuteVanguardPublicData>[]> {
    const url = new URL(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/leaderboards/${metric}`));
    url.searchParams.set('limit', String(limit));
    const response = await this.#fetcher(url.toString(), { headers: { accept: 'application/json' } });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    if (!isRecord(payload) || !Array.isArray(payload.players)) throw new PublicProfileOnlineError(502, 'invalid-leaderboard-envelope', payload);
    return payload.players.map((value) => parseSnapshot(value));
  }


  async getArena(): Promise<ArenaPlayerView | null> {
    const identity = this.#readIdentity();
    if (identity === null) return null;
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena`), {
      headers: { authorization: `Bearer ${identity.writeToken}`, accept: 'application/json' },
    });
    const payload = await readJson(response);
    if (response.status === 404 && isRecord(payload) && payload.error === 'arena-not-joined') return null;
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    return parseArenaEnvelope(payload);
  }

  async joinArena(state: MinuteVanguardState): Promise<ArenaPlayerView> {
    const identity = await this.#ensureIdentity();
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena`), {
      method: 'POST',
      headers: { authorization: `Bearer ${identity.writeToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: state.gameData.player.name, jobId: state.gameData.player.jobId }),
    });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    return parseArenaEnvelope(payload);
  }

  async leaveArena(): Promise<void> {
    const identity = this.#readIdentity();
    if (identity === null) return;
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena`), {
      method: 'DELETE',
      headers: { authorization: `Bearer ${identity.writeToken}` },
    });
    if (!response.ok) throw await responseError(response);
  }

  async setArenaLoadout(loadout: ArenaLoadout): Promise<ArenaPlayerView> {
    const identity = this.#readIdentity();
    if (identity === null) throw new PublicProfileOnlineError(401, 'arena-identity-missing', null);
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena/loadout`), {
      method: 'PUT',
      headers: { authorization: `Bearer ${identity.writeToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(loadout),
    });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    return parseArenaEnvelope(payload);
  }

  async setArenaPets(pets: ArenaPetLoadout): Promise<ArenaPlayerView> {
    const identity = this.#readIdentity();
    if (identity === null) throw new PublicProfileOnlineError(401, 'arena-identity-missing', null);
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena/pets`), {
      method: 'PUT',
      headers: { authorization: `Bearer ${identity.writeToken}`, 'content-type': 'application/json' },
      body: JSON.stringify(pets),
    });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    return parseArenaEnvelope(payload);
  }

  async setArenaBarrier(enabled: boolean): Promise<ArenaPlayerView> {
    const identity = this.#readIdentity();
    if (identity === null) throw new PublicProfileOnlineError(401, 'arena-identity-missing', null);
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena/barrier`), {
      method: 'PUT',
      headers: { authorization: `Bearer ${identity.writeToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    return parseArenaEnvelope(payload);
  }

  async randomArenaBattle(): Promise<Readonly<{ arena: ArenaPlayerView; battle: ArenaBattleResult }>> {
    const identity = this.#readIdentity();
    if (identity === null) throw new PublicProfileOnlineError(401, 'arena-identity-missing', null);
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena/battles/random`), {
      method: 'POST',
      headers: { authorization: `Bearer ${identity.writeToken}`, accept: 'application/json' },
    });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    if (!isRecord(payload) || !('arena' in payload) || !('battle' in payload)) throw new PublicProfileOnlineError(502, 'invalid-arena-battle-envelope', payload);
    return { arena: parseArenaPlayer(payload.arena), battle: parseArenaBattle(payload.battle) };
  }

  async challengeArenaPlayer(defenderId: string): Promise<Readonly<{ arena: ArenaPlayerView; battle: ArenaBattleResult }>> {
    const identity = this.#readIdentity();
    if (identity === null) throw new PublicProfileOnlineError(401, 'arena-identity-missing', null);
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena/battles/challenge`), {
      method: 'POST',
      headers: { authorization: `Bearer ${identity.writeToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ defenderId }),
    });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    if (!isRecord(payload) || !('arena' in payload) || !('battle' in payload)) throw new PublicProfileOnlineError(502, 'invalid-arena-battle-envelope', payload);
    return { arena: parseArenaPlayer(payload.arena), battle: parseArenaBattle(payload.battle) };
  }

  async listArenaLeaderboard(limit = 10): Promise<readonly ArenaLeaderboardEntry[]> {
    const url = new URL(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/arena/leaderboard`));
    url.searchParams.set('limit', String(limit));
    const response = await this.#fetcher(url.toString(), { headers: { accept: 'application/json' } });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    if (!isRecord(payload) || !Array.isArray(payload.entries)) throw new PublicProfileOnlineError(502, 'invalid-arena-leaderboard-envelope', payload);
    return payload.entries.map(parseArenaLeaderboardEntry);
  }

  async listArenaHistory(): Promise<readonly ArenaHistoryEntry[]> {
    const identity = this.#readIdentity();
    if (identity === null) return [];
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/${encodeURIComponent(identity.playerId)}/arena/history`), {
      headers: { authorization: `Bearer ${identity.writeToken}`, accept: 'application/json' },
    });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    if (!isRecord(payload) || !Array.isArray(payload.entries)) throw new PublicProfileOnlineError(502, 'invalid-arena-history-envelope', payload);
    return payload.entries.map(parseArenaHistoryEntry);
  }

  #url(path: string): string {
    return `${this.#apiBaseUrl}${path}`;
  }

  async #ensureIdentity(): Promise<PublicIdentity> {
    const stored = this.#readIdentity();
    if (stored !== null) return stored;
    const response = await this.#fetcher(this.#url(`/v1/games/${MINUTE_VANGUARD_GAME_ID}/players/claim`), {
      method: 'POST',
      headers: { accept: 'application/json' },
    });
    const payload = await readJson(response);
    if (!response.ok) throw responseErrorFromPayload(response.status, payload);
    if (!isRecord(payload) || typeof payload.playerId !== 'string' || typeof payload.writeToken !== 'string' || !Number.isSafeInteger(payload.revision)) {
      throw new PublicProfileOnlineError(502, 'invalid-claim-envelope', payload);
    }
    const identity = { playerId: payload.playerId, writeToken: payload.writeToken, revision: Number(payload.revision) };
    this.#writeIdentity(identity);
    return identity;
  }

  #readIdentity(): PublicIdentity | null {
    const raw = this.#storage.getItem(IDENTITY_KEY);
    if (raw === null) return null;
    try {
      const value: unknown = JSON.parse(raw);
      if (!isRecord(value) || typeof value.playerId !== 'string' || typeof value.writeToken !== 'string' || !Number.isSafeInteger(value.revision)) return null;
      return { playerId: value.playerId, writeToken: value.writeToken, revision: Number(value.revision) };
    } catch {
      return null;
    }
  }

  #writeIdentity(identity: PublicIdentity): void {
    this.#storage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  }
}

export const PUBLIC_PLAYER_API_BASE_URL = (() => {
  const configured = import.meta.env.VITE_PUBLIC_PLAYER_API_BASE_URL?.trim();
  if (configured) return configured;
  return import.meta.env.DEV ? '/api' : PROD_API_BASE_URL;
})();

let browserOnlineClient: MinuteVanguardOnlineClient | null = null;

export function getMinuteVanguardOnlineClient(): MinuteVanguardOnlineClient {
  if (typeof window === 'undefined') throw new Error('Minute Vanguard online client is browser-only.');
  if (browserOnlineClient === null) {
    browserOnlineClient = new MinuteVanguardOnlineClient({
      apiBaseUrl: PUBLIC_PLAYER_API_BASE_URL,
      storage: window.localStorage,
    });
  }
  return browserOnlineClient;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try { return JSON.parse(text) as unknown; } catch { return { error: 'invalid-json-response', body: text.slice(0, 200) }; }
}

async function responseError(response: Response): Promise<PublicProfileOnlineError> {
  return responseErrorFromPayload(response.status, await readJson(response));
}

function responseErrorFromPayload(status: number, payload: unknown): PublicProfileOnlineError {
  const code = isRecord(payload) && typeof payload.error === 'string' ? payload.error : 'request-failed';
  return new PublicProfileOnlineError(status, code, payload);
}

function parseSnapshot(value: unknown): PublicPlayerSnapshot<MinuteVanguardPublicData> {
  if (!isRecord(value) || typeof value.gameId !== 'string' || typeof value.playerId !== 'string' || typeof value.displayName !== 'string' || !Number.isSafeInteger(value.schemaVersion) || !Number.isSafeInteger(value.revision) || typeof value.updatedAtMs !== 'number' || !isRecord(value.data)) {
    throw new PublicProfileOnlineError(502, 'invalid-player-snapshot', value);
  }
  return value as unknown as PublicPlayerSnapshot<MinuteVanguardPublicData>;
}


function parseArenaEnvelope(payload: unknown): ArenaPlayerView {
  if (!isRecord(payload) || !('arena' in payload)) throw new PublicProfileOnlineError(502, 'invalid-arena-envelope', payload);
  return parseArenaPlayer(payload.arena);
}

function parseArenaPlayer(value: unknown): ArenaPlayerView {
  if (!isRecord(value) || typeof value.playerId !== 'string' || typeof value.displayName !== 'string' || typeof value.jobId !== 'string'
    || !Number.isFinite(value.rating) || !Number.isFinite(value.bestRating) || typeof value.seasonKey !== 'string'
    || !Number.isFinite(value.seasonScore) || !Number.isFinite(value.nextAttackAtMs) || typeof value.barrierEnabled !== 'boolean' || !isArenaLoadout(value.loadout) || !isArenaPetLoadout(value.pets)) {
    throw new PublicProfileOnlineError(502, 'invalid-arena-player', value);
  }
  return value as unknown as ArenaPlayerView;
}

function parseArenaBattle(value: unknown): ArenaBattleResult {
  if (!isRecord(value) || typeof value.battleId !== 'string' || (value.matchType !== 'random' && value.matchType !== 'challenge') || !Number.isFinite(value.resolvedAtMs) || typeof value.outcome !== 'string'
    || !Array.isArray(value.turns) || !isRecord(value.opponent) || !isArenaLoadout(value.opponent.loadout) || !isArenaPetLoadout(value.opponent.pets) || !Number.isFinite(value.ratingAfter) || !Number.isFinite(value.seasonScoreAfter)) {
    throw new PublicProfileOnlineError(502, 'invalid-arena-battle', value);
  }
  return value as unknown as ArenaBattleResult;
}

function parseArenaLeaderboardEntry(value: unknown): ArenaLeaderboardEntry {
  if (!isRecord(value) || !Number.isFinite(value.rank) || typeof value.playerId !== 'string' || typeof value.displayName !== 'string'
    || typeof value.jobId !== 'string' || !Number.isFinite(value.rating) || !Number.isFinite(value.seasonScore) || typeof value.isChampion !== 'boolean') {
    throw new PublicProfileOnlineError(502, 'invalid-arena-leaderboard-entry', value);
  }
  return value as unknown as ArenaLeaderboardEntry;
}

function parseArenaHistoryEntry(value: unknown): ArenaHistoryEntry {
  if (!isRecord(value) || typeof value.battleId !== 'string' || (value.matchType !== 'random' && value.matchType !== 'challenge') || !Number.isFinite(value.resolvedAtMs) || typeof value.role !== 'string'
    || typeof value.opponentName !== 'string' || typeof value.opponentJobId !== 'string' || typeof value.outcome !== 'string') {
    throw new PublicProfileOnlineError(502, 'invalid-arena-history-entry', value);
  }
  return value as unknown as ArenaHistoryEntry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

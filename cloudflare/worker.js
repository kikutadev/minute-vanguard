import { D1PublicPlayerDirectory, createPublicPlayerDirectoryHandler } from '../vendor/idle-game-kit/cloudflare.js';

const GAME_ID = 'minute-vanguard';
const PUBLIC_SCHEMA_VERSION = 1;
const PUBLISH_COOLDOWN_MS = 5_000;
const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1_000;
const CLAIMS_PER_WINDOW = 20;
const MAX_LEADERBOARD_LIMIT = 100;
const JOB_IDS = new Set([
  'job.adventurer', 'job.warrior', 'job.mage', 'job.thief', 'job.priest',
  'job.ninja', 'job.gambler', 'job.wraith', 'job.tamer', 'job.hexer',
]);
const ORB_RANKS = new Set(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']);
const LEADERBOARD_COLUMNS = Object.freeze({
  level: '$.level',
  victories: '$.victories',
  codex: '$.discoveredEnemyCount',
});

function isAllowedOrigin(origin) {
  if (origin === null) return true;
  if (origin === 'https://kikutadev.github.io') return true;
  try {
    const url = new URL(origin);
    return (url.hostname === 'localhost' || url.hostname === '127.0.0.1') && (url.protocol === 'http:' || url.protocol === 'https:');
  } catch {
    return false;
  }
}

function withCors(request, response) {
  const headers = new Headers(response.headers);
  const origin = request.headers.get('origin');
  if (origin && isAllowedOrigin(origin)) headers.set('access-control-allow-origin', origin);
  headers.set('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('access-control-allow-headers', 'authorization, content-type');
  headers.set('access-control-max-age', '86400');
  headers.set('vary', 'Origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(request, payload, init = {}) {
  return withCors(request, Response.json(payload, init));
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

function createWriteToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

function normalizeLimit(value, fallback = 20) {
  if (value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(1, Math.min(MAX_LEADERBOARD_LIMIT, parsed));
}

function publicPlayerRoute(pathname) {
  const claim = pathname.match(/^\/v1\/games\/([^/]+)\/players\/claim$/u);
  if (claim) return { kind: 'claim', gameId: decodeURIComponent(claim[1]) };
  const player = pathname.match(/^\/v1\/games\/([^/]+)\/players\/([^/]+)$/u);
  if (player) return { kind: 'player', gameId: decodeURIComponent(player[1]), playerId: decodeURIComponent(player[2]) };
  const board = pathname.match(/^\/v1\/games\/([^/]+)\/leaderboards\/([^/]+)$/u);
  if (board) return { kind: 'leaderboard', gameId: decodeURIComponent(board[1]), metric: decodeURIComponent(board[2]) };
  return null;
}

function validatePublicSnapshot(value, gameId, playerId) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return 'snapshot-must-be-object';
  if (value.gameId !== gameId || value.playerId !== playerId) return 'identity-mismatch';
  if (value.schemaVersion !== PUBLIC_SCHEMA_VERSION) return 'unsupported-schema-version';
  if (!Number.isSafeInteger(value.revision) || value.revision < 1) return 'invalid-revision';
  if (typeof value.displayName !== 'string') return 'invalid-display-name';
  const displayName = value.displayName.trim();
  if (Array.from(displayName).length < 1 || Array.from(displayName).length > 20) return 'invalid-display-name';
  const data = value.data;
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return 'invalid-public-data';
  const integerFields = [
    ['level', 1, 1_000_000_000],
    ['totalJobChanges', 0, 1_000_000],
    ['totalBattles', 0, Number.MAX_SAFE_INTEGER],
    ['victories', 0, Number.MAX_SAFE_INTEGER],
    ['discoveredEnemyCount', 0, 650],
    ['ownedPetCount', 0, 1_000],
  ];
  for (const [key, min, max] of integerFields) {
    const field = data[key];
    if (!Number.isSafeInteger(field) || field < min || field > max) return `invalid-${key}`;
  }
  if (data.victories > data.totalBattles) return 'victories-exceed-battles';
  if (typeof data.jobId !== 'string' || !JOB_IDS.has(data.jobId)) return 'invalid-job';
  for (const key of ['equippedWeaponName', 'equippedArmorName']) {
    const field = data[key];
    if (field !== null && (typeof field !== 'string' || Array.from(field).length > 80)) return `invalid-${key}`;
  }
  if (data.equippedOrbRank !== null && (typeof data.equippedOrbRank !== 'string' || !ORB_RANKS.has(data.equippedOrbRank))) return 'invalid-orb-rank';
  return null;
}

async function claimRateAllowed(request, db, nowMs) {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ipHash = await sha256Base64Url(ip);
  const row = await db.prepare(`
    SELECT window_start_ms, claim_count
    FROM public_player_claim_limits
    WHERE ip_hash = ?
  `).bind(ipHash).first();
  const reset = row === null || nowMs - Number(row.window_start_ms) >= CLAIM_WINDOW_MS;
  const count = reset ? 0 : Number(row.claim_count);
  if (count >= CLAIMS_PER_WINDOW) return false;
  await db.prepare(`
    INSERT INTO public_player_claim_limits (ip_hash, window_start_ms, claim_count)
    VALUES (?, ?, 1)
    ON CONFLICT(ip_hash) DO UPDATE SET
      window_start_ms = excluded.window_start_ms,
      claim_count = CASE
        WHEN ? - public_player_claim_limits.window_start_ms >= ? THEN 1
        ELSE public_player_claim_limits.claim_count + 1
      END
  `).bind(ipHash, reset ? nowMs : Number(row?.window_start_ms ?? nowMs), nowMs, CLAIM_WINDOW_MS).run();
  return true;
}

async function authenticateOwner(request, db, gameId, playerId) {
  const authorization = request.headers.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return { ok: false, status: 401, error: 'missing-write-token' };
  const token = authorization.slice('Bearer '.length).trim();
  if (token.length < 32) return { ok: false, status: 401, error: 'invalid-write-token' };
  const tokenHash = await sha256Base64Url(token);
  const owner = await db.prepare(`
    SELECT token_hash, last_publish_at_ms
    FROM public_player_owners
    WHERE game_id = ? AND player_id = ?
  `).bind(gameId, playerId).first();
  if (owner === null || owner.token_hash !== tokenHash) return { ok: false, status: 403, error: 'owner-mismatch' };
  return { ok: true, owner };
}

function rowToSnapshot(row) {
  return {
    gameId: row.game_id,
    playerId: row.player_id,
    displayName: row.display_name,
    schemaVersion: Number(row.schema_version),
    revision: Number(row.revision),
    updatedAtMs: Number(row.updated_at_ms),
    data: JSON.parse(row.payload_json),
  };
}

async function handleClaim(request, env, gameId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const nowMs = Date.now();
  if (!await claimRateAllowed(request, env.PUBLIC_PLAYER_DB, nowMs)) {
    return json(request, { error: 'claim-rate-limited' }, { status: 429 });
  }
  const playerId = crypto.randomUUID();
  const writeToken = createWriteToken();
  const tokenHash = await sha256Base64Url(writeToken);
  await env.PUBLIC_PLAYER_DB.prepare(`
    INSERT INTO public_player_owners (game_id, player_id, token_hash, created_at_ms, last_publish_at_ms)
    VALUES (?, ?, ?, ?, 0)
  `).bind(gameId, playerId, tokenHash, nowMs).run();
  return json(request, { playerId, writeToken, revision: 0 }, { status: 201 });
}

async function handlePublish(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  const nowMs = Date.now();
  const lastPublishAtMs = Number(auth.owner.last_publish_at_ms ?? 0);
  if (lastPublishAtMs > 0 && nowMs - lastPublishAtMs < PUBLISH_COOLDOWN_MS) {
    return json(request, { error: 'publish-rate-limited', retryAfterMs: PUBLISH_COOLDOWN_MS - (nowMs - lastPublishAtMs) }, { status: 429 });
  }
  const rawBody = await request.text();
  if (rawBody.length > 8_192) return json(request, { error: 'payload-too-large' }, { status: 413 });
  let body;
  try { body = JSON.parse(rawBody); } catch { return json(request, { error: 'invalid-json' }, { status: 400 }); }
  const validationError = validatePublicSnapshot(body, gameId, playerId);
  if (validationError !== null) return json(request, { error: validationError }, { status: 400 });
  const current = await env.PUBLIC_PLAYER_DB.prepare(`
    SELECT revision FROM public_player_snapshots WHERE game_id = ? AND player_id = ?
  `).bind(gameId, playerId).first();
  const currentRevision = current === null ? 0 : Number(current.revision);
  if (body.revision <= currentRevision) {
    return json(request, { error: 'stale-revision', currentRevision }, { status: 409 });
  }
  const directory = new D1PublicPlayerDirectory(env.PUBLIC_PLAYER_DB);
  const snapshot = { ...body, displayName: body.displayName.trim(), updatedAtMs: nowMs };
  await directory.publishPublicPlayer(snapshot);
  await env.PUBLIC_PLAYER_DB.prepare(`
    UPDATE public_player_owners SET last_publish_at_ms = ? WHERE game_id = ? AND player_id = ?
  `).bind(nowMs, gameId, playerId).run();
  return json(request, { accepted: true, revision: snapshot.revision, updatedAtMs: nowMs });
}

async function handleUnpublish(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  await env.PUBLIC_PLAYER_DB.prepare(`
    DELETE FROM public_player_snapshots WHERE game_id = ? AND player_id = ?
  `).bind(gameId, playerId).run();
  return withCors(request, new Response(null, { status: 204 }));
}

async function handleLeaderboard(request, env, gameId, metric) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const jsonPath = LEADERBOARD_COLUMNS[metric];
  if (jsonPath === undefined) return json(request, { error: 'unknown-leaderboard' }, { status: 404 });
  const url = new URL(request.url);
  const limit = normalizeLimit(url.searchParams.get('limit'));
  const rows = await env.PUBLIC_PLAYER_DB.prepare(`
    SELECT game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json,
      CAST(json_extract(payload_json, ?) AS INTEGER) AS score
    FROM public_player_snapshots
    WHERE game_id = ?
    ORDER BY score DESC, updated_at_ms ASC, player_id ASC
    LIMIT ?
  `).bind(jsonPath, gameId, limit).all();
  const players = (rows.results ?? []).map(rowToSnapshot);
  return json(request, { metric, players });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin');
    if (origin !== null && !isAllowedOrigin(origin)) return new Response('Forbidden origin', { status: 403 });
    if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }));

    const url = new URL(request.url);
    const route = publicPlayerRoute(url.pathname);
    try {
      if (route?.kind === 'claim' && request.method === 'POST') return await handleClaim(request, env, route.gameId);
      if (route?.kind === 'player' && request.method === 'PUT') return await handlePublish(request, env, route.gameId, route.playerId);
      if (route?.kind === 'player' && request.method === 'DELETE') return await handleUnpublish(request, env, route.gameId, route.playerId);
      if (route?.kind === 'leaderboard' && request.method === 'GET') return await handleLeaderboard(request, env, route.gameId, route.metric);

      const directory = new D1PublicPlayerDirectory(env.PUBLIC_PLAYER_DB);
      const handleDirectory = createPublicPlayerDirectoryHandler(directory, { cacheControl: 'no-store' });
      const response = await handleDirectory(request);
      if (response !== null) return withCors(request, response);
      return json(request, { error: 'not-found' }, { status: 404 });
    } catch (error) {
      console.error(error);
      return json(request, { error: 'internal-error' }, { status: 500 });
    }
  },
};

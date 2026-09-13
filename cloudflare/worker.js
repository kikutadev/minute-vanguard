import { D1PublicPlayerDirectory, createPublicPlayerDirectoryHandler } from '../vendor/idle-game-kit/cloudflare.js';
import {
  ARENA_COOLDOWN_MS, ARENA_DAILY_WIN_LIMIT, ARENA_DEFENSE_BARRIER_MS, ARENA_START_RATING, ARENA_DEFAULT_LOADOUT,
  arenaAttackSeasonScore, arenaDefenseSeasonScore, arenaJstDayKey, arenaNextTierForScore,
  arenaRatingDeltas, arenaSeasonKey, arenaSeasonResetRating, arenaTierForScore, arenaWeekendMultiplier,
  isArenaLoadout, simulateArenaBattle,
} from '../application/arena-domain.ts';

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
const ARENA_BOTS = Object.freeze([
  { playerId: 'bot:rookie', displayName: '訓練兵ルカ', jobId: 'job.adventurer', rating: 900 },
  { playerId: 'bot:shield', displayName: '盾役ミナ', jobId: 'job.warrior', rating: 1000 },
  { playerId: 'bot:spark', displayName: '術士セラ', jobId: 'job.mage', rating: 1100 },
  { playerId: 'bot:shade', displayName: '影走りノア', jobId: 'job.ninja', rating: 1250 },
  { playerId: 'bot:omen', displayName: '呪印のエル', jobId: 'job.hexer', rating: 1450 },
]);

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

function arenaRoute(pathname) {
  const board = pathname.match(/^\/v1\/games\/([^/]+)\/arena\/leaderboard$/u);
  if (board) return { kind: 'arena-leaderboard', gameId: decodeURIComponent(board[1]) };
  const history = pathname.match(/^\/v1\/games\/([^/]+)\/players\/([^/]+)\/arena\/history$/u);
  if (history) return { kind: 'arena-history', gameId: decodeURIComponent(history[1]), playerId: decodeURIComponent(history[2]) };
  const randomBattle = pathname.match(/^\/v1\/games\/([^/]+)\/players\/([^/]+)\/arena\/battles\/random$/u);
  if (randomBattle) return { kind: 'arena-random-battle', gameId: decodeURIComponent(randomBattle[1]), playerId: decodeURIComponent(randomBattle[2]) };
  const barrier = pathname.match(/^\/v1\/games\/([^/]+)\/players\/([^/]+)\/arena\/barrier$/u);
  if (barrier) return { kind: 'arena-barrier', gameId: decodeURIComponent(barrier[1]), playerId: decodeURIComponent(barrier[2]) };
  const loadout = pathname.match(/^\/v1\/games\/([^/]+)\/players\/([^/]+)\/arena\/loadout$/u);
  if (loadout) return { kind: 'arena-loadout', gameId: decodeURIComponent(loadout[1]), playerId: decodeURIComponent(loadout[2]) };
  const arena = pathname.match(/^\/v1\/games\/([^/]+)\/players\/([^/]+)\/arena$/u);
  if (arena) return { kind: 'arena-player', gameId: decodeURIComponent(arena[1]), playerId: decodeURIComponent(arena[2]) };
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


function validArenaName(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return Array.from(name).length >= 1 && Array.from(name).length <= 20 ? name : null;
}

function randomUint32() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] ?? 1;
}

async function readSmallJson(request, maxLength = 2_048) {
  const raw = await request.text();
  if (raw.length > maxLength) return { error: 'payload-too-large' };
  try { return { value: JSON.parse(raw) }; } catch { return { error: 'invalid-json' }; }
}

async function getArenaRow(db, gameId, playerId) {
  return db.prepare(`
    SELECT game_id, player_id, display_name, job_id, rating, best_rating, season_key,
      season_score, season_attack_score, season_defense_score, wins, losses, draws,
      next_attack_at_ms, barrier_until_ms, barrier_enabled, arena_weapon_id, arena_armor_id, arena_orb_id, created_at_ms, updated_at_ms
    FROM arena_players WHERE game_id = ? AND player_id = ?
  `).bind(gameId, playerId).first();
}

async function normalizeArenaSeason(db, row, nowMs) {
  const currentSeason = arenaSeasonKey(nowMs);
  if (row.season_key === currentSeason) return row;
  const nextRating = arenaSeasonResetRating(Number(row.rating));
  await db.prepare(`
    UPDATE arena_players SET rating = ?, best_rating = MAX(best_rating, ?), season_key = ?,
      season_score = 0, season_attack_score = 0, season_defense_score = 0,
      next_attack_at_ms = 0, barrier_until_ms = 0, updated_at_ms = ?
    WHERE game_id = ? AND player_id = ?
  `).bind(nextRating, nextRating, currentSeason, nowMs, row.game_id, row.player_id).run();
  return { ...row, rating: nextRating, season_key: currentSeason, season_score: 0, season_attack_score: 0, season_defense_score: 0, next_attack_at_ms: 0, barrier_until_ms: 0, updated_at_ms: nowMs };
}

async function arenaRank(db, row) {
  const result = await db.prepare(`
    SELECT COUNT(*) + 1 AS rank FROM arena_players
    WHERE game_id = ? AND season_key = ? AND (
      season_score > ? OR
      (season_score = ? AND rating > ?) OR
      (season_score = ? AND rating = ? AND player_id < ?)
    )
  `).bind(row.game_id, row.season_key, row.season_score, row.season_score, row.rating, row.season_score, row.rating, row.player_id).first();
  return Number(result?.rank ?? 1);
}

function arenaView(row, rank) {
  const tier = arenaTierForScore(Number(row.season_score));
  const nextTier = arenaNextTierForScore(Number(row.season_score));
  return {
    playerId: row.player_id,
    displayName: row.display_name,
    jobId: row.job_id,
    rating: Number(row.rating),
    bestRating: Number(row.best_rating),
    seasonKey: row.season_key,
    seasonScore: Number(row.season_score),
    seasonAttackScore: Number(row.season_attack_score),
    seasonDefenseScore: Number(row.season_defense_score),
    wins: Number(row.wins), losses: Number(row.losses), draws: Number(row.draws),
    nextAttackAtMs: Number(row.next_attack_at_ms),
    barrierUntilMs: Number(row.barrier_until_ms),
    barrierEnabled: Number(row.barrier_enabled) !== 0,
    loadout: { weaponId: row.arena_weapon_id, armorId: row.arena_armor_id, orbId: row.arena_orb_id },
    rank,
    tierId: tier.id, tierName: tier.displayName,
    nextTierName: nextTier?.displayName ?? null,
    nextTierScore: nextTier?.threshold ?? null,
  };
}

async function handleArenaRegister(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  const parsed = await readSmallJson(request);
  if (parsed.error) return json(request, { error: parsed.error }, { status: parsed.error === 'payload-too-large' ? 413 : 400 });
  const name = validArenaName(parsed.value?.displayName);
  const jobId = parsed.value?.jobId;
  if (name === null) return json(request, { error: 'invalid-display-name' }, { status: 400 });
  if (typeof jobId !== 'string' || !JOB_IDS.has(jobId)) return json(request, { error: 'invalid-job' }, { status: 400 });
  const nowMs = Date.now();
  const seasonKey = arenaSeasonKey(nowMs);
  const existing = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (existing === null) {
    await env.PUBLIC_PLAYER_DB.prepare(`
      INSERT INTO arena_players (
        game_id, player_id, display_name, job_id, rating, best_rating, season_key,
        season_score, season_attack_score, season_defense_score, wins, losses, draws,
        next_attack_at_ms, barrier_until_ms, barrier_enabled, arena_weapon_id, arena_armor_id, arena_orb_id, created_at_ms, updated_at_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 1, ?, ?, ?, ?, ?)
    `).bind(gameId, playerId, name, jobId, ARENA_START_RATING, ARENA_START_RATING, seasonKey, ARENA_DEFAULT_LOADOUT.weaponId, ARENA_DEFAULT_LOADOUT.armorId, ARENA_DEFAULT_LOADOUT.orbId, nowMs, nowMs).run();
  } else {
    const normalized = await normalizeArenaSeason(env.PUBLIC_PLAYER_DB, existing, nowMs);
    await env.PUBLIC_PLAYER_DB.prepare(`
      UPDATE arena_players SET display_name = ?, job_id = ?, updated_at_ms = ?
      WHERE game_id = ? AND player_id = ?
    `).bind(name, jobId, nowMs, gameId, playerId).run();
    Object.assign(normalized, { display_name: name, job_id: jobId, updated_at_ms: nowMs });
  }
  const row = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  const rank = await arenaRank(env.PUBLIC_PLAYER_DB, row);
  return json(request, { arena: arenaView(row, rank) }, { status: existing === null ? 201 : 200 });
}

async function handleArenaGet(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  const existing = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (existing === null) return json(request, { error: 'arena-not-joined' }, { status: 404 });
  const row = await normalizeArenaSeason(env.PUBLIC_PLAYER_DB, existing, Date.now());
  return json(request, { arena: arenaView(row, await arenaRank(env.PUBLIC_PLAYER_DB, row)) });
}

async function handleArenaDelete(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  await env.PUBLIC_PLAYER_DB.batch([
    env.PUBLIC_PLAYER_DB.prepare('DELETE FROM arena_daily_wins WHERE game_id = ? AND (attacker_id = ? OR defender_id = ?)').bind(gameId, playerId, playerId),
    env.PUBLIC_PLAYER_DB.prepare('DELETE FROM arena_battles WHERE game_id = ? AND (attacker_id = ? OR defender_id = ?)').bind(gameId, playerId, playerId),
    env.PUBLIC_PLAYER_DB.prepare('DELETE FROM arena_players WHERE game_id = ? AND player_id = ?').bind(gameId, playerId),
  ]);
  return withCors(request, new Response(null, { status: 204 }));
}

async function handleArenaBarrier(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  const parsed = await readSmallJson(request, 512);
  if (parsed.error) return json(request, { error: parsed.error }, { status: 400 });
  if (typeof parsed.value?.enabled !== 'boolean') return json(request, { error: 'invalid-enabled' }, { status: 400 });
  const nowMs = Date.now();
  const existing = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (existing === null) return json(request, { error: 'arena-not-joined' }, { status: 404 });
  await normalizeArenaSeason(env.PUBLIC_PLAYER_DB, existing, nowMs);
  await env.PUBLIC_PLAYER_DB.prepare(`
    UPDATE arena_players SET barrier_enabled = ?, barrier_until_ms = CASE WHEN ? = 0 THEN 0 ELSE barrier_until_ms END, updated_at_ms = ?
    WHERE game_id = ? AND player_id = ?
  `).bind(parsed.value.enabled ? 1 : 0, parsed.value.enabled ? 1 : 0, nowMs, gameId, playerId).run();
  const updated = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  return json(request, { arena: arenaView(updated, await arenaRank(env.PUBLIC_PLAYER_DB, updated)) });
}

async function handleArenaLoadout(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  const parsed = await readSmallJson(request, 1_024);
  if (parsed.error) return json(request, { error: parsed.error }, { status: parsed.error === 'payload-too-large' ? 413 : 400 });
  if (!isArenaLoadout(parsed.value)) return json(request, { error: 'invalid-arena-loadout' }, { status: 400 });
  const nowMs = Date.now();
  const existing = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (existing === null) return json(request, { error: 'arena-not-joined' }, { status: 404 });
  await normalizeArenaSeason(env.PUBLIC_PLAYER_DB, existing, nowMs);
  await env.PUBLIC_PLAYER_DB.prepare(`
    UPDATE arena_players SET arena_weapon_id = ?, arena_armor_id = ?, arena_orb_id = ?, updated_at_ms = ?
    WHERE game_id = ? AND player_id = ?
  `).bind(parsed.value.weaponId, parsed.value.armorId, parsed.value.orbId, nowMs, gameId, playerId).run();
  const updated = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  return json(request, { arena: arenaView(updated, await arenaRank(env.PUBLIC_PLAYER_DB, updated)) });
}

async function handleArenaLeaderboard(request, env, gameId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const url = new URL(request.url);
  const limit = normalizeLimit(url.searchParams.get('limit'), 10);
  const seasonKey = arenaSeasonKey(Date.now());
  const rows = await env.PUBLIC_PLAYER_DB.prepare(`
    SELECT player_id, display_name, job_id, rating, best_rating, season_score, wins, losses, draws
    FROM arena_players WHERE game_id = ? AND season_key = ?
    ORDER BY season_score DESC, rating DESC, updated_at_ms ASC, player_id ASC LIMIT ?
  `).bind(gameId, seasonKey, limit).all();
  const entries = (rows.results ?? []).map((row, index) => ({
    rank: index + 1, playerId: row.player_id, displayName: row.display_name, jobId: row.job_id,
    rating: Number(row.rating), bestRating: Number(row.best_rating), seasonScore: Number(row.season_score),
    wins: Number(row.wins), losses: Number(row.losses), draws: Number(row.draws),
    isChampion: index === 0 && Number(row.season_score) > 0,
  }));
  return json(request, { seasonKey, entries });
}

async function handleArenaHistory(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  const rows = await env.PUBLIC_PLAYER_DB.prepare(`
    SELECT * FROM arena_battles WHERE game_id = ? AND (attacker_id = ? OR defender_id = ?)
    ORDER BY resolved_at_ms DESC LIMIT 10
  `).bind(gameId, playerId, playerId).all();
  const entries = (rows.results ?? []).map((row) => {
    const attack = row.attacker_id === playerId;
    const attackerOutcome = row.attacker_outcome;
    const outcome = attack ? attackerOutcome : attackerOutcome === 'win' ? 'loss' : attackerOutcome === 'loss' ? 'win' : 'draw';
    return {
      battleId: row.battle_id, resolvedAtMs: Number(row.resolved_at_ms), role: attack ? 'attack' : 'defense',
      opponentName: attack ? row.defender_name : row.attacker_name,
      opponentJobId: attack ? row.defender_job_id : row.attacker_job_id,
      outcome,
      ratingDelta: Number(attack ? row.attacker_rating_delta : row.defender_rating_delta),
      scoreGain: Number(attack ? row.attacker_score_gain : row.defender_score_gain),
    };
  });
  return json(request, { entries });
}

async function humanArenaOpponent(db, attacker, nowMs, dayKey) {
  const rows = await db.prepare(`
    SELECT p.*, COALESCE(w.win_count, 0) AS today_wins
    FROM arena_players p
    LEFT JOIN arena_daily_wins w ON w.game_id = p.game_id AND w.day_key = ? AND w.attacker_id = ? AND w.defender_id = p.player_id
    WHERE p.game_id = ? AND p.season_key = ? AND p.player_id != ? AND p.barrier_until_ms <= ?
      AND COALESCE(w.win_count, 0) < ?
    ORDER BY ABS(p.rating - ?) ASC, p.updated_at_ms DESC
    LIMIT 8
  `).bind(dayKey, attacker.player_id, attacker.game_id, attacker.season_key, attacker.player_id, nowMs, ARENA_DAILY_WIN_LIMIT, attacker.rating).all();
  const candidates = rows.results ?? [];
  if (candidates.length === 0) return null;
  return candidates[randomUint32() % candidates.length];
}

function botArenaOpponent(attackerRating) {
  return [...ARENA_BOTS].sort((a, b) => Math.abs(a.rating - attackerRating) - Math.abs(b.rating - attackerRating))[0];
}

async function handleArenaRandomBattle(request, env, gameId, playerId) {
  if (gameId !== GAME_ID) return json(request, { error: 'unknown-game' }, { status: 404 });
  const auth = await authenticateOwner(request, env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (!auth.ok) return json(request, { error: auth.error }, { status: auth.status });
  const nowMs = Date.now();
  let attacker = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  if (attacker === null) return json(request, { error: 'arena-not-joined' }, { status: 404 });
  attacker = await normalizeArenaSeason(env.PUBLIC_PLAYER_DB, attacker, nowMs);
  if (Number(attacker.next_attack_at_ms) > nowMs) {
    return json(request, { error: 'arena-cooldown', retryAfterMs: Number(attacker.next_attack_at_ms) - nowMs }, { status: 429 });
  }

  const nextAttackAtMs = nowMs + ARENA_COOLDOWN_MS;
  const reserve = await env.PUBLIC_PLAYER_DB.prepare(`
    UPDATE arena_players SET next_attack_at_ms = ?, updated_at_ms = ?
    WHERE game_id = ? AND player_id = ? AND next_attack_at_ms <= ?
  `).bind(nextAttackAtMs, nowMs, gameId, playerId, nowMs).run();
  if (Number(reserve.meta?.changes ?? 0) !== 1) {
    return json(request, { error: 'arena-cooldown', retryAfterMs: ARENA_COOLDOWN_MS }, { status: 429 });
  }

  const dayKey = arenaJstDayKey(nowMs);
  const human = await humanArenaOpponent(env.PUBLIC_PLAYER_DB, attacker, nowMs, dayKey);
  const opponent = human ?? botArenaOpponent(Number(attacker.rating));
  const isBot = human === null;
  const defenderId = isBot ? opponent.playerId : opponent.player_id;
  const defenderName = isBot ? opponent.displayName : opponent.display_name;
  const defenderJobId = isBot ? opponent.jobId : opponent.job_id;
  const defenderRating = Number(opponent.rating);
  const attackerLoadout = { weaponId: attacker.arena_weapon_id, armorId: attacker.arena_armor_id, orbId: attacker.arena_orb_id };
  const defenderLoadout = isBot
    ? ARENA_DEFAULT_LOADOUT
    : { weaponId: opponent.arena_weapon_id, armorId: opponent.arena_armor_id, orbId: opponent.arena_orb_id };
  const seed = randomUint32();
  const simulation = simulateArenaBattle({ attackerJobId: attacker.job_id, defenderJobId, attackerLoadout, defenderLoadout, seed });
  const ratingDeltas = isBot ? { attacker: 0, defender: 0 } : arenaRatingDeltas(Number(attacker.rating), defenderRating, simulation.outcome);
  const attackScoreGain = isBot ? 0 : arenaAttackSeasonScore(defenderRating, simulation.outcome, nowMs);
  let defenseScoreGain = 0;
  if (!isBot && simulation.outcome === 'loss') {
    const rawDefense = arenaDefenseSeasonScore(Number(attacker.rating), nowMs);
    const cap = Math.max(200, Number(opponent.season_attack_score));
    defenseScoreGain = Math.max(0, Math.min(rawDefense, cap - Number(opponent.season_defense_score)));
  }
  const battleId = crypto.randomUUID();
  const attackerWin = simulation.outcome === 'win' ? 1 : 0;
  const attackerLoss = simulation.outcome === 'loss' ? 1 : 0;
  const draw = simulation.outcome === 'draw' ? 1 : 0;
  const statements = [
    env.PUBLIC_PLAYER_DB.prepare(`
      UPDATE arena_players SET rating = MAX(0, rating + ?), best_rating = MAX(best_rating, MAX(0, rating + ?)),
        season_score = season_score + ?, season_attack_score = season_attack_score + ?,
        wins = wins + ?, losses = losses + ?, draws = draws + ?, updated_at_ms = ?
      WHERE game_id = ? AND player_id = ?
    `).bind(ratingDeltas.attacker, ratingDeltas.attacker, attackScoreGain, attackScoreGain, isBot ? 0 : attackerWin, isBot ? 0 : attackerLoss, isBot ? 0 : draw, nowMs, gameId, playerId),
  ];
  if (!isBot) {
    const defenderWin = simulation.outcome === 'loss' ? 1 : 0;
    const defenderLoss = simulation.outcome === 'win' ? 1 : 0;
    const barrierUntil = simulation.outcome === 'win' && Number(opponent.barrier_enabled) !== 0 ? nowMs + ARENA_DEFENSE_BARRIER_MS : Number(opponent.barrier_until_ms);
    statements.push(env.PUBLIC_PLAYER_DB.prepare(`
      UPDATE arena_players SET rating = MAX(0, rating + ?), best_rating = MAX(best_rating, MAX(0, rating + ?)),
        season_score = season_score + MIN(?, MAX(0, MAX(200, season_attack_score) - season_defense_score)),
        season_defense_score = season_defense_score + MIN(?, MAX(0, MAX(200, season_attack_score) - season_defense_score)),
        wins = wins + ?, losses = losses + ?, draws = draws + ?, barrier_until_ms = ?, updated_at_ms = ?
      WHERE game_id = ? AND player_id = ?
    `).bind(ratingDeltas.defender, ratingDeltas.defender, defenseScoreGain, defenseScoreGain, defenderWin, defenderLoss, draw, barrierUntil, nowMs, gameId, defenderId));
    if (simulation.outcome === 'win') {
      statements.push(env.PUBLIC_PLAYER_DB.prepare(`
        INSERT INTO arena_daily_wins (game_id, day_key, attacker_id, defender_id, win_count)
        VALUES (?, ?, ?, ?, 1)
        ON CONFLICT(game_id, day_key, attacker_id, defender_id) DO UPDATE SET win_count = win_count + 1
      `).bind(gameId, dayKey, playerId, defenderId));
    }
  }
  statements.push(env.PUBLIC_PLAYER_DB.prepare(`
    INSERT INTO arena_battles (
      game_id, battle_id, season_key, resolved_at_ms, attacker_id, attacker_name, attacker_job_id,
      defender_id, defender_name, defender_job_id, defender_is_bot, attacker_outcome,
      attacker_rating_delta, defender_rating_delta, attacker_score_gain, defender_score_gain,
      combat_version, seed, result_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(gameId, battleId, attacker.season_key, nowMs, playerId, attacker.display_name, attacker.job_id,
    defenderId, defenderName, defenderJobId, isBot ? 1 : 0, simulation.outcome,
    ratingDeltas.attacker, ratingDeltas.defender, attackScoreGain, defenseScoreGain,
    simulation.combatVersion, seed, JSON.stringify(simulation)));
  await env.PUBLIC_PLAYER_DB.batch(statements);
  const updated = await getArenaRow(env.PUBLIC_PLAYER_DB, gameId, playerId);
  return json(request, {
    battle: {
      battleId, combatVersion: simulation.combatVersion, resolvedAtMs: nowMs, seed,
      outcome: simulation.outcome, firstSide: simulation.firstSide,
      attackerMaxHp: simulation.attackerMaxHp, defenderMaxHp: simulation.defenderMaxHp,
      attackerHpAfter: simulation.attackerHpAfter, defenderHpAfter: simulation.defenderHpAfter,
      turns: simulation.turns,
      opponent: { playerId: defenderId, displayName: defenderName, jobId: defenderJobId, ratingBefore: defenderRating, isBot, loadout: defenderLoadout },
      ratingBefore: Number(attacker.rating), ratingAfter: Number(updated.rating), ratingDelta: ratingDeltas.attacker,
      seasonScoreGain: attackScoreGain, seasonScoreAfter: Number(updated.season_score),
      weekendMultiplier: arenaWeekendMultiplier(nowMs), nextAttackAtMs,
    },
    arena: arenaView(updated, await arenaRank(env.PUBLIC_PLAYER_DB, updated)),
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin');
    if (origin !== null && !isAllowedOrigin(origin)) return new Response('Forbidden origin', { status: 403 });
    if (request.method === 'OPTIONS') return withCors(request, new Response(null, { status: 204 }));

    const url = new URL(request.url);
    const arena = arenaRoute(url.pathname);
    const route = publicPlayerRoute(url.pathname);
    try {
      if (arena?.kind === 'arena-player' && request.method === 'POST') return await handleArenaRegister(request, env, arena.gameId, arena.playerId);
      if (arena?.kind === 'arena-player' && request.method === 'GET') return await handleArenaGet(request, env, arena.gameId, arena.playerId);
      if (arena?.kind === 'arena-player' && request.method === 'DELETE') return await handleArenaDelete(request, env, arena.gameId, arena.playerId);
      if (arena?.kind === 'arena-barrier' && request.method === 'PUT') return await handleArenaBarrier(request, env, arena.gameId, arena.playerId);
      if (arena?.kind === 'arena-loadout' && request.method === 'PUT') return await handleArenaLoadout(request, env, arena.gameId, arena.playerId);
      if (arena?.kind === 'arena-random-battle' && request.method === 'POST') return await handleArenaRandomBattle(request, env, arena.gameId, arena.playerId);
      if (arena?.kind === 'arena-history' && request.method === 'GET') return await handleArenaHistory(request, env, arena.gameId, arena.playerId);
      if (arena?.kind === 'arena-leaderboard' && request.method === 'GET') return await handleArenaLeaderboard(request, env, arena.gameId);

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

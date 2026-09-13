# Minute Vanguard online service

The Worker is the optional online boundary for the local-first game. Public-profile discovery is non-authoritative, while Arena tables and Arena combat are competitive authority. It is still not a general save server.

## Public profile contract

Publishing is explicit opt-in. A browser first claims an anonymous `playerId` plus a random write token. The token itself remains in browser `localStorage`; D1 stores only its SHA-256 hash. Authenticated PUT/DELETE can then publish or remove that player's public projection.

The stored projection contains only display-safe fields from `MinuteVanguardPublicData`. The Worker validates schema version, known jobs/orb ranks, bounded strings, count ranges, monotonic revision and an 8 KiB request-body limit. Claim and publish routes are rate-limited. CORS allows the production GitHub Pages origin plus localhost development origins.

`GET /v1/games/minute-vanguard/players` and player detail reuse the vendored Kit public-directory contract. `GET /leaderboards/level|victories|codex` sorts the same client-submitted projection. These lists are reference/discovery UI only and never feed competitive outcomes.

## Arena authority

Arena registration is another explicit opt-in using the same anonymous owner token. D1 stores Rating, weekly Season Score, attack/defense score, W/L/D, fixed cooldown, defense barrier, daily opponent-win limits and battle history. Random matches are selected by the Worker and resolved from a server-generated seed through `application/arena-domain.ts`; client Level, equipment stats, currencies and RNG are not accepted as battle inputs. The current job id only selects a normalized Arena combat style.

The random-battle route reserves the next 60-second cooldown with a conditional D1 update before resolving combat, so concurrent submissions cannot create two battles. If no eligible human exists, a Worker-owned training bot is used with no official Rating/Season Score/W-L movement.

The current Arena service intentionally does not yet own the reference's free Arena-specific equipment/pets, random-match Gold economy, direct challenges or season rewards.

## Local

```bash
pnpm online:migrate:local
pnpm online:dev
```

## Production

```bash
pnpm online:migrate:remote
pnpm online:deploy
```

D1 database: `minute-vanguard-online`. The Pages deployment is separate and continues to publish only `dist/`.

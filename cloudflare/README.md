# Minute Vanguard online service

The Worker is an optional social-discovery boundary for the local-first game. It is not a save server and it is not competitive authority.

## Public profile contract

Publishing is explicit opt-in. A browser first claims an anonymous `playerId` plus a random write token. The token itself remains in browser `localStorage`; D1 stores only its SHA-256 hash. Authenticated PUT/DELETE can then publish or remove that player's public projection.

The stored projection contains only display-safe fields from `MinuteVanguardPublicData`. The Worker validates schema version, known jobs/orb ranks, bounded strings, count ranges, monotonic revision and an 8 KiB request-body limit. Claim and publish routes are rate-limited. CORS allows the production GitHub Pages origin plus localhost development origins.

`GET /v1/games/minute-vanguard/players` and player detail reuse the vendored Kit public-directory contract. `GET /leaderboards/level|victories|codex` sorts the same client-submitted projection. These lists are reference/discovery UI only; they must not be used for PvP outcomes or rewards.

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

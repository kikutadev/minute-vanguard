# Minute Vanguard

`Minute Vanguard` is an original short-cadence text RPG built as an independent consumer of `idle-game-kit`.

Its product reference is the current Hero60-style interaction model: one explicit monster battle, a short authoritative cooldown, then equipment / orb / mission / pet / job decisions while waiting for the next battle.

## Current playable loop

```text
Battle
→ deterministic 20-turn-cap combat
→ layered reward reveal
→ 5-second beginner / 60-second normal cooldown
→ Equipment / Orb / Title / Mission / Pet decisions
→ Lv.30 Job Change and durable growth
→ next Battle
```

Implemented in the current build:

- portrait app shell with persistent top status and five bottom tabs
- first 10 successful defeats use a 5-second cooldown; normal cadence is 60 seconds
- six combat stats: HP / ATK / DEF / MAT / MDF / LUK
- physical and magical combat, crit/evasion, 1% mutation encounters
- streak reward multipliers and Gold jackpot rolls
- first-defeat Gem rewards, rarity-sensitive Gem drops, 1% permanent stat rewards
- randomized ±30% level growth with Great Growth
- Weapon / Armor / Orb loadout using Kit Inventory / Loadout
- 52-title progressive collection/loadout using Kit Progressive Title primitives
- Equipment-tab buy / equip / +1〜+5 upgrade / discard flow
- F〜SSS orb gacha and special effects
- nine jobs and Lv.30 job change with permanent-growth conditions
- five deterministic JST-day missions selected from a 22-variant / five-category solo pool; 20 Gem daily total
- 30-kill pet capture eligibility, mutation capture, capture-support equipment, snack drops/training, active pet follow-up attack, and a 50-pet original gacha pool
- 100 original monsters across Lv.1/Lv.2 (50 each), with encounter/defeat/mutation/capture codex records
- next-battle Battle Boost (10 Gem, EXP/Gold ×2) and reward multiplier breakdown
- IndexedDB save and wall-clock cooldown progression
- same-core headless simulator
- local `pnpm deploy:pages` publishing that pushes only built `dist/` contents to the `gh-pages` branch; no GitHub Actions required
- local Cloudflare Worker + D1 harness for public-player directory QA

## Kit boundary

Reusable `Cooldown`, `Inventory`, `Loadout`, Currency, Reward, deterministic RNG and browser persistence are provided by `idle-game-kit`.

Product-owned typed code remains responsible for:

- turn combat
- encounter tables
- jobs and combat skills
- concrete equipment/orb balance
- pet capture and party rules
- mission conditions
- presentation and reward-reveal sequencing

The repository vendors the built Kit package under `vendor/idle-game-kit` because the Kit is not yet published to a package registry. Source-level sibling imports are intentionally forbidden so this repository stays independently buildable.

## Online boundary

Public-player browsing has a local Cloudflare-compatible harness backed by Wrangler local D1. It exists to exercise the real Kit D1 adapter and API shape without requiring a remote database. PvP/Champion, shared Raid, chat, account/payment and authenticated publishing still require a server-authoritative production service.

## Development

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Production output is written to `dist/` with relative asset URLs so the same build works under a GitHub Pages repository subpath.


## Reference parity workflow

Benchmark mechanics are tracked with a public-reference contract, live guide/patch-note audit and Domain parity tests. See `docs/REFERENCE-PARITY.md`.

## Solo-first public player directory

The game remains fully playable from its local save with no backend configured. Production builds only use a public-player API when `VITE_PUBLIC_PLAYER_API_BASE_URL` is explicitly provided. Development defaults to `/api`, which Vite proxies to the local Worker on port 8787. The Ranking tab therefore exercises the same vendored Kit `PublicPlayerDirectoryReader` / D1 adapter against a real local D1 database. No raw save is sent by this client. Publishing is intentionally deferred until authenticated ownership is implemented.

To recreate the Cloudflare data path locally:

```bash
pnpm install --frozen-lockfile
pnpm db:reset:local   # apply D1 migration + load three public-profile fixtures
pnpm dev:db           # Wrangler Worker + local D1 on http://127.0.0.1:8787
pnpm dev --host 127.0.0.1 --port 4177
```

Open the Ranking tab and the three seeded public adventurers should be loaded through `Vite /api -> Worker -> D1`. Wrangler state lives under `cloudflare/.wrangler/` and is ignored by git. GitHub Pages does not ship or depend on that database; only `dist/` is deployed and the game falls back to solo mode there unless a production API URL is intentionally configured later.


## GitHub Pages deployment

GitHub Actions is intentionally not used. Run `pnpm deploy:pages` locally after committing changes. It runs the local checks/build and force-publishes only `dist/` to the artifact-only `gh-pages` branch.

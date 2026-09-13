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
- seven-day JST login bonus with missed-day reset and public endpoint rewards
- 30-kill pet capture eligibility, mutation capture, capture-support equipment, snack drops/training, active pet follow-up attack, and a 50-pet original gacha pool
- 650 original monsters across Lv.1–13 (50 each), with sequential hunting-area unlocks and encounter/defeat/mutation/capture codex records
- next-battle Battle Boost (10 Gem, EXP/Gold ×2) and reward multiplier breakdown
- IndexedDB save and wall-clock cooldown progression
- same-core headless simulator
- local `pnpm deploy:pages` publishing that pushes only built `dist/` contents to the `gh-pages` branch; no GitHub Actions required
- opt-in Cloudflare Worker + D1 public profiles and non-authoritative reference leaderboards
- server-authoritative weekly Arena: normalized server combat, Rating, Season Score, Champion crown, fixed PvP cooldown, defense barrier and battle history
- free server-owned Arena weapon / armor / orb loadouts used for both attack and defense; concrete balance remains Minute Vanguard-owned because the public reference does not expose the full stat table

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

The production Cloudflare Worker + D1 service at `minute-vanguard-online.kikutadev.workers.dev` now owns two deliberately separate online surfaces.

Public-profile publishing is explicit opt-in. The browser claims an anonymous player id plus a write token, the Worker stores only the token hash, and only the product-owned public projection is uploaded. Recent / Level / victories / codex lists are still reference/discovery rankings because those values come from a local save.

Arena is a second opt-in boundary and is competitive authority. D1 owns Rating, best Rating, weekly Season Score, attack/defense score, record, fixed 60-second Arena cooldown, defense barrier, daily opponent-win counters and battle history. The Worker selects the opponent, creates the random seed and resolves normalized 20-turn combat. Local Level, Gold, equipment stats, RNG and raw save data are not accepted as combat inputs. The current job id is only a normalized Arena combat style. If no human opponent is available, a server-owned training bot is used and the battle changes no official Rating, Season Score or W/L.

The current Arena slice intentionally stops before features that would require additional server-owned economy/progression: Arena-specific free weapon/armor/orb loadouts, Arena pets, random-match Gold transfer, named challenges, season reward delivery and hall-of-fame history. Shared Raid / wanted events, chat and payments are also separate future authority boundaries. API failure never blocks solo play.

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

The game remains fully playable from its local IndexedDB save if the online service is unavailable. The production build defaults to the deployed Worker; `VITE_PUBLIC_PLAYER_API_BASE_URL` can override that endpoint for another environment, while development defaults to `/api` through the Vite proxy.

Publishing is off by default. Pressing `公開プロフィールを有効にする` claims an anonymous browser-owned identity and publishes only `MinuteVanguardPublicData`: display name, level, job, battle/victory counts, codex count, pet count and equipped-item summary. Raw save state, currencies, RNG state, inventory instance ids and the write token are never included in the public payload. Opting out deletes the D1 snapshot; the browser retains its anonymous ownership token so the same identity can be republished later.

To recreate the data path locally:

```bash
pnpm install --frozen-lockfile
pnpm online:migrate:local
pnpm online:dev        # Worker + local D1 on http://127.0.0.1:8787
pnpm dev --host 127.0.0.1 --port 4177
```

Production Worker operations are explicit:

```bash
pnpm online:migrate:remote
pnpm online:deploy
```

Wrangler local state lives under `cloudflare/.wrangler/` and is ignored by git. GitHub Pages still publishes only `dist/`; the Worker/D1 deployment is separate from Pages.


## GitHub Pages deployment

GitHub Actions is intentionally not used. Run `pnpm deploy:pages` locally after committing changes. It runs the local checks/build and force-publishes only `dist/` to the artifact-only `gh-pages` branch.

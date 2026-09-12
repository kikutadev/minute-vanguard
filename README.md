# Minute Vanguard

`Minute Vanguard` is an original short-cadence text RPG built as an independent consumer of `idle-game-kit`.

Its product reference is the current Hero60-style interaction model: one explicit monster battle, a short authoritative cooldown, then equipment / orb / mission / pet / job decisions while waiting for the next battle.

## Current playable loop

```text
Battle
→ deterministic 20-turn-cap combat
→ layered reward reveal
→ 5-second beginner / 60-second normal cooldown
→ Equipment / Orb / Mission / Pet decisions
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
- Equipment-tab buy / equip / +1〜+5 upgrade / discard flow
- F〜SSS orb gacha and special effects
- nine jobs and Lv.30 job change with permanent-growth conditions
- five claimable daily missions with JST-midnight reset
- 30-kill pet capture eligibility, 1% capture, active pet follow-up attack
- collection/codex view
- IndexedDB save and wall-clock cooldown progression
- same-core headless simulator
- GitHub Pages workflow that uploads `dist/` only

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

Ranking, PvP/Champion, shared Raid, chat, account/payment and other shared-world systems are intentionally not simulated as fake local features. They require a separate server-authoritative service.

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

The game remains fully playable from its local save with no backend configured. If `VITE_PUBLIC_PLAYER_API_BASE_URL` is set, the Ranking tab uses the vendored Kit `PublicPlayerDirectoryReader` / Cloudflare adapter to browse public player projections. No raw save is sent by this client. Publishing is intentionally deferred until authenticated ownership is implemented on the Cloudflare Worker side.

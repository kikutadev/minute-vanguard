# Minute Vanguard — Product Specification

Status: v0.1 vertical slice

## Architecture

- `definitions/`: balance/content definitions only
- `plugin/`: product-owned deterministic combat and progression commands
- `application/`: persistence orchestration
- `simulator/`: headless same-core progression
- `web/`: React presentation only
- `vendor/idle-game-kit/`: immutable built Kit package snapshot

## Battle

A Battle is an immediate command. It may execute only when the reusable Kit cooldown is ready. The command consumes the cooldown before resolving encounter RNG so repeated clicks cannot obtain multiple results at one readiness boundary.

Opening battles use a five-second cadence for the first three attempts. Normal cadence is 60 seconds and may be reduced by vocation effects, with a hard floor of 30 seconds.

Combat resolves at most 12 turns. Player attack, enemy response, critical and dodge results are deterministic for the saved RNG stream state.

## Reward layers

Victory guarantees EXP and Gold. Independent deterministic RNG checks may add jackpot Gold, permanent ATK, equipment drop and elite shard reward. First discovery adds the enemy to the codex.

## Equipment

Kit owns Item instance identity, Inventory storage and Loadout slot validity. Product data owns equipment kind, rolled attack/defense, rarity, upgrade rank and source. Better newly granted equipment may auto-equip; the player may override manually.

## Job change

At Lv.10 the player can change job. Level and EXP reset, while inventory, equipment, currencies, codex and battle history remain. Job Rank and permanent power increase. Job Rank selects a stronger vocation and can reduce battle cooldown.

## Persistence

IndexedDB is authoritative for browser save data. Wall-clock elapsed time advances only `simTimeSec`; no offline battle rewards are generated automatically. Offline time therefore makes the next explicit Battle available but never battles on the player's behalf.

## Deployment

Vite builds relative assets into `dist/`. GitHub Actions runs verification/build and uploads only `dist/` to GitHub Pages. Source files and vendored development files are never part of the Pages artifact.

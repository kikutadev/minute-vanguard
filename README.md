# Minute Vanguard

`Minute Vanguard` is an original short-cadence idle/collection RPG built as an independent consumer of `idle-game-kit`.

The core loop is deliberately discrete rather than always-on:

```text
Battle now
→ immediate deterministic combat result
→ layered rewards / loot / discovery
→ authoritative cooldown window
→ equipment / upgrade / job decisions while waiting
→ next battle
```

## Current vertical slice

- deterministic seeded encounters and auto-battle resolution
- 5-second onboarding cadence, then 60-second battle cadence with job-based reduction
- Gold / Bell Shard economy via Kit Currency + Reward primitives
- randomized equipment drops with rarity and auto-equip comparison
- shop purchases and equipment upgrades
- reusable Kit Inventory / Loadout integration
- level progression and Lv.10 job change with durable retention
- enemy codex discovery
- jackpot Gold and low-probability permanent ATK reward
- IndexedDB save and wall-clock/offline cooldown progression
- same-core headless simulator
- GitHub Pages workflow that uploads `dist/` only

## Kit boundary

Reusable `Cooldown` and minimal `Inventory / Loadout` are implemented in `idle-game-kit`. Combat turns, enemy selection, drop stats, job-change effects and presentation remain product-owned typed code.

The repository vendors the built Kit package under `vendor/idle-game-kit` because the Kit is not yet published to a package registry. Source-level sibling imports are intentionally forbidden so this repository remains independently buildable.

## Development

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

Production output is written to `dist/` with relative asset URLs so the same build works under a GitHub Pages repository subpath.

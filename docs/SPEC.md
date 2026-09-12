# Minute Vanguard — Product Specification

Status: Hero60-reference vertical slice (2026-09-12)

## Architecture

- `definitions/`: balance/content definitions only
- `plugin/`: product-owned deterministic combat and progression commands
- `application/`: persistence orchestration
- `simulator/`: headless same-core progression
- `web/`: React presentation only
- `vendor/idle-game-kit/`: immutable built Kit package snapshot

The product is an independent repository beside the other idle-game consumers. `idle-game-kit` owns reusable currency, reward, deterministic RNG, cooldown, inventory/loadout and browser persistence primitives. Combat, jobs, monsters, pet capture, mission conditions and presentation remain product-owned typed code.

### Solo-first and optional public player data

Minute Vanguard is a solo game first. Battle, reward, level, equipment, pet, mission, save/load and offline resume use the local save as authority and must work with no backend configured.

Other-player information is optional. The game builds a small product-owned public projection (`MinuteVanguardPublicData`) rather than exposing the raw save, and consumes it through the Kit `PublicPlayerDirectoryReader`. If `VITE_PUBLIC_PLAYER_API_BASE_URL` is absent or unavailable, the game falls back to solo presentation without blocking gameplay. Publishing is deferred until authenticated ownership exists on the Cloudflare Worker side.

The preferred future backend deployment follows the Kit Cloudflare baseline: Workers + Static Assets for the client/API and D1 for queryable public-player projections. Existing GitHub Pages hosting may remain during the solo-first phase; it is not the target infrastructure for new shared-data features.

## Reference fidelity target

The interaction model intentionally follows the current public structure of Hero60-style play rather than the earlier generic prototype:

- persistent top profile area: player/job/level, HP, EXP, Gold, Gem
- persistent five-tab bottom navigation: Shop / Equipment / Battle / Collection / Ranking
- Battle is the center tab
- Daily Mission and Job Change open over Battle instead of navigating away
- Equipment owns buy / equip / upgrade / discard
- Shop owns permanent upgrades and time/economy purchases
- Battle result is a modal with opposing combatants, fixed HP bars, turn log, and reward reveal

Names, monster identities, artwork, copy and exact visual assets remain original to Minute Vanguard.

## Battle cadence

A battle is an immediate authoritative command followed by a cooldown.

- first 10 successful monster defeats: 5-second cooldown
- a defeat during the beginner period: normal cooldown
- normal cooldown: 60 seconds
- permanent cooldown upgrade: 50 seconds
- equipped orb can reduce normal cooldown by up to 5 additional seconds
- Gem skip cost scales from 1 to 6 with remaining time
- Rare Guarantee costs 10 Gem and constrains the next encounter to Rare or above

Combat resolves at most 20 turns. Result generation, turn log, rewards, RNG state and cooldown are all Domain state; browser timers only animate already-resolved turns.

## Stats and growth

Player and combat use six stats:

- HP
- ATK
- DEF
- MAT
- MDF
- LUK

Level-up growth is randomized independently per stat in a ±30% range around the current job's growth profile. A Great Growth roll doubles all gains for that level; the base chance is 5% and can be increased by an orb up to the product cap. Level-up fully restores HP.

## Reward layers

Victory can produce several independent reward beats:

- guaranteed EXP and Gold
- same-monster consecutive-defeat multiplier: 2 = ×1.2, 3–4 = ×1.5, 5+ = ×2
- Gold jackpot: ×2 / ×3 / ×5 / ×10
- first-defeat Gem reward
- rarity-sensitive Gem drop
- 1% permanent stat reward
- equipment drop
- orb drop
- after 30 defeats of the same monster, a 1% pet-capture roll

Mutation is a 1% encounter roll and increases both difficulty and rewards.

Defeat sets HP to 1 and removes half of carried Gold before protection effects. A 20-turn draw grants a fraction of EXP and keeps remaining HP. Level-up after victory/draw restores HP.

## Equipment and orbs

Loadout has three slots: Weapon / Armor / Orb.

Weapon and Armor are bought, equipped, upgraded to +5, or discarded from Equipment. Product data owns the concrete stat vectors and rarity.

Orb ranks are F / E / D / C / B / A / S / SS / SSS. Orbs distribute percentage budget across the six stats and may have one special effect. Gacha costs 100 Gem per pull; a 10-pull costs 1,000 Gem and guarantees at least one A-or-higher orb plus a special-effect result.

Rank-up synthesis, reroll, locking, favorites and capacity expansion are implemented. The base capacity is 10, expansion costs 100 Gem per slot, reroll preserves total percentage budget with up to three locked stats, and synthesis consumes one parent plus four same-rank materials while preserving the parent instance.

## Jobs

Lv.30 unlocks job change. Current job set:

- Warrior
- Mage
- Thief
- Priest
- Ninja
- Gambler
- Wraith
- Tamer
- Hexer

Each job owns product-specific combat behavior. Job change resets Level/EXP/base growth to the new run while retaining equipment, Gem, Gold, codex and kill counts. Permanent bonus eligibility uses the current job's successful-bonus count and escalating level requirement. Successful bonuses add permanent HP and global growth rate.

Wraith requires 10 total job changes. Tamer requires 10 owned pets.

## Pets

A monster becomes capture-eligible after 30 successful defeats. Every later victory against that monster rolls 1% capture. One copy of each monster can be owned.

- normal jobs: one active pet
- Tamer: two active pets
- active pets add a follow-up attack during monster battles
- the second Tamer pet contributes at reduced power

Full pet leveling and pet gacha are future product work.

## Daily missions

Five local daily missions are implemented and reset at midnight JST:

1. Battle 3 times — 3 Gem
2. Win 2 times — 3 Gem
3. Upgrade equipment once — 4 Gem
4. Reach Lv.5 — 5 Gem
5. Discover 3 monsters — 5 Gem

Each reward is claimable once per JST day. This preserves the 20-Gem completion cadence while the rotating mission pool is still future work.

## Time Boosts

Three local-only timed boosts are implemented in Shop. They use simulation time and therefore expire correctly across background/offline wall-clock advancement.

- 3 minutes — 30 Gem
- 10 minutes — 100 Gem
- 30 minutes — 300 Gem
- Rush Time — battle cooldown becomes 10 seconds and Gem cooldown skip is disabled
- EXP Boost — battle EXP ×2
- Gold Boost — battle Gold ×2
- the same boost cannot be repurchased or extended while active
- Rush is hidden and rejected while the beginner 5-second cadence is active
- different boost kinds may overlap

## Persistence

IndexedDB is authoritative for browser save data. Wall-clock elapsed time advances `simTimeSec` and cooldown readiness only; it never auto-resolves battles. Daily mission rollover is evaluated from wall-clock time using JST.

Schema upgrades normalize incompatible public-prototype saves into the current product schema while preserving supported currencies where possible.

## Online-only boundary

The current independent Pages build is local-first. Real Ranking, PvP/Champion, shared Raid, shared wanted events, chat, account/payment and server rewards require a server-authoritative service and are not faked as completed Kit features.

## Deployment

Vite builds relative assets into `dist/`. GitHub Actions runs verification/build and uploads only `dist/` to GitHub Pages. Source files and vendored development files are never part of the Pages artifact.

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

Other-player information is optional. The game builds a small product-owned public projection (`MinuteVanguardPublicData`) rather than exposing the raw save, and consumes it through the Kit `PublicPlayerDirectoryReader`. Production builds fall back to solo presentation when `VITE_PUBLIC_PLAYER_API_BASE_URL` is absent or unavailable. Publishing is deferred until authenticated ownership exists on the Cloudflare Worker side.

For local development, the Cloudflare path is reproduced with Wrangler local D1. `cloudflare/migrations/` mirrors the Kit public-player schema, `cloudflare/worker.js` composes `D1PublicPlayerDirectory` with the Kit request handler, and Vite proxies `/api` to the local Worker. Seed rows are public projections only, never raw saves. This local harness is part of QA, not a deployed production backend.

GitHub Pages remains the current static deployment target and uploads only `dist/`. A future authenticated/shared-data production deployment can move the same API shape to Cloudflare Workers + D1 without changing solo progression authority.

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
- mutated monsters are suppressed until 20 total victories; afterward the mutation roll is 1%
- after 30 defeats of the same monster, a 1% pet-capture roll

Mutation is a 1% encounter roll and increases both difficulty and rewards.

Defeat sets HP to 1 and removes half of carried Gold before protection effects. A 20-turn draw grants a fraction of EXP and keeps remaining HP. Level-up after victory/draw restores HP.

## Equipment and orbs

Loadout has three slots: Weapon / Armor / Orb.

Weapon and Armor are bought, equipped, upgraded to +5, or discarded from Equipment. Product data owns the concrete stat vectors and rarity.

Orb ranks are F / E / D / C / B / A / S / SS / SSS. Orbs distribute percentage budget across the six stats and may have one special effect. Gacha costs 100 Gem per pull; a 10-pull costs 1,000 Gem and guarantees at least one A-or-higher orb plus a special-effect result.

Rank-up synthesis, reroll, locking, favorites and capacity expansion are implemented. The base capacity is 10, expansion costs 100 Gem per slot, reroll preserves total percentage budget with up to three locked stats, and synthesis consumes one parent plus four same-rank materials while preserving the parent instance.

## Progressive titles

Titles are a fourth equipment-adjacent progression axis but do not add raw stats. The product owns 52 original title definitions arranged across 13 behavior-changing effect families. Reusable copy/level/loadout constraints come from Kit's `ProgressiveTitleCollectionState`.

- 52 title definitions
- five equipped slots
- Lv.1–5 unlock at cumulative 1 / 3 / 6 / 10 / 15 copies
- monster victory has a 1% title-drop roll, followed by an equal pick across all 52
- a maxed title can still be selected by the drop roll and then grants no additional copy
- daily Shop has three fixed JST-day offers, 300 Gem each, one purchase each
- same-day offers do not shift after a purchase or after reaching Lv.5
- equipped title cost is limited by player level
- verified public cap anchors are Lv.1=4, Lv.30=10, Lv.120=16, Lv.5000=40
- the public source does not expose the complete current intermediate cost table, so Minute Vanguard explicitly interpolates only between those verified anchors rather than claiming hidden reference values
- before the first real job, individual titles can be removed freely
- after taking a job, individual removal is locked; a 300-Gem full reset is available
- job change clears the equipped five slots but preserves title ownership and levels
- equipped title levels and order may be changed without removing the title
- search and favorites are local presentation state / product metadata

When multiple equipped titles belong to the same effect family, Minute Vanguard applies the strongest value only. Names and concrete effects are original product content; only the collection density and progression cadence are benchmarked against the public reference.

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

Each job owns product-specific combat behavior. Ninja assassination is capped at 15% and is suppressed for enemies outside plausible 20-turn reach. Gambler uses the current seven multiplier outcomes (0.2/0.5/1/3/8/20/100; exact public odds are not copied, Minute Vanguard owns an approximately 3.2× expected table). Wraith ignores equipment, grows only HP/MAT and uses its accumulating/decaying magic multiplier. Tamer supports physical sword / magical staff attacks, physical armor, two pets, stronger pet damage and capture.

Job change resets Level/EXP/base growth while retaining owned equipment, Gem, Gold, codex and kill counts. Permanent bonus eligibility is 30/50/100/200 by successful bonuses for that job; after 300 total successful awards, the fourth-plus requirement increases by 10 levels per additional award. Growth bonus awards step from +5% to +4% to +3% across the current total-award bands. Wraith requires 10 total job changes. Tamer requires 10 owned pets.

## Monster roster / codex

The current solo build has 650 original monsters: 50 in each Monster Lv.1–13. Existing legacy Lv.1/Lv.2 IDs are retained for save compatibility. Each level contains every rarity, while encounter rarity is rolled separately so roster size does not make rare/boss enemies artificially common. The player explicitly selects one unlocked monster level; defeating any monster in the current highest level unlocks the next level. During the first ten successful defeats, natural encounters are restricted to Common/Uncommon unless the player explicitly activates Rare Guarantee.

The codex is split by monster level and records encounters, defeats, mutated encounters, capture eligibility and captured state.

During an active battle cooldown, the player can open a reward-free `Monster Tap` pastime. Six cells cycle through monsters from unlocked levels plus occasional hero decoys. Correct monster taps score +1; hero or empty-cell taps cost 3 points. The best score is local-device-only and opening/closing the pastime has no effect on progression or rewards.

The solo collection also includes 104 original achievement titles backed by the Kit Achievement state. They track battle, codex, progression, pet, orb, title and wealth milestones, persist once earned, show NEW state until opened, and one earned title can be selected for display above the player name. The reference currently has 300+ titles; Minute Vanguard expands toward that count only with real conditions rather than placeholder names.

## Pets

A monster becomes capture-eligible after 30 successful defeats. Every later victory against that monster rolls 1% capture. One normal copy of each monster can be owned. Capturing its mutated form is tracked separately and adds another +1% level-up growth bonus without increasing the owned-pet count.

- normal jobs: one active pet
- Tamer: two active pets
- active pets add a follow-up attack during monster battles
- the second Tamer pet contributes at reduced power

Pet training is implemented: snacks auto-charge once per hour until the free-charge threshold of 100, paid snack bundles add 100 for 100 Gem, each snack raises one pet training level, total training levels grant +1% level-up growth per 20 levels, and trained pets increase follow-up damage. Pet gacha is also implemented with 50 original limited pets: first single 100 Gem, later singles 300 Gem, ten pulls 3,000 Gem, a shared JST-day pickup at double weight, no ten-pull guarantee, and duplicate conversion into rarity-scaled snacks.
Four original capture-support equipment pieces are sold for 2,000 Gem each. A support weapon or armor doubles the base capture roll; weapon + armor stack to ×4, and Tamer's ×1.5 modifier stacks on top. Monster victories also have a product-owned low-probability snack drop; mutated victories use the public ×3 drop weighting.
Epic-or-higher limited gacha pets each carry one special-effect category: turn regen, damage guard, follow-up strike or triple strike. The public reference names the categories but does not publish their exact tuning, so Minute Vanguard uses product-owned values (2% heal/turn, 8% guard, 35% follow-up, 15% triple-strike proc).

## Daily missions

Five local daily missions are selected deterministically for each JST day. Every player/date gets one mission from each of five categories: battle count, battle results/streak, monster rarity, progression, and a solo collection/equipment category. Minute Vanguard has 22 original variants across those groups; the online-arena slot from the reference is deliberately replaced so all five are completable in solo mode.

Rewards are based on number claimed that day: 3 / 3 / 4 / 5 / 5 Gem (20 total). All progress and claims reset at midnight JST. Battle-count targets are tuned around 20–50 fights so the full set is a meaningful session rather than a few-minute checklist.

## Login bonus

The local solo save tracks a seven-day JST login cycle. Day 1 grants 2,000 Gold; Day 7 grants 20,000 Gold + 15 Gem. Missing a calendar day resets the cycle to Day 1, and Day 7 cycles back to Day 1 on the next consecutive day. The public guide does not expose Days 2–6, so those intermediate Gold amounts are explicitly Minute Vanguard-owned balance rather than parity values.

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

## Gold bags

The Shop exposes three repeatable Gold bags at 30 / 100 / 300 Gem. They unlock after two monster victories and use only the rolling last-ten monster-victory levels as their input. Equipment, orb, title and timed Gold multipliers do not change bag contents. The exact payout curve is intentionally Minute Vanguard balance because the public reference does not publish its formula.

## Mutated pet forms

Mutations are disabled through the first 20 total victories. After that, mutated monsters can be captured independently from the normal form after the normal 30-kill capture gate. A captured mutated form contributes a separate +1% level-up growth bonus but does not count as an additional pet species for party or Tamer-unlock counts.

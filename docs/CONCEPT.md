# Minute Vanguard — Concept

Status: playable reference-faithful vertical slice

## Product promise

One compact battle is always the next thing the player is waiting for. The waiting window is active preparation time: buy or improve equipment, inspect the collection, claim daily rewards, manage pets, and prepare a job change.

The target feeling is not a generic idle RPG. It is a dense mobile text-RPG loop where one explicit battle produces several small chances to get lucky, then immediately creates the next anticipation window.

## Core loop

```text
Anticipation: short countdown + unknown encounter
Action: one Battle command
Reveal: opponent + turn-by-turn combat
Guaranteed progress: EXP / Gold on victory
Variable upside: streak / jackpot / Gem / permanent stat / equipment / orb / pet capture
Preparation: Equipment / Orb / Mission / Pet / Job decisions while waiting
Long-term growth: Lv.30 job changes + retained collections + permanent bonuses
Next anticipation: cooldown starts immediately after the resolved battle
```

## UI principle

The game is designed as a portrait mobile app shell rather than a scrolling landing page.

- top profile/status remains visible
- bottom five-tab navigation remains visible
- Battle is the visual and navigational center
- transient systems such as missions and job change appear as sheets over Battle
- battle result is an interruptive reward reveal, then returns the player directly to the same waiting loop

The player should never need to wonder what to do next: fight if ready; otherwise improve something that matters before the next fight.

## Reward principle

A battle should rarely end with only one number changing. Even an ordinary victory can advance several tracks at once: level, Gold, Gem, codex, streak, equipment, orb, permanent stats, pet eligibility and daily missions. The important design constraint is that these rolls remain legible rather than collapsing into noise.

## Authority boundary

UI animation and browser timers are never authoritative. Combat result, rewards, RNG stream state, cooldown readiness, mission claimability and pet capture all live in Domain state and are reproducible by the same-core simulator.

## Originality boundary

Hero60RPG is used as a structural product reference for interaction cadence and system composition. Minute Vanguard does not copy its source code, artwork, monster names, story text or proprietary assets. The implementation uses original names/content while reproducing the relevant gameplay structure on top of `idle-game-kit`.

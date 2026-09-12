# Minute Vanguard — Concept

Status: initial playable vertical slice

## Product promise

One meaningful battle is always the next thing the player is waiting for. The waiting window is not dead time: it is where the player evaluates drops, upgrades equipment, checks the codex and prepares a durable job change.

## Reward loop

```text
Anticipation: countdown + unknown breach
Action: one Battle command
Reveal: enemy / elite state / deterministic turn result
Guaranteed reward: EXP + Gold on victory
Variable upside: jackpot / equipment rarity / permanent ATK / shard / new codex entry
Escalation: stronger enemy pool + equipment + level
Long-term reset: job change retains durable collection and makes future cadence stronger
Next anticipation: authoritative cooldown immediately starts after the result
```

The product must never make UI animation or browser timers authoritative. Combat result, rewards, RNG state and cooldown readiness are all Domain state.

## Originality boundary

The implementation takes inspiration from the broad design pattern of timer-gated compact RPG battles, but does not copy names, text, artwork, monsters, story, UI layout, balance values or source code from another product. The world, progression values and presentation are original to Minute Vanguard.

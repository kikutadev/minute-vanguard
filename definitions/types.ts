import type {
  CooldownState,
  GameState,
  InventoryState,
  LoadoutState,
} from 'idle-game-kit';

export type EquipmentKind = 'weapon' | 'armor';
export type EquipmentRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type EquipmentData = Readonly<{
  kind: EquipmentKind;
  attack: number;
  defense: number;
  rarity: EquipmentRarity;
  upgradeRank: number;
  source: string;
}>;

export type EnemyDefinition = Readonly<{
  id: string;
  displayName: string;
  glyph: string;
  unlockWins: number;
  hp: number;
  attack: number;
  defense: number;
  exp: number;
  gold: number;
  dropChance: number;
  itemPool: readonly string[];
}>;

export type VocationDefinition = Readonly<{
  id: string;
  displayName: string;
  requiredJobRank: number;
  attackMultiplier: number;
  defenseMultiplier: number;
  cooldownReductionSec: number;
}>;

export type BattleTurn = Readonly<{
  turn: number;
  playerDamage: number;
  enemyDamage: number;
  critical: boolean;
  dodged: boolean;
}>;

export type BattleResult = Readonly<{
  battleIndex: number;
  enemyId: string;
  enemyName: string;
  enemyGlyph: string;
  victory: boolean;
  turns: readonly BattleTurn[];
  playerHpRemaining: number;
  enemyHpRemaining: number;
  goldGained: number;
  expGained: number;
  jackpotGold: number;
  permanentPowerGain: number;
  droppedItemInstanceId: string | null;
  discoveredEnemy: boolean;
}>;

export type PlayerProgress = Readonly<{
  level: number;
  exp: number;
  jobRank: number;
  vocationId: string;
  baseAttack: number;
  baseDefense: number;
  baseHp: number;
  permanentPower: number;
}>;

export type MinuteVanguardGameData = Readonly<{
  player: PlayerProgress;
  battleCooldown: CooldownState;
  inventory: InventoryState<EquipmentData>;
  loadout: LoadoutState;
  totalBattles: number;
  victories: number;
  defeats: number;
  discoveredEnemyIds: readonly string[];
  nextItemSequence: number;
  lastBattle: BattleResult | null;
}>;

export type MinuteVanguardState = GameState<MinuteVanguardGameData>;

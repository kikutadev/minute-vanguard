import type {
  CooldownState,
  GameState,
  InventoryState,
  LoadoutState,
  ProgressiveTitleCollectionState,
} from 'idle-game-kit';

export type StatKey = 'hp' | 'attack' | 'defense' | 'magicAttack' | 'magicDefense' | 'luck';
export type StatValues = Readonly<Record<StatKey, number>>;
export type EquipmentKind = 'weapon' | 'armor' | 'orb';
export type MonsterRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'boss';
export type OrbRank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
export type TimeBoostKind = 'rush' | 'exp' | 'gold';
export type TimeBoostState = Readonly<Record<TimeBoostKind, number>>;
export type TitleShopState = Readonly<{ dayKey: string; offeredTitleIds: readonly string[]; purchasedTitleIds: readonly string[] }>;

export type DailyMissionProgress = Readonly<{
  dayKey: string;
  battles: number;
  wins: number;
  upgrades: number;
  heals: number;
  levelUps: number;
  equipmentBuys: number;
  discoveries: number;
  maxStreak: number;
  rarityWins: Readonly<Partial<Record<MonsterRarity, number>>>;
  claimed: readonly string[];
}>;

export type OrbEffectId = 'gemDrop' | 'goldProtection' | 'gold' | 'exp' | 'drawExp' | 'regen' | 'greatGrowth' | 'critical' | 'evasion' | 'cooldown';

export type EquipmentData = Readonly<{
  kind: EquipmentKind;
  rarity: MonsterRarity;
  upgradeRank: number;
  flatStats: Partial<StatValues>;
  percentStats?: Partial<StatValues>;
  orbRank?: OrbRank;
  effectId?: OrbEffectId;
  effectValue?: number;
  effectLevel?: number;
  favorite?: boolean;
  locked?: boolean;
  source: string;
}>;

export type EnemyDefinition = Readonly<{
  id: string;
  displayName: string;
  glyph: string;
  rarity: MonsterRarity;
  monsterLevel: number;
  hp: number;
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  luck: number;
  exp: number;
  gold: number;
  gemDropChance: number;
  orbDropChance: number;
  specialChance: number;
  attackType: 'physical' | 'magic';
  quote: string;
}>;

export type JobDefinition = Readonly<{
  id: string;
  displayName: string;
  skillName: string;
  skillDescription: string;
  growth: StatValues;
  unlock?: 'always' | 'job-change-10' | 'pet-10';
}>;

export type BattleTurn = Readonly<{
  turn: number;
  playerDamage: number;
  playerExtraDamage: number;
  enemyDamage: number;
  petDamage: number;
  heal: number;
  critical: boolean;
  dodged: boolean;
  enemySpecial: boolean;
  playerHpAfter: number;
  enemyHpAfter: number;
  logs: readonly string[];
}>;

export type PermanentStatReward = Readonly<{
  stat: StatKey;
  amount: number;
}>;

export type LevelGrowthResult = Readonly<{
  level: number;
  greatGrowth: boolean;
  gains: StatValues;
}>;

export type RewardBreakdownEntry = Readonly<{
  label: string;
  mode: 'base' | 'multiplier' | 'additive' | 'rate';
  value: number;
}>;

export type BattleResult = Readonly<{
  battleIndex: number;
  enemyId: string;
  enemyName: string;
  enemyGlyph: string;
  enemyRarity: MonsterRarity;
  mutated: boolean;
  outcome: 'victory' | 'draw' | 'defeat';
  turns: readonly BattleTurn[];
  playerHpStart: number;
  playerHpRemaining: number;
  playerHpMax: number;
  enemyHpMax: number;
  enemyHpRemaining: number;
  goldDelta: number;
  expGained: number;
  goldBreakdown: readonly RewardBreakdownEntry[];
  expBreakdown: readonly RewardBreakdownEntry[];
  gemGained: number;
  streak: number;
  streakMultiplier: number;
  jackpotMultiplier: number;
  permanentStatReward: PermanentStatReward | null;
  levelGrowths: readonly LevelGrowthResult[];
  droppedItemInstanceId: string | null;
  droppedOrbInstanceId: string | null;
  firstDefeat: boolean;
  capturedPetEnemyId: string | null;
  droppedTitleId: string | null;
  titleCopyAdded: boolean;
}>;

export type PlayerProgress = Readonly<{
  name: string;
  level: number;
  exp: number;
  currentHp: number;
  jobId: string;
  totalJobChanges: number;
  jobBonusCounts: Readonly<Record<string, number>>;
  growthBonusPct: number;
  baseStats: StatValues;
  permanentStats: StatValues;
  petCount: number;
}>;

export type PermanentUpgradeState = Readonly<{
  freeCooldownSkips: boolean;
  cooldownReduction: boolean;
  expMultiplier: boolean;
  goldMultiplier: boolean;
  orbDropMultiplier: boolean;
  drawExpMultiplier: boolean;
}>;

export type MinuteVanguardGameData = Readonly<{
  player: PlayerProgress;
  battleCooldown: CooldownState;
  inventory: InventoryState<EquipmentData>;
  loadout: LoadoutState;
  totalBattles: number;
  victories: number;
  draws: number;
  defeats: number;
  killCounts: Readonly<Record<string, number>>;
  encounterCounts: Readonly<Record<string, number>>;
  mutatedEncounterCounts: Readonly<Record<string, number>>;
  discoveredEnemyIds: readonly string[];
  lastDefeatedEnemyId: string | null;
  consecutiveDefeats: number;
  nextItemSequence: number;
  lastBattle: BattleResult | null;
  rareGuaranteeActive: boolean;
  battleBoostActive: boolean;
  permanentUpgrades: PermanentUpgradeState;
  freeCooldownSkipUsage: Readonly<{ dayKey: string; used: number }>;
  ownedPetEnemyIds: readonly string[];
  activePetEnemyIds: readonly string[];
  orbCapacity: number;
  timeBoosts: TimeBoostState;
  titles: ProgressiveTitleCollectionState;
  favoriteTitleIds: readonly string[];
  titleShop: TitleShopState;
  missionProgress: DailyMissionProgress;
}>;

export type MinuteVanguardState = GameState<MinuteVanguardGameData>;

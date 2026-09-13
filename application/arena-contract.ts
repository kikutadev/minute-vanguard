import type { ArenaBattleOutcome, ArenaBattleSide, ArenaBattleTurn, ArenaJobId, ArenaLoadout, ArenaPetLoadout } from './arena-domain';

export type ArenaPlayerView = Readonly<{
  playerId: string;
  displayName: string;
  jobId: ArenaJobId;
  rating: number;
  bestRating: number;
  seasonKey: string;
  seasonScore: number;
  seasonAttackScore: number;
  seasonDefenseScore: number;
  wins: number;
  losses: number;
  draws: number;
  nextAttackAtMs: number;
  barrierUntilMs: number;
  barrierEnabled: boolean;
  loadout: ArenaLoadout;
  pets: ArenaPetLoadout;
  rank: number | null;
  tierId: string;
  tierName: string;
  nextTierName: string | null;
  nextTierScore: number | null;
}>;

export type ArenaLeaderboardEntry = Readonly<{
  rank: number;
  playerId: string;
  displayName: string;
  jobId: ArenaJobId;
  rating: number;
  bestRating: number;
  seasonScore: number;
  wins: number;
  losses: number;
  draws: number;
  isChampion: boolean;
}>;

export type ArenaBattleOpponent = Readonly<{
  playerId: string;
  displayName: string;
  jobId: ArenaJobId;
  ratingBefore: number;
  isBot: boolean;
  loadout: ArenaLoadout;
  pets: ArenaPetLoadout;
}>;

export type ArenaMatchType = 'random' | 'challenge';

export type ArenaBattleResult = Readonly<{
  battleId: string;
  matchType: ArenaMatchType;
  combatVersion: number;
  resolvedAtMs: number;
  seed: number;
  outcome: ArenaBattleOutcome;
  firstSide: ArenaBattleSide;
  attackerMaxHp: number;
  defenderMaxHp: number;
  attackerHpAfter: number;
  defenderHpAfter: number;
  turns: readonly ArenaBattleTurn[];
  opponent: ArenaBattleOpponent;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
  seasonScoreGain: number;
  seasonScoreAfter: number;
  weekendMultiplier: 1 | 2;
  nextAttackAtMs: number;
}>;

export type ArenaHistoryEntry = Readonly<{
  battleId: string;
  matchType: ArenaMatchType;
  resolvedAtMs: number;
  role: 'attack' | 'defense';
  opponentName: string;
  opponentJobId: ArenaJobId;
  outcome: ArenaBattleOutcome;
  ratingDelta: number;
  scoreGain: number;
}>;


export type ArenaSeasonRewardReceipt = Readonly<{
  receiptId: string;
  seasonKey: string;
  rank: number;
  tierId: string;
  gold: number;
  gems: number;
  baseGold: number;
  baseGems: number;
  championBonusGold: number;
  championBonusGems: number;
  grantsMasterToken: boolean;
  champion: boolean;
}>;

export type ArenaHallEntry = Readonly<{
  seasonKey: string;
  finalizedAtMs: number;
  participantCount: number;
  playerId: string;
  displayName: string;
  jobId: ArenaJobId;
  rating: number;
  seasonScore: number;
}>;

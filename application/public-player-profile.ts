import type { PublicPlayerSnapshot } from 'idle-game-kit';
import { itemDefinitions } from '../definitions/game-definitions';
import type { MinuteVanguardState } from '../definitions/types';

export const MINUTE_VANGUARD_GAME_ID = 'minute-vanguard';
export const MINUTE_VANGUARD_PUBLIC_PROFILE_SCHEMA_VERSION = 1;

export type MinuteVanguardPublicData = Readonly<{
  level: number;
  jobId: string;
  totalJobChanges: number;
  totalBattles: number;
  victories: number;
  discoveredEnemyCount: number;
  ownedPetCount: number;
  equippedWeaponName: string | null;
  equippedArmorName: string | null;
  equippedOrbRank: string | null;
}>;

/** Build only the fields we are willing to show to another player. */
export function createMinuteVanguardPublicData(state: MinuteVanguardState): MinuteVanguardPublicData {
  const equipped = state.gameData.loadout.equipped;
  const weapon = equipped.weapon == null ? undefined : state.gameData.inventory[equipped.weapon];
  const armor = equipped.armor == null ? undefined : state.gameData.inventory[equipped.armor];
  const orb = equipped.orb == null ? undefined : state.gameData.inventory[equipped.orb];
  return {
    level: state.gameData.player.level,
    jobId: state.gameData.player.jobId,
    totalJobChanges: state.gameData.player.totalJobChanges,
    totalBattles: state.gameData.totalBattles,
    victories: state.gameData.victories,
    discoveredEnemyCount: state.gameData.discoveredEnemyIds.length,
    ownedPetCount: state.gameData.ownedPetEnemyIds.length,
    equippedWeaponName: weapon === undefined ? null : itemDefinitions[weapon.definitionId]?.displayName ?? null,
    equippedArmorName: armor === undefined ? null : itemDefinitions[armor.definitionId]?.displayName ?? null,
    equippedOrbRank: orb?.data?.orbRank ?? null,
  };
}

export function createMinuteVanguardPublicSnapshot(args: Readonly<{
  state: MinuteVanguardState;
  playerId: string;
  revision: number;
  updatedAtMs: number;
}>): PublicPlayerSnapshot<MinuteVanguardPublicData> {
  return {
    gameId: MINUTE_VANGUARD_GAME_ID,
    playerId: args.playerId,
    displayName: args.state.gameData.player.name,
    schemaVersion: MINUTE_VANGUARD_PUBLIC_PROFILE_SCHEMA_VERSION,
    revision: args.revision,
    updatedAtMs: args.updatedAtMs,
    data: createMinuteVanguardPublicData(args.state),
  };
}

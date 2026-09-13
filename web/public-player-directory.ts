import type { PublicPlayerDirectoryReader } from 'idle-game-kit';
import { CloudflarePublicPlayerDirectory } from 'idle-game-kit/cloudflare';
import type { MinuteVanguardPublicData } from '../application/public-player-profile';
import { PUBLIC_PLAYER_API_BASE_URL } from './public-player-online';

/** Optional capability: absence of configuration means normal solo mode. */
export const publicPlayerDirectory: PublicPlayerDirectoryReader<MinuteVanguardPublicData> =
  new CloudflarePublicPlayerDirectory<MinuteVanguardPublicData>({ apiBaseUrl: PUBLIC_PLAYER_API_BASE_URL });

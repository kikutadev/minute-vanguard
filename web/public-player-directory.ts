import type { PublicPlayerDirectoryReader } from 'idle-game-kit';
import { CloudflarePublicPlayerDirectory } from 'idle-game-kit/cloudflare';
import type { MinuteVanguardPublicData } from '../application/public-player-profile';

/** Optional capability: absence of configuration means normal solo mode. */
export const publicPlayerDirectory: PublicPlayerDirectoryReader<MinuteVanguardPublicData> | null = (() => {
  const configuredApiBaseUrl = import.meta.env.VITE_PUBLIC_PLAYER_API_BASE_URL?.trim();
  const apiBaseUrl = configuredApiBaseUrl || (import.meta.env.DEV ? '/api' : '');
  if (!apiBaseUrl) return null;
  return new CloudflarePublicPlayerDirectory<MinuteVanguardPublicData>({ apiBaseUrl });
})();

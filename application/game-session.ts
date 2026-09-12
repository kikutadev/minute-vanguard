import { IndexedDbProfileRepository } from 'idle-game-kit/web';
import type { StoredProfile } from 'idle-game-kit';
import type { MinuteVanguardState } from '../definitions/types';
import { advanceFromWallClock, createInitialState } from '../plugin/engine';

const PROFILE_ID = 'main';

export class GameSession {
  readonly #repository = new IndexedDbProfileRepository<MinuteVanguardState>({
    dbName: 'minute-vanguard',
  });

  async load(nowMs = Date.now()): Promise<MinuteVanguardState> {
    const stored = await this.#repository.load(PROFILE_ID);
    if (stored === null) {
      const initial = createInitialState(nowMs);
      await this.save(initial, nowMs);
      return initial;
    }
    const advanced = advanceFromWallClock(stored.state, nowMs);
    if (advanced.state !== stored.state) await this.save(advanced.state, nowMs);
    return advanced.state;
  }

  async save(state: MinuteVanguardState, savedAtMs = Date.now()): Promise<void> {
    const profile: StoredProfile<MinuteVanguardState> = {
      profileId: PROFILE_ID,
      savedAtMs,
      state,
    };
    await this.#repository.save(profile);
  }

  async reset(nowMs = Date.now()): Promise<MinuteVanguardState> {
    await this.#repository.delete(PROFILE_ID);
    const initial = createInitialState(nowMs);
    await this.save(initial, nowMs);
    return initial;
  }
}

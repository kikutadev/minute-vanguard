CREATE TABLE IF NOT EXISTS arena_seasons (
  game_id TEXT NOT NULL,
  season_key TEXT NOT NULL,
  finalized_at_ms INTEGER NOT NULL,
  participant_count INTEGER NOT NULL,
  champion_player_id TEXT,
  champion_display_name TEXT,
  champion_job_id TEXT,
  champion_rating INTEGER,
  champion_score INTEGER,
  PRIMARY KEY (game_id, season_key)
);

CREATE TABLE IF NOT EXISTS arena_season_results (
  game_id TEXT NOT NULL,
  season_key TEXT NOT NULL,
  player_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  job_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  season_score INTEGER NOT NULL,
  wins INTEGER NOT NULL,
  losses INTEGER NOT NULL,
  draws INTEGER NOT NULL,
  tier_id TEXT NOT NULL,
  reward_gold INTEGER NOT NULL,
  reward_gems INTEGER NOT NULL,
  master_token INTEGER NOT NULL DEFAULT 0,
  champion_bonus_gold INTEGER NOT NULL DEFAULT 0,
  champion_bonus_gems INTEGER NOT NULL DEFAULT 0,
  receipt_id TEXT NOT NULL,
  claimed_at_ms INTEGER,
  PRIMARY KEY (game_id, season_key, player_id),
  UNIQUE (receipt_id)
);
CREATE INDEX IF NOT EXISTS idx_arena_season_results_player
  ON arena_season_results(game_id, player_id, season_key DESC);
CREATE INDEX IF NOT EXISTS idx_arena_seasons_recent
  ON arena_seasons(game_id, season_key DESC);

CREATE TABLE IF NOT EXISTS arena_players (
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  job_id TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 1000,
  best_rating INTEGER NOT NULL DEFAULT 1000,
  season_key TEXT NOT NULL,
  season_score INTEGER NOT NULL DEFAULT 0,
  season_attack_score INTEGER NOT NULL DEFAULT 0,
  season_defense_score INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  next_attack_at_ms INTEGER NOT NULL DEFAULT 0,
  barrier_until_ms INTEGER NOT NULL DEFAULT 0,
  barrier_enabled INTEGER NOT NULL DEFAULT 1,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  PRIMARY KEY (game_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_arena_players_season_score
  ON arena_players (game_id, season_key, season_score DESC, rating DESC, updated_at_ms ASC, player_id ASC);

CREATE INDEX IF NOT EXISTS idx_arena_players_matchmaking
  ON arena_players (game_id, season_key, rating, barrier_until_ms, player_id);

CREATE TABLE IF NOT EXISTS arena_daily_wins (
  game_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  attacker_id TEXT NOT NULL,
  defender_id TEXT NOT NULL,
  win_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id, day_key, attacker_id, defender_id)
);

CREATE INDEX IF NOT EXISTS idx_arena_daily_wins_attacker
  ON arena_daily_wins (game_id, day_key, attacker_id);

CREATE TABLE IF NOT EXISTS arena_battles (
  game_id TEXT NOT NULL,
  battle_id TEXT NOT NULL,
  season_key TEXT NOT NULL,
  resolved_at_ms INTEGER NOT NULL,
  attacker_id TEXT NOT NULL,
  attacker_name TEXT NOT NULL,
  attacker_job_id TEXT NOT NULL,
  defender_id TEXT NOT NULL,
  defender_name TEXT NOT NULL,
  defender_job_id TEXT NOT NULL,
  defender_is_bot INTEGER NOT NULL DEFAULT 0,
  attacker_outcome TEXT NOT NULL,
  attacker_rating_delta INTEGER NOT NULL DEFAULT 0,
  defender_rating_delta INTEGER NOT NULL DEFAULT 0,
  attacker_score_gain INTEGER NOT NULL DEFAULT 0,
  defender_score_gain INTEGER NOT NULL DEFAULT 0,
  combat_version INTEGER NOT NULL,
  seed INTEGER NOT NULL,
  result_json TEXT NOT NULL,
  PRIMARY KEY (game_id, battle_id)
);

CREATE INDEX IF NOT EXISTS idx_arena_battles_attacker
  ON arena_battles (game_id, attacker_id, resolved_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_arena_battles_defender
  ON arena_battles (game_id, defender_id, resolved_at_ms DESC);

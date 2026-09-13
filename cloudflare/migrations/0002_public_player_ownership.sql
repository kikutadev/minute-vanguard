CREATE TABLE IF NOT EXISTS public_player_owners (
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  last_publish_at_ms INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (game_id, player_id)
);

CREATE TABLE IF NOT EXISTS public_player_claim_limits (
  ip_hash TEXT NOT NULL PRIMARY KEY,
  window_start_ms INTEGER NOT NULL,
  claim_count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_public_player_owners_publish
  ON public_player_owners (game_id, last_publish_at_ms);

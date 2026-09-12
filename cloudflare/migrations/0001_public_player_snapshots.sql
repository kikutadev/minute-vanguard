CREATE TABLE IF NOT EXISTS public_player_snapshots (
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (game_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_public_player_snapshots_game_updated
  ON public_player_snapshots (game_id, updated_at_ms DESC, player_id ASC);

ALTER TABLE arena_players ADD COLUMN arena_weapon_id TEXT NOT NULL DEFAULT 'arena.weapon.vanguard-blade';
ALTER TABLE arena_players ADD COLUMN arena_armor_id TEXT NOT NULL DEFAULT 'arena.armor.guard-plate';
ALTER TABLE arena_players ADD COLUMN arena_orb_id TEXT NOT NULL DEFAULT 'arena.orb.balance';

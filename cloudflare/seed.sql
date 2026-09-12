DELETE FROM public_player_snapshots WHERE game_id = 'minute-vanguard';

INSERT INTO public_player_snapshots
  (game_id, player_id, display_name, schema_version, revision, updated_at_ms, payload_json)
VALUES
  ('minute-vanguard', 'local-001', 'Brass Finch', 1, 3, 1789220400000, '{"level":27,"jobId":"job.warrior","totalJobChanges":2,"totalBattles":184,"victories":161,"discoveredEnemyCount":23,"ownedPetCount":4,"equippedWeaponName":"Watchblade","equippedArmorName":"Brass Mail","equippedOrbRank":"B"}'),
  ('minute-vanguard', 'local-002', 'Night Courier', 1, 2, 1789216800000, '{"level":19,"jobId":"job.mage","totalJobChanges":1,"totalBattles":102,"victories":87,"discoveredEnemyCount":18,"ownedPetCount":2,"equippedWeaponName":"Copper Staff","equippedArmorName":"Padded Coat","equippedOrbRank":"C"}'),
  ('minute-vanguard', 'local-003', 'Bell Warden', 1, 5, 1789213200000, '{"level":42,"jobId":"job.tamer","totalJobChanges":5,"totalBattles":492,"victories":438,"discoveredEnemyCount":31,"ownedPetCount":9,"equippedWeaponName":"Bronze Glaive","equippedArmorName":"Sentry Plate","equippedOrbRank":"A"}');

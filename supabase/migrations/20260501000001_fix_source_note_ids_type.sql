-- Kairos genera IDs de sesión tipo "sess_ft8d1ccks6" (no UUIDs).
-- La columna estaba mal tipada como uuid[], lo que hace que el bridge sync
-- falle silenciosamente con "invalid input syntax for type uuid".
alter table spark_topics
  alter column source_note_ids type text[]
  using source_note_ids::text[];

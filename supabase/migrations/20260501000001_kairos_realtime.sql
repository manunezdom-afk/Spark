-- Habilitar Realtime en kairos_snapshots para que Spark reciba
-- notificaciones automáticas cuando Kairos guarda un nuevo snapshot.
-- REPLICA IDENTITY FULL es necesario para que el payload incluya
-- los valores anteriores y nuevos (requerido por supabase_realtime).

ALTER TABLE kairos_snapshots REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'kairos_snapshots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE kairos_snapshots;
  END IF;
END $$;

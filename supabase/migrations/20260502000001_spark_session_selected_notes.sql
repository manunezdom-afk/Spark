-- ============================================================
-- SPARK · selección de material específico por sesión
-- ============================================================
-- Hasta ahora una sesión heredaba todos los `source_note_ids` de
-- sus topics. Esto obliga a estudiar la materia completa.
--
-- Con esta columna el usuario puede elegir un subset de las
-- notas de Kairos que pertenecen al topic (ej: estudiar solo
-- "Arte gótico" dentro de "Artes e ideas") sin tocar el modelo
-- de topics.
--
-- Convención:
--   - selected_note_ids = []  → usa TODO el material del topic
--                                (compatibilidad hacia atrás)
--   - selected_note_ids = [a,b,c] → solo estos apuntes/subapuntes
-- ============================================================

alter table spark_learning_sessions
  add column if not exists selected_note_ids text[] default '{}';

comment on column spark_learning_sessions.selected_note_ids is
  'Subset de IDs de Kairos sessions que limitan el material de estudio. Vacío = todo el universo de los topics seleccionados.';

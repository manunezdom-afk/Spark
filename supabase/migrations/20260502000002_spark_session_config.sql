-- ============================================================
-- SPARK · configuración de sesión (objetivo + intensidad)
-- ============================================================
-- El nuevo flujo de "Nueva sesión" deja al usuario expresar
-- por qué entrena (comprender / memorizar / practicar /
-- preparar prueba) y con qué intensidad (baja / media / alta).
-- Esa metainformación viaja al master system prompt para que
-- Nova adapte el ritmo y la presión.
-- ============================================================

alter table spark_learning_sessions
  add column if not exists objective text default null,
  add column if not exists intensity text default null;

comment on column spark_learning_sessions.objective is
  'Objetivo declarado por el usuario al crear la sesión: comprender | memorizar | practicar | preparar_prueba.';

comment on column spark_learning_sessions.intensity is
  'Intensidad solicitada: baja | media | alta. Modula la presión que aplica Nova.';

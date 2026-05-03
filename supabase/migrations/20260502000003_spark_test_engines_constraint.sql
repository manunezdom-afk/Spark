-- Allow generated tests to be stored as learning sessions.
-- The app already routes test_alternativas/test_desarrollo through /api/tests/*,
-- but the original database check constraint only accepted chat engines.

alter table spark_learning_sessions
  drop constraint if exists spark_learning_sessions_engine_check;

alter table spark_learning_sessions
  add constraint spark_learning_sessions_engine_check
  check (engine in (
    'debugger',
    'devils_advocate',
    'roleplay',
    'bridge_builder',
    'socratic',
    'test_alternativas',
    'test_desarrollo'
  ));

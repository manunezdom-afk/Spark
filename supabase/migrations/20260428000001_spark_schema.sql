-- ============================================================
-- SPARK SCHEMA — AI Learning Engine
-- ============================================================
-- Assumes: auth.users (Supabase Auth), and read access to
-- kairos_notes and focus_calendar_events (cross-schema FKs
-- are soft references; enforce at app layer if in separate DBs)
-- ============================================================

-- ── 0. Extensions ──────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- full-text search on notes

-- ── 1. User Context ─────────────────────────────────────────
-- Stores stable facts about the user that Spark injects into
-- every prompt — avoids the user repeating themselves.
create table spark_user_context (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  career        text,                       -- "Diseño de Modas", "Ing. Software"
  user_role     text,                       -- "Estudiante", "Founder"
  active_projects jsonb default '[]',       -- [{ name, type, deadline }]
  personal_goals  jsonb default '[]',       -- [{ goal, category }]
  learning_style  text check (learning_style in (
    'visual','auditory','kinesthetic','reading_writing'
  )),
  custom_context  text,                     -- freeform notes the user adds
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id)
);

-- ── 2. Topics ────────────────────────────────────────────────
-- Atomic knowledge units extracted from Kairos notes.
-- One session always trains on one or more topics.
create table spark_topics (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  summary         text,                     -- AI-generated 2-sentence summary
  source_note_ids uuid[] default '{}',      -- soft refs to kairos note UUIDs
  tags            text[] default '{}',
  category        text,                     -- "Historia", "Marketing", "Código"
  is_archived     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index spark_topics_user_idx on spark_topics(user_id);
create index spark_topics_tags_idx  on spark_topics using gin(tags);

-- ── 3. Mastery States (SM-2 Algorithm) ──────────────────────
-- One row per (user, topic). Tracks spaced-repetition state.
-- SM-2 fields: ease_factor, interval_days, repetitions.
create table spark_mastery_states (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  topic_id        uuid not null references spark_topics(id) on delete cascade,

  -- 0–100 rolling mastery percentage (weighted avg of session scores)
  mastery_score   smallint default 0 check (mastery_score between 0 and 100),

  -- SM-2 fields
  ease_factor     numeric(4,2) default 2.50,  -- min 1.30
  interval_days   integer      default 1,
  repetitions     integer      default 0,
  last_reviewed_at timestamptz,
  next_review_at   timestamptz default now(),

  -- Aggregate error signal
  total_errors    integer default 0,
  total_sessions  integer default 0,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, topic_id)
);

create index spark_mastery_next_review_idx on spark_mastery_states(user_id, next_review_at);

-- ── 4. Learning Sessions ─────────────────────────────────────
-- One row per engine activation. The envelope for turns/messages.
create table spark_learning_sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  topic_ids   uuid[] not null,              -- can span multiple topics (Bridge Builder)

  engine      text not null check (engine in (
    'debugger',
    'devils_advocate',
    'roleplay',
    'bridge_builder',
    'socratic'
  )),

  status      text default 'active' check (status in ('active','completed','abandoned')),

  -- Roleplay metadata (role Spark assumes)
  persona     text,                         -- "Inversionista Angel", "Cliente difícil"
  scenario    text,                         -- narrative context for roleplay engine

  -- Session outcome (filled on completion)
  score       smallint check (score between 0 and 100),
  feedback    text,                         -- AI-generated session debrief
  errors_found jsonb default '[]',          -- for Debugger: [{ text, explanation }]

  -- Calendar pressure signal injected at session start
  nearest_deadline timestamptz,
  days_to_deadline integer,

  started_at  timestamptz default now(),
  ended_at    timestamptz,
  created_at  timestamptz default now()
);

create index spark_sessions_user_engine_idx on spark_learning_sessions(user_id, engine);
create index spark_sessions_status_idx      on spark_learning_sessions(user_id, status);

-- ── 5. Session Turns ─────────────────────────────────────────
-- Individual message pairs inside a session (chat history).
create table spark_session_turns (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references spark_learning_sessions(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  -- Structured output the UI consumes (flashcard, graph node, quiz item…)
  payload     jsonb,
  turn_index  integer not null,
  created_at  timestamptz default now()
);

create index spark_turns_session_idx on spark_session_turns(session_id, turn_index);

-- ── 6. Error Patterns ────────────────────────────────────────
-- Persistent catalog of conceptual mistakes Spark has identified.
-- Powers the Debugger engine's targeted error injection.
create table spark_error_patterns (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  topic_id        uuid references spark_topics(id) on delete set null,

  error_type      text check (error_type in (
    'conceptual',     -- wrong definition or model
    'causal',         -- wrong cause-effect relationship
    'factual',        -- wrong date, name, number
    'application',    -- misapplied concept to context
    'omission'        -- critical concept the user skips
  )),

  description     text not null,            -- what the error is
  example         text,                     -- AI-generated example of the mistake
  frequency       integer default 1,        -- how many times Spark has observed it
  last_seen_at    timestamptz default now(),
  is_resolved     boolean default false,    -- user has demonstrated mastery over it

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index spark_errors_user_topic_idx on spark_error_patterns(user_id, topic_id);
create index spark_errors_unresolved_idx  on spark_error_patterns(user_id, is_resolved);

-- ── 7. Flashcards ────────────────────────────────────────────
-- Generated by any engine; reviewed via SM-2 independently.
create table spark_flashcards (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  topic_id        uuid references spark_topics(id) on delete set null,
  session_id      uuid references spark_learning_sessions(id) on delete set null,

  front           text not null,
  back            text not null,
  hint            text,

  -- SM-2 per card
  ease_factor     numeric(4,2) default 2.50,
  interval_days   integer      default 1,
  repetitions     integer      default 0,
  last_reviewed_at timestamptz,
  next_review_at   timestamptz default now(),
  mastery_score   smallint default 0 check (mastery_score between 0 and 100),

  is_archived     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index spark_flashcards_user_review_idx on spark_flashcards(user_id, next_review_at)
  where is_archived = false;

-- ── 8. Knowledge Graph ──────────────────────────────────────
-- Nodes and edges for Bridge Builder cross-topic connections.
create table spark_graph_nodes (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  topic_id  uuid references spark_topics(id) on delete cascade,
  label     text not null,
  category  text,
  x_pos     numeric,                        -- layout hint for frontend renderer
  y_pos     numeric,
  created_at timestamptz default now()
);

create table spark_graph_edges (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  source_node_id uuid not null references spark_graph_nodes(id) on delete cascade,
  target_node_id uuid not null references spark_graph_nodes(id) on delete cascade,
  relationship   text,                      -- "refuerza", "contradice", "es base de"
  strength       numeric(3,2) default 0.5 check (strength between 0 and 1),
  created_at     timestamptz default now()
);

create index spark_graph_edges_source_idx on spark_graph_edges(user_id, source_node_id);

-- ── 9. Triggers ─────────────────────────────────────────────
-- Auto-update updated_at on every write.
create or replace function spark_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger spark_user_context_updated
  before update on spark_user_context
  for each row execute function spark_touch_updated_at();

create trigger spark_topics_updated
  before update on spark_topics
  for each row execute function spark_touch_updated_at();

create trigger spark_mastery_states_updated
  before update on spark_mastery_states
  for each row execute function spark_touch_updated_at();

create trigger spark_error_patterns_updated
  before update on spark_error_patterns
  for each row execute function spark_touch_updated_at();

create trigger spark_flashcards_updated
  before update on spark_flashcards
  for each row execute function spark_touch_updated_at();

-- ── 10. Row-Level Security ───────────────────────────────────
alter table spark_user_context     enable row level security;
alter table spark_topics            enable row level security;
alter table spark_mastery_states    enable row level security;
alter table spark_learning_sessions enable row level security;
alter table spark_session_turns     enable row level security;
alter table spark_error_patterns    enable row level security;
alter table spark_flashcards        enable row level security;
alter table spark_graph_nodes       enable row level security;
alter table spark_graph_edges       enable row level security;

-- Users only see their own data
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'spark_user_context','spark_topics','spark_mastery_states',
    'spark_learning_sessions','spark_error_patterns',
    'spark_flashcards','spark_graph_nodes','spark_graph_edges'
  ]
  loop
    execute format(
      'create policy "%s_owner_policy" on %s
       for all using (user_id = auth.uid())
       with check (user_id = auth.uid())',
      tbl, tbl
    );
  end loop;
end;
$$;

-- spark_session_turns: access via session ownership
create policy spark_session_turns_owner_policy
  on spark_session_turns for all
  using (
    exists (
      select 1 from spark_learning_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- spark_graph_edges policy already created in the loop above

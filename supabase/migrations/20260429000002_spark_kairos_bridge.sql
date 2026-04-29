-- Add kairos_subject_id to spark_topics so we can track which Kairos subject each topic came from
alter table spark_topics add column if not exists kairos_subject_id text;
create index if not exists spark_topics_kairos_idx on spark_topics(user_id, kairos_subject_id) where kairos_subject_id is not null;

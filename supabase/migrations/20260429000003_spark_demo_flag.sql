alter table spark_topics add column if not exists is_demo boolean default false;
alter table spark_learning_sessions add column if not exists is_demo boolean default false;

create index if not exists spark_topics_demo_idx on spark_topics(user_id, is_demo);

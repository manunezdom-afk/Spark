-- Add kairos_color to spark_topics to store the Kairos subject's brand color
alter table spark_topics
  add column if not exists kairos_color text;

-- Clean up any duplicate (subject, topic) rows that accumulated from non-idempotent seed runs.
-- Keep the row with the lowest id (earliest insert) for each (subject, topic) pair.
DELETE FROM "curriculum"
WHERE "id" NOT IN (
  SELECT MIN("id")
  FROM "curriculum"
  GROUP BY "subject", "topic"
);

-- Prevent future duplicate (subject, topic) rows.
CREATE UNIQUE INDEX IF NOT EXISTS "curriculum_subject_topic_idx"
  ON "curriculum" ("subject", "topic");
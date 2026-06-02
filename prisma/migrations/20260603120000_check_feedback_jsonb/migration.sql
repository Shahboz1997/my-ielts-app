-- Store examiner feedback as JSONB (was TEXT + JSON.stringify in app code).
ALTER TABLE "Check"
  ALTER COLUMN "feedback" TYPE JSONB
  USING (
    CASE
      WHEN "feedback" IS NULL THEN NULL
      WHEN btrim("feedback") = '' THEN NULL
      ELSE "feedback"::jsonb
    END
  );

-- Analytics: subtopics in errors[], criteria scores, jsonpath / @> filters.
CREATE INDEX "Check_feedback_gin_idx" ON "Check" USING GIN ("feedback" jsonb_path_ops);

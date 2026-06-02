-- Historical: was DEFAULT 2. Superseded by 20260601120000_drop_unused_task_align_credits (DEFAULT 3).
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 2;

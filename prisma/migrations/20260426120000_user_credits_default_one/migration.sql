-- New rows get 1 free check; existing users keep their current balance.
-- Superseded for new installs by 20260601120000_drop_unused_task_align_credits (DEFAULT 3).
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 1;

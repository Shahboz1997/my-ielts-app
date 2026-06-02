-- Remove unused todo-style Task table (study plan uses Check / writing profile, not this model).
DROP TABLE IF EXISTS "Task";

-- Align DB default with Prisma User.credits @default(3) and CREDITS_DEFAULT_NEW_USER.
ALTER TABLE "User" ALTER COLUMN "credits" SET DEFAULT 3;

-- Existing password and OAuth users are treated as already verified.
UPDATE "User"
SET "emailVerified" = COALESCE("emailVerified", "createdAt")
WHERE "emailVerified" IS NULL;

-- DropForeignKey
ALTER TABLE "TelegramLinkToken" DROP CONSTRAINT IF EXISTS "TelegramLinkToken_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "TelegramLinkToken";

-- DropIndex
DROP INDEX IF EXISTS "User_telegramChatId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "telegramChatId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "telegramLinkedAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "practiceRemindersTelegramEnabled";

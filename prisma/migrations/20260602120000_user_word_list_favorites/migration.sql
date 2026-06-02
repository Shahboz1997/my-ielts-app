-- CreateTable
CREATE TABLE "WordListItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wordKey" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "taskType" TEXT,
    "source" TEXT,
    "note" TEXT,
    "synonyms" JSONB NOT NULL DEFAULT '[]',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteTemplate" (
    "userId" TEXT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteTemplate_pkey" PRIMARY KEY ("userId","templateId")
);

-- CreateIndex
CREATE INDEX "WordListItem_userId_addedAt_idx" ON "WordListItem"("userId", "addedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "WordListItem_userId_wordKey_key" ON "WordListItem"("userId", "wordKey");

-- AddForeignKey
ALTER TABLE "WordListItem" ADD CONSTRAINT "WordListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteTemplate" ADD CONSTRAINT "FavoriteTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

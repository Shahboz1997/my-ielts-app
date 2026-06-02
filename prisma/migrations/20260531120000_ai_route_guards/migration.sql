-- CreateTable
CREATE TABLE "GuestCheckQuota" (
    "ipHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestCheckQuota_pkey" PRIMARY KEY ("ipHash")
);

-- CreateTable
CREATE TABLE "AiRateLimitBucket" (
    "bucketKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRateLimitBucket_pkey" PRIMARY KEY ("bucketKey")
);

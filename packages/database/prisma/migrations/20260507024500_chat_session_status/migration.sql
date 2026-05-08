-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChatSession_userId_status_updatedAt_idx" ON "ChatSession"("userId", "status", "updatedAt");

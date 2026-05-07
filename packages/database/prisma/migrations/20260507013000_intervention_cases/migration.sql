-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('TRIAGE', 'ACTIVE', 'MONITORING', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'STANDARD', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CaseActionType" AS ENUM ('HUMAN_REVIEW', 'WELLBEING_CHECKIN', 'WORKLOAD_ADJUSTMENT', 'MANAGER_ALIGNMENT', 'CONSENT_REVIEW', 'EXTERNAL_REFERRAL', 'CASE_CLOSED');

-- CreateEnum
CREATE TYPE "CaseNoteVisibility" AS ENUM ('INTERNAL', 'AUDIT_ONLY');

-- CreateTable
CREATE TABLE "InterventionCase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "alertId" TEXT,
    "teamId" TEXT,
    "subjectUserId" TEXT,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "nextStep" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'TRIAGE',
    "priority" "CasePriority" NOT NULL DEFAULT 'STANDARD',
    "dueAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterventionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseNote" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "visibility" "CaseNoteVisibility" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAction" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "CaseActionType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterventionCase_alertId_key" ON "InterventionCase"("alertId");

-- CreateIndex
CREATE INDEX "InterventionCase_organizationId_status_idx" ON "InterventionCase"("organizationId", "status");

-- CreateIndex
CREATE INDEX "InterventionCase_teamId_status_idx" ON "InterventionCase"("teamId", "status");

-- CreateIndex
CREATE INDEX "InterventionCase_ownerId_status_idx" ON "InterventionCase"("ownerId", "status");

-- CreateIndex
CREATE INDEX "InterventionCase_priority_idx" ON "InterventionCase"("priority");

-- CreateIndex
CREATE INDEX "InterventionCase_dueAt_idx" ON "InterventionCase"("dueAt");

-- CreateIndex
CREATE INDEX "CaseNote_caseId_createdAt_idx" ON "CaseNote"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseNote_authorId_createdAt_idx" ON "CaseNote"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseAction_caseId_createdAt_idx" ON "CaseAction"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseAction_actorId_createdAt_idx" ON "CaseAction"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseAction_type_idx" ON "CaseAction"("type");

-- AddForeignKey
ALTER TABLE "InterventionCase" ADD CONSTRAINT "InterventionCase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionCase" ADD CONSTRAINT "InterventionCase_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "PreventiveAlert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionCase" ADD CONSTRAINT "InterventionCase_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionCase" ADD CONSTRAINT "InterventionCase_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionCase" ADD CONSTRAINT "InterventionCase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InterventionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseNote" ADD CONSTRAINT "CaseNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAction" ADD CONSTRAINT "CaseAction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InterventionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAction" ADD CONSTRAINT "CaseAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "RoleScopeType" AS ENUM ('PLATFORM', 'ORGANIZATION', 'APPLICATION');

-- AlterTable
ALTER TABLE "role" ADD COLUMN "scopeType" "RoleScopeType" NOT NULL DEFAULT 'PLATFORM';
ALTER TABLE "role" ADD COLUMN "scopeId" TEXT NOT NULL DEFAULT '';

-- DropIndex
DROP INDEX "role_appId_code_key";

-- CreateTable
CREATE TABLE "role_assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "scopeType" "RoleScopeType" NOT NULL DEFAULT 'PLATFORM',
    "scopeId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_assignment_pkey" PRIMARY KEY ("id")
);

-- Backfill platform assignments from the legacy user_role table.
INSERT INTO "role_assignment" ("id", "userId", "roleId", "scopeType", "scopeId", "createdAt")
SELECT
    'role_assignment_' || md5("userId" || ':' || "roleId"),
    "userId",
    "roleId",
    'PLATFORM'::"RoleScopeType",
    '',
    "createdAt"
FROM "user_role"
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE UNIQUE INDEX "role_appId_scopeType_scopeId_code_key" ON "role"("appId", "scopeType", "scopeId", "code");
CREATE INDEX "role_scopeType_scopeId_idx" ON "role"("scopeType", "scopeId");
CREATE UNIQUE INDEX "role_assignment_userId_roleId_scopeType_scopeId_key" ON "role_assignment"("userId", "roleId", "scopeType", "scopeId");
CREATE INDEX "role_assignment_userId_idx" ON "role_assignment"("userId");
CREATE INDEX "role_assignment_roleId_idx" ON "role_assignment"("roleId");
CREATE INDEX "role_assignment_scopeType_scopeId_idx" ON "role_assignment"("scopeType", "scopeId");

-- AddForeignKey
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_assignment" ADD CONSTRAINT "role_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

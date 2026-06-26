-- AlterTable
ALTER TABLE "member" ADD COLUMN     "departmentId" TEXT;

-- CreateTable
CREATE TABLE "department" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "department_organizationId_idx" ON "department"("organizationId");

-- CreateIndex
CREATE INDEX "department_parentId_idx" ON "department"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "department_organizationId_code_key" ON "department"("organizationId", "code");

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

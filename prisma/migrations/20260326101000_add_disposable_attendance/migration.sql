-- CreateEnum
CREATE TYPE "DisposableRecurrenceMode" AS ENUM ('none', 'daily', 'weekly', 'monthly', 'custom');

-- CreateTable
CREATE TABLE "DisposableAttendance" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "eventDateISO" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceMode" "DisposableRecurrenceMode" NOT NULL DEFAULT 'none',
    "recurrenceEndDateISO" TEXT,
    "recurrenceCustomRule" TEXT NOT NULL DEFAULT '',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisposableAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisposableAttendanceResponse" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'public',
    "submittedById" TEXT,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisposableAttendanceResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DisposableAttendance_publicId_key" ON "DisposableAttendance"("publicId");

-- CreateIndex
CREATE INDEX "DisposableAttendance_organizationId_idx" ON "DisposableAttendance"("organizationId");

-- CreateIndex
CREATE INDEX "DisposableAttendance_organizationId_createdAt_idx" ON "DisposableAttendance"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "DisposableAttendanceResponse_attendanceId_createdAt_idx" ON "DisposableAttendanceResponse"("attendanceId", "createdAt");

-- AddForeignKey
ALTER TABLE "DisposableAttendance" ADD CONSTRAINT "DisposableAttendance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisposableAttendanceResponse" ADD CONSTRAINT "DisposableAttendanceResponse_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "DisposableAttendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

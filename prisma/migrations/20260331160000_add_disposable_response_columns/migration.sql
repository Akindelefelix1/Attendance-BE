-- CreateEnum
CREATE TYPE "DisposableResponseStatus" AS ENUM ('preregistered', 'checked_in');

-- AlterTable
ALTER TABLE "DisposableAttendanceResponse"
ADD COLUMN "status" "DisposableResponseStatus" NOT NULL DEFAULT 'checked_in',
ADD COLUMN "emailNormalized" TEXT,
ADD COLUMN "preRegisteredAt" TIMESTAMP(3),
ADD COLUMN "checkedInAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DisposableAttendanceResponse_attendanceId_status_idx" ON "DisposableAttendanceResponse"("attendanceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DisposableAttendanceResponse_attendanceId_emailNormalized_key" ON "DisposableAttendanceResponse"("attendanceId", "emailNormalized");

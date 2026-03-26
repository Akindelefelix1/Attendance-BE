-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'plus', 'pro');

-- CreateEnum
CREATE TYPE "AttendanceEditPolicy" AS ENUM ('any', 'self_only');

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('admin', 'staff');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('manage_organizations', 'manage_staff', 'manage_attendance', 'view_analytics', 'manage_settings');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "staffLoginPasswordHash" TEXT,
    "officeGeoFenceEnabled" BOOLEAN NOT NULL DEFAULT false,
    "officeLatitude" DOUBLE PRECISION,
    "officeLongitude" DOUBLE PRECISION,
    "officeRadiusMeters" INTEGER DEFAULT 150,
    "lateAfterTime" TEXT NOT NULL DEFAULT '09:00',
    "earlyCheckoutBeforeTime" TEXT NOT NULL DEFAULT '17:00',
    "roles" TEXT[],
    "workingDays" INTEGER[],
    "analyticsIncludeFutureDays" BOOLEAN NOT NULL DEFAULT false,
    "attendanceEditPolicy" "AttendanceEditPolicy" NOT NULL DEFAULT 'any',
    "adminEmails" TEXT[],
    "planTier" "PlanTier" NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),
    "appRole" "AppRole" NOT NULL DEFAULT 'staff',
    "permissions" "Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dateISO" TEXT NOT NULL,
    "signInAt" TIMESTAMP(3),
    "signOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "appRole" "AppRole" NOT NULL DEFAULT 'admin',
    "permissions" "Permission"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffMember_organizationId_idx" ON "StaffMember"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_organizationId_email_key" ON "StaffMember"("organizationId", "email");

-- CreateIndex
CREATE INDEX "AttendanceRecord_organizationId_dateISO_idx" ON "AttendanceRecord"("organizationId", "dateISO");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_staffId_dateISO_key" ON "AttendanceRecord"("staffId", "dateISO");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_organizationId_email_key" ON "AdminUser"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


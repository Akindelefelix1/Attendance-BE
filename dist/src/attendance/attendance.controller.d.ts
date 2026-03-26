import { AttendanceService } from "./attendance.service";
import { AttendanceListQueryDto, AttendanceMarkDto } from "./dto/attendance.dto";
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    private assertOrgScope;
    list(query: AttendanceListQueryDto, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        staffId: string;
        dateISO: string;
        signInAt: Date | null;
        signOutAt: Date | null;
    }[]>;
    listForOrganization(orgId: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        staffId: string;
        dateISO: string;
        signInAt: Date | null;
        signOutAt: Date | null;
    }[]>;
    signIn(body: AttendanceMarkDto, req: {
        user?: {
            role?: string;
            id?: string;
        };
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        staffId: string;
        dateISO: string;
        signInAt: Date | null;
        signOutAt: Date | null;
    } | null> | null;
    signOut(body: AttendanceMarkDto, req: {
        user?: {
            role?: string;
            id?: string;
        };
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        staffId: string;
        dateISO: string;
        signInAt: Date | null;
        signOutAt: Date | null;
    } | null> | null;
}

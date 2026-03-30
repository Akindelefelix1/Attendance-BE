import { StaffService } from "./staff.service";
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    private assertOrgScope;
    listByOrganization(orgId: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        fullName: string;
        role: string;
        email: string;
        passwordHash: string | null;
        isVerified: boolean;
        verifyToken: string | null;
        resetToken: string | null;
        resetTokenExp: Date | null;
        appRole: import("@prisma/client").$Enums.AppRole;
        permissions: import("@prisma/client").$Enums.Permission[];
    }[]>;
    create(req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }, body: {
        organizationId: string;
        fullName: string;
        role: string;
        email: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        fullName: string;
        role: string;
        email: string;
        passwordHash: string | null;
        isVerified: boolean;
        verifyToken: string | null;
        resetToken: string | null;
        resetTokenExp: Date | null;
        appRole: import("@prisma/client").$Enums.AppRole;
        permissions: import("@prisma/client").$Enums.Permission[];
    }>;
    update(id: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }, body: {
        fullName?: string;
        role?: string;
        email?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        fullName: string;
        role: string;
        email: string;
        passwordHash: string | null;
        isVerified: boolean;
        verifyToken: string | null;
        resetToken: string | null;
        resetTokenExp: Date | null;
        appRole: import("@prisma/client").$Enums.AppRole;
        permissions: import("@prisma/client").$Enums.Permission[];
    }>;
    remove(id: string, req: {
        user?: {
            orgId?: string;
            role?: string;
        };
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        fullName: string;
        role: string;
        email: string;
        passwordHash: string | null;
        isVerified: boolean;
        verifyToken: string | null;
        resetToken: string | null;
        resetTokenExp: Date | null;
        appRole: import("@prisma/client").$Enums.AppRole;
        permissions: import("@prisma/client").$Enums.Permission[];
    }>;
}

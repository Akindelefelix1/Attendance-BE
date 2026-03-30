import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
import { Prisma } from "@prisma/client";
export declare class StaffService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    listByOrganization(organizationId: string): Prisma.PrismaPromise<{
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
    create(organizationId: string, payload: {
        fullName: string;
        role: string;
        email: string;
    }): Promise<{
        id: string;
        fullName: string;
        role: string;
        email: string;
        organizationId: string;
    }>;
    update(id: string, payload: {
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
    updateInOrg(id: string, organizationId: string, payload: {
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
    remove(id: string): Promise<{
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
    removeInOrg(id: string, organizationId: string): Promise<{
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

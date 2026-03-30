import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../notifications/email.service";
export declare class StaffService {
    private readonly prisma;
    private readonly emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    listByOrganization(organizationId: string): import("@prisma/client").Prisma.PrismaPromise<{
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
    update(id: string, payload: {
        fullName?: string;
        role?: string;
        email?: string;
    }): import("@prisma/client").Prisma.Prisma__StaffMemberClient<{
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateInOrg(id: string, organizationId: string, payload: {
        fullName?: string;
        role?: string;
        email?: string;
    }): import("@prisma/client").Prisma.Prisma__StaffMemberClient<{
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import("@prisma/client").Prisma.Prisma__StaffMemberClient<{
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    removeInOrg(id: string, organizationId: string): import("@prisma/client").Prisma.Prisma__StaffMemberClient<{
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
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}

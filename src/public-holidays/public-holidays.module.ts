import { Module } from "@nestjs/common";
import { PublicHolidaysService } from "./public-holidays.service";
import { PublicHolidaysController } from "./public-holidays.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [PublicHolidaysService],
  controllers: [PublicHolidaysController],
  exports: [PublicHolidaysService]
})
export class PublicHolidaysModule {}

import { Module } from "@nestjs/common";
import { PublicHolidaysService } from "./public-holidays.service";
import { PublicHolidaysController } from "./public-holidays.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [PublicHolidaysService],
  controllers: [PublicHolidaysController],
  exports: [PublicHolidaysService]
})
export class PublicHolidaysModule {}

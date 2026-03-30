import { Module } from "@nestjs/common";
import { DisposableAttendanceController } from "./disposable-attendance.controller";
import { DisposableAttendanceService } from "./disposable-attendance.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [DisposableAttendanceController],
  providers: [DisposableAttendanceService]
})
export class DisposableAttendanceModule {}

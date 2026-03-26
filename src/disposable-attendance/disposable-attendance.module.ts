import { Module } from "@nestjs/common";
import { DisposableAttendanceController } from "./disposable-attendance.controller";
import { DisposableAttendanceService } from "./disposable-attendance.service";

@Module({
  controllers: [DisposableAttendanceController],
  providers: [DisposableAttendanceService]
})
export class DisposableAttendanceModule {}

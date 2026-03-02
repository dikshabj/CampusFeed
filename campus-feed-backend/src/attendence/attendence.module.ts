import { Module } from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { AttendenceController } from './attendence.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
  
@Module({
  imports : [PrismaModule, NotificationsModule],
  providers: [AttendenceService],
  controllers: [AttendenceController]
})
export class AttendenceModule {}

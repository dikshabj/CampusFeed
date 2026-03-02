import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
    imports : [PrismaModule, NotificationsModule],
    controllers: [GradesController],
    providers : [GradesService],
})
export class GradesModule {

}

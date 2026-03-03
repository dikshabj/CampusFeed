import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './common/services/email/email.module';
import { AwsModule } from './aws/aws.module';
import { GradesModule } from './grades/grades.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttendenceModule } from './attendence/attendence.module';
import { TimetableModule } from './timetable/timetable.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    PostsModule,
    PrismaModule,
    EmailModule,
    AwsModule,
    GradesModule,
    NotificationsModule,
    AttendenceModule,
    TimetableModule
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule { }

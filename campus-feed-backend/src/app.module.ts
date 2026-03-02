import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EmailService } from './common/services/email/email.service';
import { EmailModule } from './common/services/email/email.module';
import { AwsModule } from './aws/aws.module';
import { GradesService } from './grades/grades.service';
import { GradesController } from './grades/grades.controller';
import { GradesModule } from './grades/grades.module';
import { NotificationsModule } from './notifications/notifications.module';


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
    NotificationsModule],
  controllers: [AppController, GradesController],
  providers: [AppService, EmailService, GradesService],
  exports:[EmailService],
})
export class AppModule {}

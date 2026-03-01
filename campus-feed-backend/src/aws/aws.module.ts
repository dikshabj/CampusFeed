import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports : [ConfigModule],
  providers: [AwsService],
  exports: [AwsService]
})
export class AwsModule {}

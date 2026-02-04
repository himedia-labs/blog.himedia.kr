import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SnowflakeService } from '@/common/services/snowflake.service';
import { Notification } from '@/notifications/entities/notification.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsController } from '@/notifications/notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, SnowflakeService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

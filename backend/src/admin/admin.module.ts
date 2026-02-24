import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { SnowflakeService } from '../common/services/snowflake.service';
import { AdminAuditLog } from './entities/adminAuditLog.entity';
import { AdminReport } from './entities/adminReport.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminReport, AdminAuditLog, User])],
  controllers: [AdminController],
  providers: [AdminService, SnowflakeService],
})
export class AdminModule {}

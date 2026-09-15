import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemController } from './system.controller.js';
import { SystemService } from './system.service.js';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './interceptors/audit.interceptor.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AuditLog.name, schema: AuditLogSchema }]),
    UsersModule, // For RolesGuard if needed
  ],
  controllers: [SystemController],
  providers: [
    SystemService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class SystemModule {}

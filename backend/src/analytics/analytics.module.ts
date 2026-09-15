import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { Asset, AssetSchema } from '../assets/schemas/asset.schema.js';
import { MovementLog, MovementLogSchema } from '../movements/schemas/movement-log.schema.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: MovementLog.name, schema: MovementLogSchema },
    ]),
    UsersModule, // For RolesGuard
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

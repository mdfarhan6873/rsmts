import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoutingRulesService } from './routing-rules.service.js';
import { RoutingRulesController } from './routing-rules.controller.js';
import { RoutingRule, RoutingRuleSchema } from './schemas/routing-rule.schema.js';
import { AssetCategoriesModule } from '../asset-categories/asset-categories.module.js';
import { LocationsModule } from '../locations/locations.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoutingRule.name, schema: RoutingRuleSchema },
    ]),
    AssetCategoriesModule,
    LocationsModule,
  ],
  controllers: [RoutingRulesController],
  providers: [RoutingRulesService],
  exports: [RoutingRulesService],
})
export class RoutingRulesModule {}

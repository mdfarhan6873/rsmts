import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { RoutingRulesService } from './src/routing-rules/routing-rules.service.js';
import { PipelineOperation } from './src/routing-rules/schemas/routing-rule.schema.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const routingRulesService = app.get(RoutingRulesService);

  console.log('Clearing existing routing rules...');
  await routingRulesService['routingRuleModel'].deleteMany({});

  console.log('Seeding Master Routing Rules...');

  const rules = [
    // WAGON REPAIRING
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_1', remark: 'Authorized wagon repair location for work assigned to WRS_1.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_2', remark: 'Authorized wagon repair location for work assigned to WRS_2.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_3', remark: 'Authorized wagon repair location for work assigned to WRS_3.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_4', remark: 'Authorized wagon repair location for work assigned to WRS_4.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_5', remark: 'Designated QA location for wagon repair inspection.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WHEEL_PARK_LINE', remark: 'Holding location for wagons awaiting wheel sets or component repairs.' },
    
    // WAGON MANUFACTURING
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.MANUFACTURING, locationCode: 'GIF_SHOP', remark: 'Authorized wagon manufacturing location.' },

    // LOCO REPAIRING
    { assetCategoryCode: 'LOCO', pipeline: PipelineOperation.REPAIRING, locationCode: 'DPS', remark: 'Primary diesel locomotive repair shed.' },
    { assetCategoryCode: 'LOCO', pipeline: PipelineOperation.REPAIRING, locationCode: 'ELECTRIC_SHED', remark: 'Primary electric locomotive repair shed.' },

    // CRANE REPAIRING
    { assetCategoryCode: 'CRANE', pipeline: PipelineOperation.REPAIRING, locationCode: 'CRANE_REPAIR_SHOP', remark: 'Dedicated facility for crane repair operations.' },
    
    // CRANE MANUFACTURING
    { assetCategoryCode: 'CRANE', pipeline: PipelineOperation.MANUFACTURING, locationCode: 'CRANE_MANUFACTURING_SHOP', remark: 'Dedicated facility for crane manufacturing operations.' },

    // TOWER CAR REPAIRING
    { assetCategoryCode: 'TOWER_CAR', pipeline: PipelineOperation.REPAIRING, locationCode: 'TOWER_CAR_LINE', remark: 'Designated line for tower car repair and maintenance.' }
  ];

  let pass = true;

  for (const rule of rules) {
    try {
      await routingRulesService.create(rule);
      console.log(`✅ Seeded rule: ${rule.assetCategoryCode} + ${rule.pipeline} -> ${rule.locationCode}`);
    } catch (error: any) {
      console.error(`❌ Failed to seed rule: ${rule.assetCategoryCode} + ${rule.pipeline} -> ${rule.locationCode}. Error: ${error.message}`);
      pass = false;
    }
  }

  // Edge Case Testing
  console.log('\nRunning Validation Edge Case Tests...');
  try {
    await routingRulesService.create({
      assetCategoryCode: 'INVALID_CAT',
      pipeline: PipelineOperation.REPAIRING,
      locationCode: 'WRS_1',
      remark: 'Test',
    });
    console.error('❌ Failed: Accepted invalid asset category.');
    pass = false;
  } catch (e: any) {
    console.log('✅ Passed: Rejected invalid asset category.');
  }

  try {
    await routingRulesService.create({
      assetCategoryCode: 'WAGON',
      pipeline: PipelineOperation.REPAIRING,
      locationCode: 'INVALID_LOC',
      remark: 'Test',
    });
    console.error('❌ Failed: Accepted invalid location code.');
    pass = false;
  } catch (e: any) {
    console.log('✅ Passed: Rejected invalid location code.');
  }

  try {
    await routingRulesService.create({
      assetCategoryCode: 'WAGON',
      pipeline: PipelineOperation.REPAIRING,
      locationCode: 'WAGON_REPAIR', // A GROUP location
      remark: 'Test',
    });
    console.error('❌ Failed: Accepted a GROUP location as a strict destination.');
    pass = false;
  } catch (e: any) {
    console.log('✅ Passed: Rejected mapping to GROUP location.');
  }

  try {
    await routingRulesService.create({
      assetCategoryCode: 'WAGON',
      pipeline: PipelineOperation.REPAIRING,
      locationCode: 'NSY', // A COMMON location
      remark: 'Test',
    });
    console.error('❌ Failed: Accepted a COMMON location for strict mapping.');
    pass = false;
  } catch (e: any) {
    console.log('✅ Passed: Rejected explicit mapping for COMMON location (they are intrinsically permitted).');
  }

  try {
    await routingRulesService.create({
      assetCategoryCode: 'WAGON',
      pipeline: PipelineOperation.MANUFACTURING,
      locationCode: 'WRS-1', // A REPAIRING location
      remark: 'Test',
    });
    console.error('❌ Failed: Allowed MANUFACTURING pipeline on a REPAIRING location.');
    pass = false;
  } catch (e: any) {
    console.log('✅ Passed: Enforced pipeline operation matches location category.');
  }

  if (!pass) {
    console.error('\n❌ SEED FAILED. See errors above.');
    process.exit(1);
  }

  console.log('\n🎉 SEED SUCCESSFUL & VERIFIED!');

  await app.close();
}

bootstrap();

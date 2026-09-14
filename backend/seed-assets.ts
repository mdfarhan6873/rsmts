import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { AssetsService } from './src/assets/assets.service.js';
import { PipelineOperation } from './src/routing-rules/schemas/routing-rule.schema.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const assetsService = app.get(AssetsService);

  console.log('Seeding Master Assets and verifying edge cases...');
  
  // Clean DB
  await assetsService['assetModel'].deleteMany({});
  console.log('Cleared existing assets.');

  // ==========================================
  // Edge Case Testing
  // ==========================================
  let pass = true;

  try {
    await assetsService.registerAsset({
      operation: PipelineOperation.REPAIRING,
      categoryCode: 'BOXNHL',
      assetNumber: '12345ABCDEF', // ALPHANUMERIC instead of NUMERIC
      currentLocationCode: 'WRS_1',
      remark: 'Test alphanumeric failure',
    });
    console.error('❌ Failed: Accepted alphanumeric for numeric category.');
    pass = false;
  } catch(e: any) {
    console.log('✅ Passed: Rejected alphanumeric for numeric category.');
  }

  try {
    await assetsService.registerAsset({
      operation: PipelineOperation.REPAIRING,
      categoryCode: 'BOXNHL',
      assetNumber: '1234567890', // 10 digits instead of 11
      currentLocationCode: 'WRS_1',
      remark: 'Test short length failure',
    });
    console.error('❌ Failed: Accepted incorrect length asset number.');
    pass = false;
  } catch(e: any) {
    console.log('✅ Passed: Rejected incorrect length asset number.');
  }

  try {
    // Test routing failure (CRANE_REPAIR_SHOP for BOXNHL)
    await assetsService.registerAsset({
      operation: PipelineOperation.REPAIRING,
      categoryCode: 'BOXNHL',
      assetNumber: '11111111111',
      currentLocationCode: 'CRANE_REPAIR_SHOP',
      remark: 'Test routing',
    });
    console.error('❌ Failed: Accepted invalid routing location.');
    pass = false;
  } catch(e: any) {
    console.log('✅ Passed: Rejected invalid routing location.');
  }

  try {
    await assetsService.registerAsset({
      operation: PipelineOperation.REPAIRING,
      categoryCode: 'BOXNHL',
      assetNumber: '12345678901',
      currentLocationCode: 'NORTH_YARD', // GROUP location
      remark: 'Test GROUP location',
    });
    console.error('❌ Failed: Accepted GROUP location.');
    pass = false;
  } catch(e: any) {
    console.log('✅ Passed: Rejected GROUP location.');
  }

  if (!pass) {
    console.error('\n❌ Edge case tests failed. Exiting.');
    process.exit(1);
  }

  // ==========================================
  // Production Seed Data
  // ==========================================
  console.log('Seeding initial assets...');

  // 11-digit Wagon
  await assetsService.registerAsset({
    operation: PipelineOperation.REPAIRING,
    categoryCode: 'BOXNHL',
    assetNumber: '12345678901',
    currentLocationCode: 'WRS_1',
    remark: 'Received for repair',
  });

  // 5-digit Loco
  await assetsService.registerAsset({
    operation: PipelineOperation.REPAIRING,
    categoryCode: 'WAP7',
    assetNumber: '12345',
    currentLocationCode: 'DPS',
    remark: 'Routine maintenance',
  });

  // 6-digit Tower Car
  await assetsService.registerAsset({
    operation: PipelineOperation.REPAIRING,
    categoryCode: '8W_DETC',
    assetNumber: '123456',
    currentLocationCode: 'TOWER_CAR_LINE',
    remark: 'Tower car repair',
  });

  const allAssets = await assetsService.findAll();
  console.log(`\n🎉 SEED SUCCESSFUL! Total Assets: ${allAssets.length}`);

  await app.close();
}

bootstrap();

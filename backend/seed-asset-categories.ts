import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { AssetCategoriesService } from './src/asset-categories/asset-categories.service.js';
import { AssetCategoryLevel } from './src/asset-categories/schemas/asset-category.schema.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const assetCategoriesService = app.get(AssetCategoriesService);

  console.log('Seeding Master Asset Categories and verifying edge cases...');
  
  // 0. Clean DB
  await assetCategoriesService['assetCategoryModel'].deleteMany({});
  console.log('Cleared existing asset categories.');

  // ==========================================
  // Edge Case Testing
  // ==========================================
  let pass = true;

  try {
    await assetCategoriesService.create({
      code: 'TEST_GRANDPARENT',
      name: 'Test',
      level: AssetCategoryLevel.GRANDPARENT,
      parentCode: 'SOME_PARENT', // Invalid for GRANDPARENT
    });
    console.error('❌ Failed: GRANDPARENT accepted a parentCode.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: GRANDPARENT rejected parentCode.');
  }

  try {
    await assetCategoriesService.create({
      code: 'TEST_PARENT',
      name: 'Test',
      level: AssetCategoryLevel.PARENT,
      // Missing parentCode
    });
    console.error('❌ Failed: PARENT accepted null parentCode.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: PARENT rejected missing parentCode.');
  }

  await assetCategoriesService.create({
    code: 'TEMP_GRANDPARENT',
    name: 'Temp Grandparent',
    level: AssetCategoryLevel.GRANDPARENT,
  });

  try {
    await assetCategoriesService.create({
      code: 'TEMP_CHILD',
      name: 'Temp Child',
      level: AssetCategoryLevel.CHILD,
      parentCode: 'TEMP_GRANDPARENT', // Invalid, must be PARENT
    });
    console.error('❌ Failed: CHILD accepted GRANDPARENT as parent.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: CHILD rejected GRANDPARENT parent.');
  }

  await assetCategoriesService.create({
    code: 'TEMP_PARENT',
    name: 'Temp Parent',
    level: AssetCategoryLevel.PARENT,
    parentCode: 'TEMP_GRANDPARENT',
  });

  try {
    await assetCategoriesService.update('TEMP_GRANDPARENT', {
      level: AssetCategoryLevel.CHILD,
    });
    console.error('❌ Failed: GRANDPARENT changed level while having children.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: Level mutation prevented if children exist.');
  }

  // Clear DB again
  await assetCategoriesService['assetCategoryModel'].deleteMany({});
  console.log('Finished testing edge cases. DB cleared for actual seeding.');

  // ==========================================
  // Production Seed Data
  // ==========================================
  console.log('Seeding GRANDPARENTS...');
  
  await assetCategoriesService.create({
    code: 'WAGON',
    name: 'Wagon',
    level: AssetCategoryLevel.GRANDPARENT,
    identificationRule: { type: 'NUMERIC' as any, length: 11, checkDigit: false }
  });

  await assetCategoriesService.create({
    code: 'LOCO',
    name: 'Loco',
    level: AssetCategoryLevel.GRANDPARENT,
    identificationRule: { type: 'NUMERIC' as any, length: 5, checkDigit: false }
  });

  await assetCategoriesService.create({
    code: 'CRANE',
    name: 'Crane',
    level: AssetCategoryLevel.GRANDPARENT,
    identificationRule: { type: 'NUMERIC' as any, length: 6, checkDigit: false }
  });

  await assetCategoriesService.create({
    code: 'TOWER_CAR',
    name: 'Tower Car',
    level: AssetCategoryLevel.GRANDPARENT,
  });

  console.log('Seeding PARENTS...');
  const wagonParents = ['BOXNHL', 'BCNHL', 'BVZI', 'BTPN', 'BOBRN', 'BCNA', 'FMP', 'BLC'];
  for (const code of wagonParents) {
    await assetCategoriesService.create({ code, name: code, level: AssetCategoryLevel.PARENT, parentCode: 'WAGON' });
  }

  const locoParents = ['WAP7', 'WAG9', 'WDG4'];
  for (const code of locoParents) {
    await assetCategoriesService.create({ code, name: code, level: AssetCategoryLevel.PARENT, parentCode: 'LOCO' });
  }

  const craneParents = ['140T_CRANE', '175T_CRANE'];
  for (const code of craneParents) {
    await assetCategoriesService.create({ code, name: code.replace('_', ' '), level: AssetCategoryLevel.PARENT, parentCode: 'CRANE' });
  }

  await assetCategoriesService.create({
    code: '8W_DETC',
    name: '8W DETC',
    level: AssetCategoryLevel.PARENT,
    parentCode: 'TOWER_CAR',
    identificationRule: { type: 'NUMERIC' as any, length: 6, checkDigit: false }
  });

  await assetCategoriesService.create({
    code: '4W_DHTC',
    name: '4W DHTC',
    level: AssetCategoryLevel.PARENT,
    parentCode: 'TOWER_CAR',
    identificationRule: { type: 'NUMERIC' as any, length: 3, checkDigit: false }
  });

  console.log('Seeding CHILDREN...');
  const craneChildren = [
    { code: '140T_GOTTWALD', name: '140T Gottwald', parentCode: '140T_CRANE' },
    { code: '175T_HYDRAULIC', name: '175T Hydraulic', parentCode: '175T_CRANE' },
  ];
  for (const child of craneChildren) {
    await assetCategoriesService.create({
      code: child.code,
      name: child.name,
      level: AssetCategoryLevel.CHILD,
      parentCode: child.parentCode,
    });
  }

  console.log('Verifying comprehensive coverage...');
  const allCategories = await assetCategoriesService.findAll();
  const allCodes = new Set(allCategories.map(c => c.code));

  const expectedCodes = [
    'WAGON', 'BOXNHL', 'BCNHL', 'BVZI', 'BTPN', 'BOBRN', 'BCNA', 'FMP', 'BLC',
    'LOCO', 'WAP7', 'WAG9', 'WDG4',
    'CRANE', '140T_CRANE', '140T_GOTTWALD', '175T_CRANE', '175T_HYDRAULIC',
    'TOWER_CAR', '8W_DETC', '4W_DHTC'
  ];

  let missing = false;
  for (const code of expectedCodes) {
    if (!allCodes.has(code)) {
      console.error(`❌ Missing expected category: ${code}`);
      missing = true;
    }
  }

  // Check for unexpected
  for (const code of allCodes) {
    if (!expectedCodes.includes(code)) {
      console.error(`❌ Found unexpected category: ${code}`);
      missing = true;
    }
  }

  if (missing) {
    console.error('\\n❌ Final assertion failed. Check the errors above.\\n');
    process.exit(1);
  }

  console.log(`\n🎉 SEED SUCCESSFUL & VERIFIED! Total Categories: ${allCategories.length}`);
  
  await app.close();
}

bootstrap();

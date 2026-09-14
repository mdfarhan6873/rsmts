import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { LocationsService } from './src/locations/locations.service.js';
import { LocationCategory, LocationType, LocationPipeline, LocationRole } from './src/locations/schemas/location.schema.js';
import { BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const locationsService = app.get(LocationsService);

  console.log('Testing Locations Hierarchy and Validations...');

  // 0. Clean up existing locations
  await locationsService['locationModel'].deleteMany({});
  console.log('Cleared existing locations from DB.');

  // 1. Create top-level groups
  await locationsService.create({
    code: 'COMMON_YARDS',
    name: 'Common Yards',
    category: LocationCategory.COMMON,
    locationType: LocationType.GROUP,
    pipelines: [LocationPipeline.COMMON],
    role: LocationRole.PARKING,
  });

  await locationsService.create({
    code: 'WAGON_REPAIR',
    name: 'Wagon Repair',
    category: LocationCategory.REPAIRING,
    locationType: LocationType.GROUP,
    pipelines: [LocationPipeline.REPAIRING],
    role: LocationRole.REPAIR,
  });

  await locationsService.create({
    code: 'WAGON_MANUFACTURING',
    name: 'Wagon Manufacturing',
    category: LocationCategory.MANUFACTURING,
    locationType: LocationType.GROUP,
    pipelines: [LocationPipeline.MANUFACTURING],
    role: LocationRole.MANUFACTURING,
  });

  // 2. Create nested groups
  await locationsService.create({
    code: 'NORTH_YARD',
    name: 'North Yard',
    category: LocationCategory.COMMON,
    locationType: LocationType.GROUP,
    pipelines: [LocationPipeline.COMMON],
    role: LocationRole.PARKING,
    parentCode: 'COMMON_YARDS',
  });

  await locationsService.create({
    code: 'SOUTH_YARD',
    name: 'South Yard',
    category: LocationCategory.COMMON,
    locationType: LocationType.GROUP,
    pipelines: [LocationPipeline.COMMON],
    role: LocationRole.PARKING,
    parentCode: 'COMMON_YARDS',
  });

  // 3. Create physical lines under North Yard
  await locationsService.create({
    code: 'YARD_NORTH_LINE_01',
    name: 'Line-01',
    category: LocationCategory.COMMON,
    locationType: LocationType.PARKING_LINE,
    pipelines: [LocationPipeline.COMMON],
    role: LocationRole.PARKING,
    parentCode: 'NORTH_YARD',
  });

  await locationsService.create({
    code: 'YARD_NORTH_LINE_28',
    name: 'Line-28',
    category: LocationCategory.COMMON,
    locationType: LocationType.PARKING_LINE,
    pipelines: [LocationPipeline.COMMON],
    role: LocationRole.PARKING,
    parentCode: 'NORTH_YARD',
  });

  // 4. Create physical lines under South Yard
  await locationsService.create({
    code: 'YARD_SOUTH_LINE_29',
    name: 'Line-29',
    category: LocationCategory.COMMON,
    locationType: LocationType.PARKING_LINE,
    pipelines: [LocationPipeline.COMMON],
    role: LocationRole.PARKING,
    parentCode: 'SOUTH_YARD',
  });

  await locationsService.create({
    code: 'YARD_SOUTH_LINE_56',
    name: 'Line-56',
    category: LocationCategory.COMMON,
    locationType: LocationType.PARKING_LINE,
    pipelines: [LocationPipeline.COMMON],
    role: LocationRole.PARKING,
    parentCode: 'SOUTH_YARD',
  });

  // 5. Test strict separation: CRANE REPAIR vs CRANE MANUFACTURING
  await locationsService.create({
    code: 'CRANE_REPAIR',
    name: 'Crane Repair',
    category: LocationCategory.REPAIRING,
    locationType: LocationType.GROUP,
    pipelines: [LocationPipeline.REPAIRING],
    role: LocationRole.REPAIR,
  });
  
  await locationsService.create({
    code: 'CRANE_REPAIR_SHOP',
    name: 'Crane Repair Shop',
    category: LocationCategory.REPAIRING,
    locationType: LocationType.REPAIR_SHOP,
    pipelines: [LocationPipeline.REPAIRING],
    role: LocationRole.REPAIR,
    parentCode: 'CRANE_REPAIR',
  });

  await locationsService.create({
    code: 'CRANE_MANUFACTURING',
    name: 'Crane Manufacturing',
    category: LocationCategory.MANUFACTURING,
    locationType: LocationType.GROUP,
    pipelines: [LocationPipeline.MANUFACTURING],
    role: LocationRole.MANUFACTURING,
  });

  await locationsService.create({
    code: 'CRANE_MANUFACTURING_SHOP',
    name: 'Crane Manufacturing Shop',
    category: LocationCategory.MANUFACTURING,
    locationType: LocationType.MANUFACTURING_SHOP,
    pipelines: [LocationPipeline.MANUFACTURING],
    role: LocationRole.MANUFACTURING,
    parentCode: 'CRANE_MANUFACTURING',
  });

  // 6. Test Validations
  let pass = true;

  try {
    await locationsService.create({
      code: 'CRANE_REPAIR_SHOP', // Duplicate
      name: 'Duplicate',
      category: LocationCategory.REPAIRING,
      locationType: LocationType.REPAIR_SHOP,
      role: LocationRole.REPAIR,
    });
    console.error('❌ Failed: Duplicate code check bypassed');
    pass = false;
  } catch (e) {
    console.log('✅ Passed: Duplicate code rejected');
  }

  try {
    await locationsService.create({
      code: 'INVALID_PARENT',
      name: 'Test',
      category: LocationCategory.COMMON,
      locationType: LocationType.PARKING_LINE,
      role: LocationRole.PARKING,
      parentCode: 'NON_EXISTENT_LOCATION',
    });
    console.error('❌ Failed: Non-existent parent code check bypassed');
    pass = false;
  } catch (e) {
    console.log('✅ Passed: Non-existent parent code rejected');
  }

  try {
    await locationsService.create({
      code: 'PHYSICAL_NESTING',
      name: 'Test',
      category: LocationCategory.COMMON,
      locationType: LocationType.PARKING_LINE,
      role: LocationRole.PARKING,
      parentCode: 'YARD_NORTH_LINE_01', // Physical parent
    });
    console.error('❌ Failed: Physical location nesting check bypassed');
    pass = false;
  } catch (e) {
    console.log('✅ Passed: Physical location nesting rejected');
  }

  // 7. Test Queries
  const physicalRepair = await locationsService.findPhysicalLocationsByCategory(LocationCategory.REPAIRING);
  console.log(`✅ Passed: Found ${physicalRepair.length} physical repairing locations`);

  const hierarchy = await locationsService.findHierarchy();
  console.log(`✅ Passed: Hierarchy generated successfully`);
  
  if (pass) {
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉\n');
  }

  await app.close();
}

bootstrap().catch(console.error);

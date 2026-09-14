import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { LocationsService } from './src/locations/locations.service.js';
import { LocationCategory, LocationType, LocationPipeline, LocationRole } from './src/locations/schemas/location.schema.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const locationsService = app.get(LocationsService);

  console.log('Seeding Master Locations and verifying edge cases...');
  
  // 0. Clean DB
  await locationsService['locationModel'].deleteMany({});
  console.log('Cleared existing locations.');

  // ==========================================
  // Edge Case Testing
  // ==========================================
  let pass = true;

  try {
    await locationsService.create({
      code: 'TEST_REPAIR_MISMATCH',
      name: 'Test',
      category: LocationCategory.REPAIRING,
      locationType: LocationType.GROUP,
      pipelines: [LocationPipeline.MANUFACTURING], // Invalid
      role: LocationRole.REPAIR,
    });
    console.error('❌ Failed: REPAIRING location accepted MANUFACTURING pipeline.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: Pipeline/Category mismatch rejected (REPAIRING).');
  }

  try {
    await locationsService.create({
      code: 'TEST_MFG_MISMATCH',
      name: 'Test',
      category: LocationCategory.MANUFACTURING,
      locationType: LocationType.GROUP,
      pipelines: [LocationPipeline.REPAIRING], // Invalid
      role: LocationRole.MANUFACTURING,
    });
    console.error('❌ Failed: MANUFACTURING location accepted REPAIRING pipeline.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: Pipeline/Category mismatch rejected (MANUFACTURING).');
  }

  // Create Cycle Test Data
  await locationsService.create({ code: 'NODE_A', name: 'A', category: LocationCategory.COMMON, locationType: LocationType.GROUP, role: LocationRole.PARKING });
  await locationsService.create({ code: 'NODE_B', name: 'B', category: LocationCategory.COMMON, locationType: LocationType.GROUP, role: LocationRole.PARKING, parentCode: 'NODE_A' });
  await locationsService.create({ code: 'NODE_C', name: 'C', category: LocationCategory.COMMON, locationType: LocationType.GROUP, role: LocationRole.PARKING, parentCode: 'NODE_B' });

  try {
    // Attempt cycle
    await locationsService.update('NODE_A', { parentCode: 'NODE_C' });
    console.error('❌ Failed: Cycle detection bypassed.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: Cycle detection active (A -> B -> C -> A rejected).');
  }

  try {
    await locationsService.create({
      code: 'node_a', // Case insensitive duplicate
      name: 'Duplicate',
      category: LocationCategory.COMMON,
      locationType: LocationType.GROUP,
      role: LocationRole.PARKING,
    });
    console.error('❌ Failed: Case-insensitive duplicate check bypassed.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: Case-insensitive duplicate rejected.');
  }

  // Active state validation
  try {
    await locationsService.update('NODE_A', { isActive: false });
    console.error('❌ Failed: Deactivated parent with active children.');
    pass = false;
  } catch(e) {
    console.log('✅ Passed: Deactivating parent with active children rejected.');
  }

  await locationsService['locationModel'].deleteMany({});
  console.log('Finished testing edge cases. DB cleared for actual seeding.\n');

  if (!pass) {
    console.error('❌ Aborting seed due to edge case failures.');
    await app.close();
    process.exit(1);
  }

  // ==========================================
  // Production Seed Data
  // ==========================================
  console.log('Seeding Top-Level Groups...');
  await locationsService.create({ code: 'PARKING_YARD', name: 'Parking Yard', category: LocationCategory.COMMON, locationType: LocationType.GROUP, pipelines: [LocationPipeline.COMMON], role: LocationRole.PARKING });
  await locationsService.create({ code: 'WAGON_REPAIR', name: 'Wagon Repair', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR });
  await locationsService.create({ code: 'WAGON_QA', name: 'Wagon QA', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.QA });
  await locationsService.create({ code: 'LOCO_REPAIR', name: 'Loco Repair', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR });
  await locationsService.create({ code: 'TOWER_CAR_REPAIR', name: 'Tower Car Repair', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR });
  await locationsService.create({ code: 'WAGON_MANUFACTURING', name: 'Wagon Manufacturing', category: LocationCategory.MANUFACTURING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.MANUFACTURING], role: LocationRole.MANUFACTURING });

  // Common Top Level Physical
  await locationsService.create({ code: 'NSY', name: 'NSY', category: LocationCategory.COMMON, locationType: LocationType.YARD, pipelines: [LocationPipeline.COMMON], role: LocationRole.ENTRY });
  await locationsService.create({ code: 'TRIAL_YARD', name: 'Trial Yard', category: LocationCategory.COMMON, locationType: LocationType.TRIAL_YARD, pipelines: [LocationPipeline.COMMON], role: LocationRole.TESTING });
  await locationsService.create({ code: 'EXIT_YARD', name: 'Exit Yard', category: LocationCategory.COMMON, locationType: LocationType.EXIT_YARD, pipelines: [LocationPipeline.COMMON], role: LocationRole.EXIT });

  // Repair Top Level Physical
  await locationsService.create({ code: 'WHEEL_PARK_LINE', name: 'Wheel Park Line', category: LocationCategory.REPAIRING, locationType: LocationType.SPECIALTY_LINE, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.HOLDING });

  console.log('Seeding Nested Groups...');
  await locationsService.create({ code: 'NORTH_YARD', name: 'North Yard', category: LocationCategory.COMMON, locationType: LocationType.GROUP, pipelines: [LocationPipeline.COMMON], role: LocationRole.PARKING, parentCode: 'PARKING_YARD' });
  await locationsService.create({ code: 'SOUTH_YARD', name: 'South Yard', category: LocationCategory.COMMON, locationType: LocationType.GROUP, pipelines: [LocationPipeline.COMMON], role: LocationRole.PARKING, parentCode: 'PARKING_YARD' });

  console.log('Seeding Physical Lines (1-56)...');
  // Lines 1-28 -> NORTH_YARD
  for (let i = 1; i <= 28; i++) {
    const num = i.toString().padStart(2, '0');
    await locationsService.create({
      code: `YARD_NORTH_LINE_${num}`,
      name: `Yard North Line ${num}`,
      category: LocationCategory.COMMON,
      locationType: LocationType.PARKING_LINE,
      pipelines: [LocationPipeline.COMMON],
      role: LocationRole.PARKING,
      parentCode: 'NORTH_YARD',
    });
  }

  // Lines 29-56 -> SOUTH_YARD
  for (let i = 29; i <= 56; i++) {
    const num = i.toString().padStart(2, '0');
    await locationsService.create({
      code: `YARD_SOUTH_LINE_${num}`,
      name: `Yard South Line ${num}`,
      category: LocationCategory.COMMON,
      locationType: LocationType.PARKING_LINE,
      pipelines: [LocationPipeline.COMMON],
      role: LocationRole.PARKING,
      parentCode: 'SOUTH_YARD',
    });
  }

  console.log('Seeding Repair Shops...');
  // WRS 1-4
  for (let i = 1; i <= 4; i++) {
    await locationsService.create({
      code: `WRS_${i}`,
      name: `Wagon Repair Shop ${i}`,
      category: LocationCategory.REPAIRING,
      locationType: LocationType.REPAIR_SHOP,
      pipelines: [LocationPipeline.REPAIRING],
      role: LocationRole.REPAIR,
      parentCode: 'WAGON_REPAIR',
    });
  }

  // WRS 5 (QA)
  await locationsService.create({
    code: 'WRS_5',
    name: 'Wagon QA Shop 5',
    category: LocationCategory.REPAIRING,
    locationType: LocationType.QA,
    pipelines: [LocationPipeline.REPAIRING],
    role: LocationRole.QA,
    parentCode: 'WAGON_QA',
  });

  // LOCO REPAIR
  await locationsService.create({
    code: 'DPS',
    name: 'DPS',
    category: LocationCategory.REPAIRING,
    locationType: LocationType.REPAIR_SHOP,
    pipelines: [LocationPipeline.REPAIRING],
    role: LocationRole.REPAIR,
    parentCode: 'LOCO_REPAIR',
  });
  await locationsService.create({
    code: 'ELECTRIC_SHED',
    name: 'Electric Shed',
    category: LocationCategory.REPAIRING,
    locationType: LocationType.REPAIR_SHOP,
    pipelines: [LocationPipeline.REPAIRING],
    role: LocationRole.REPAIR,
    parentCode: 'LOCO_REPAIR',
  });

  // TOWER CAR REPAIR
  await locationsService.create({
    code: 'TOWER_CAR_LINE',
    name: 'Tower Car Line',
    category: LocationCategory.REPAIRING,
    locationType: LocationType.SPECIALTY_LINE,
    pipelines: [LocationPipeline.REPAIRING],
    role: LocationRole.REPAIR,
    parentCode: 'TOWER_CAR_REPAIR',
  });

  console.log('Seeding Manufacturing Shops...');
  await locationsService.create({
    code: `GIF_SHOP`,
    name: `GIF Shop`,
    category: LocationCategory.MANUFACTURING,
    locationType: LocationType.MANUFACTURING_SHOP,
    pipelines: [LocationPipeline.MANUFACTURING],
    role: LocationRole.MANUFACTURING,
    parentCode: 'WAGON_MANUFACTURING',
  });

  console.log('Seeding Crane Facilities...');
  await locationsService.create({ code: 'CRANE_REPAIR', name: 'Crane Repair', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR });
  await locationsService.create({ code: 'CRANE_REPAIR_SHOP', name: 'Crane Repair Shop', category: LocationCategory.REPAIRING, locationType: LocationType.REPAIR_SHOP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR, parentCode: 'CRANE_REPAIR' });
  
  await locationsService.create({ code: 'CRANE_MANUFACTURING', name: 'Crane Manufacturing', category: LocationCategory.MANUFACTURING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.MANUFACTURING], role: LocationRole.MANUFACTURING });
  await locationsService.create({ code: 'CRANE_MANUFACTURING_SHOP', name: 'Crane Manufacturing Shop', category: LocationCategory.MANUFACTURING, locationType: LocationType.MANUFACTURING_SHOP, pipelines: [LocationPipeline.MANUFACTURING], role: LocationRole.MANUFACTURING, parentCode: 'CRANE_MANUFACTURING' });

  console.log('Verifying comprehensive coverage...');
  const allLocations = await locationsService.findAll();
  const allCodes = new Set(allLocations.map(l => l.code));

  const expectedCodes = [
    'PARKING_YARD', 'WAGON_REPAIR', 'WAGON_QA', 'LOCO_REPAIR', 'TOWER_CAR_REPAIR', 'WAGON_MANUFACTURING',
    'NSY', 'TRIAL_YARD', 'EXIT_YARD', 'WHEEL_PARK_LINE',
    'NORTH_YARD', 'SOUTH_YARD',
    'WRS_1', 'WRS_2', 'WRS_3', 'WRS_4', 'WRS_5',
    'DPS', 'ELECTRIC_SHED', 'TOWER_CAR_LINE', 'GIF_SHOP',
    'CRANE_REPAIR', 'CRANE_REPAIR_SHOP', 'CRANE_MANUFACTURING', 'CRANE_MANUFACTURING_SHOP'
  ];

  for (let i = 1; i <= 28; i++) expectedCodes.push(`YARD_NORTH_LINE_${i.toString().padStart(2, '0')}`);
  for (let i = 29; i <= 56; i++) expectedCodes.push(`YARD_SOUTH_LINE_${i.toString().padStart(2, '0')}`);

  let missing = false;
  for (const code of expectedCodes) {
    if (!allCodes.has(code)) {
      console.error(`❌ Missing expected location: ${code}`);
      missing = true;
    }
  }

  // Check for unexpected locations (WMS-1, etc.)
  for (const code of allCodes) {
    if (!expectedCodes.includes(code)) {
      console.error(`❌ Found unexpected location: ${code}`);
      missing = true;
    }
  }

  if (missing) {
    console.error('\\n❌ Final assertion failed. Check the errors above.\\n');
    process.exit(1);
  }

  console.log(`\n🎉 SEED SUCCESSFUL & VERIFIED! Total Locations: ${allLocations.length}`);
  
  await app.close();
}

bootstrap().catch(console.error);

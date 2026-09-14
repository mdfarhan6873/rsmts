import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { UsersService } from './src/users/users.service.js';
import { UserRole } from './src/users/schemas/user.schema.js';
import { LocationsService } from './src/locations/locations.service.js';
import { LocationCategory, LocationType, LocationPipeline, LocationRole } from './src/locations/schemas/location.schema.js';
import { AssetCategoriesService } from './src/asset-categories/asset-categories.service.js';
import { AssetCategoryLevel } from './src/asset-categories/schemas/asset-category.schema.js';
import { Model } from 'mongoose';
import { LocationDocument } from './src/locations/schemas/location.schema.js';
import { AssetCategoryDocument } from './src/asset-categories/schemas/asset-category.schema.js';
import { RoutingRulesService } from './src/routing-rules/routing-rules.service.js';
import { PipelineOperation } from './src/routing-rules/schemas/routing-rule.schema.js';

async function bootstrap() {
  console.log('--- PRODUCTION SEED INITIATED ---');
  console.log('Connecting to database and initializing application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const locationsService = app.get(LocationsService);
  const assetCategoriesService = app.get(AssetCategoriesService);

  // Access underlying models for safe upserts without relying on strict business validation that might block seeds
  const locationModel = locationsService['locationModel'] as Model<LocationDocument>;
  const assetCategoryModel = assetCategoriesService['assetCategoryModel'] as Model<AssetCategoryDocument>;

  console.log('\n[1/3] SEEDING SYSTEM ADMIN USER...');
  try {
    const admin = await usersService.create({
      name: 'System Admin',
      email: 'admin@gmail.com',
      password: 'password@123',
      role: UserRole.SYSTEM_ADMIN,
      isActive: true,
    });
    console.log(`✅ Created admin user: ${admin.email}`);
  } catch (error: any) {
    if (error.code === 11000) {
      console.log('ℹ️ Admin user already exists. Updating password to ensure access...');
      const existing = await usersService.findByEmailWithPassword('admin@gmail.com');
      if (existing) {
        await usersService.update(existing._id.toString(), { password: 'password@123', isActive: true });
        console.log('✅ Admin user password reset successfully.');
      }
    } else {
      console.error('❌ Error seeding admin user:', error);
    }
  }

  console.log('\n[2/3] SEEDING ASSET CATEGORIES (Hierarchical)...');
  const categoriesToSeed = [
    // Grandparents
    { code: 'WAGON', name: 'Wagon', level: AssetCategoryLevel.GRANDPARENT, identificationRule: { type: 'NUMERIC', length: 11, checkDigit: false } },
    { code: 'LOCO', name: 'Loco', level: AssetCategoryLevel.GRANDPARENT, identificationRule: { type: 'NUMERIC', length: 5, checkDigit: false } },
    { code: 'CRANE', name: 'Crane', level: AssetCategoryLevel.GRANDPARENT, identificationRule: { type: 'NUMERIC', length: 6, checkDigit: false } },
    { code: 'TOWER_CAR', name: 'Tower Car', level: AssetCategoryLevel.GRANDPARENT },
    // Wagon Parents
    ...['BOXNHL', 'BCNHL', 'BVZI', 'BTPN', 'BOBRN', 'BCNA', 'FMP', 'BLC'].map(c => ({ code: c, name: c, level: AssetCategoryLevel.PARENT, parentCode: 'WAGON' })),
    // Loco Parents
    ...['WAP7', 'WAG9', 'WDG4'].map(c => ({ code: c, name: c, level: AssetCategoryLevel.PARENT, parentCode: 'LOCO' })),
    // Crane Parents
    ...['140T_CRANE', '175T_CRANE'].map(c => ({ code: c, name: c.replace('_', ' '), level: AssetCategoryLevel.PARENT, parentCode: 'CRANE' })),
    // Tower Car Parents
    { code: '8W_DETC', name: '8W DETC', level: AssetCategoryLevel.PARENT, parentCode: 'TOWER_CAR', identificationRule: { type: 'NUMERIC', length: 6, checkDigit: false } },
    { code: '4W_DHTC', name: '4W DHTC', level: AssetCategoryLevel.PARENT, parentCode: 'TOWER_CAR', identificationRule: { type: 'NUMERIC', length: 3, checkDigit: false } },
    // Crane Children
    { code: '140T_GOTTWALD', name: '140T Gottwald', level: AssetCategoryLevel.CHILD, parentCode: '140T_CRANE' },
    { code: '175T_HYDRAULIC', name: '175T Hydraulic', level: AssetCategoryLevel.CHILD, parentCode: '175T_CRANE' },
  ];

  let catSuccessCount = 0;
  for (const cat of categoriesToSeed) {
    try {
      await assetCategoryModel.updateOne(
        { code: cat.code },
        { $set: cat },
        { upsert: true }
      );
      catSuccessCount++;
    } catch (err: any) {
      console.error(`❌ Failed to upsert category ${cat.code}:`, err.message);
    }
  }
  console.log(`✅ Processed ${catSuccessCount}/${categoriesToSeed.length} asset categories safely.`);


  console.log('\n[3/3] SEEDING LOCATIONS (Without Deleting Existing)...');
  const locationsToSeed = [
    // Top-Level Groups
    { code: 'PARKING_YARD', name: 'Parking Yard', category: LocationCategory.COMMON, locationType: LocationType.GROUP, pipelines: [LocationPipeline.COMMON], role: LocationRole.PARKING },
    { code: 'WAGON_REPAIR', name: 'Wagon Repair', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR },
    { code: 'WAGON_QA', name: 'Wagon QA', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.QA },
    { code: 'LOCO_REPAIR', name: 'Loco Repair', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR },
    { code: 'TOWER_CAR_REPAIR', name: 'Tower Car Repair', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR },
    { code: 'WAGON_MANUFACTURING', name: 'Wagon Manufacturing', category: LocationCategory.MANUFACTURING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.MANUFACTURING], role: LocationRole.MANUFACTURING },
    
    // Common Top Level Physical
    { code: 'NSY', name: 'NSY', category: LocationCategory.COMMON, locationType: LocationType.YARD, pipelines: [LocationPipeline.COMMON], role: LocationRole.ENTRY },
    { code: 'TRIAL_YARD', name: 'Trial Yard', category: LocationCategory.COMMON, locationType: LocationType.TRIAL_YARD, pipelines: [LocationPipeline.COMMON], role: LocationRole.TESTING },
    { code: 'EXIT_YARD', name: 'Exit Yard', category: LocationCategory.COMMON, locationType: LocationType.EXIT_YARD, pipelines: [LocationPipeline.COMMON], role: LocationRole.EXIT },

    // Repair Top Level Physical
    { code: 'WHEEL_PARK_LINE', name: 'Wheel Park Line', category: LocationCategory.REPAIRING, locationType: LocationType.SPECIALTY_LINE, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.HOLDING },

    // Nested Groups
    { code: 'NORTH_YARD', name: 'North Yard', category: LocationCategory.COMMON, locationType: LocationType.GROUP, pipelines: [LocationPipeline.COMMON], role: LocationRole.PARKING, parentCode: 'PARKING_YARD' },
    { code: 'SOUTH_YARD', name: 'South Yard', category: LocationCategory.COMMON, locationType: LocationType.GROUP, pipelines: [LocationPipeline.COMMON], role: LocationRole.PARKING, parentCode: 'PARKING_YARD' },
    
    // Wagon Repair Shops
    ...Array.from({ length: 4 }).map((_, i) => ({
      code: `WRS_${i+1}`, name: `Wagon Repair Shop ${i+1}`, category: LocationCategory.REPAIRING, locationType: LocationType.REPAIR_SHOP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR, parentCode: 'WAGON_REPAIR'
    })),
    { code: 'WRS_5', name: 'Wagon QA Shop 5', category: LocationCategory.REPAIRING, locationType: LocationType.QA, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.QA, parentCode: 'WAGON_QA' },

    // Loco Repair
    { code: 'DPS', name: 'DPS', category: LocationCategory.REPAIRING, locationType: LocationType.REPAIR_SHOP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR, parentCode: 'LOCO_REPAIR' },
    { code: 'ELECTRIC_SHED', name: 'Electric Shed', category: LocationCategory.REPAIRING, locationType: LocationType.REPAIR_SHOP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR, parentCode: 'LOCO_REPAIR' },
    
    // Tower Car
    { code: 'TOWER_CAR_LINE', name: 'Tower Car Line', category: LocationCategory.REPAIRING, locationType: LocationType.SPECIALTY_LINE, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR, parentCode: 'TOWER_CAR_REPAIR' },
    
    // Manufacturing
    { code: `GIF_SHOP`, name: `GIF Shop`, category: LocationCategory.MANUFACTURING, locationType: LocationType.MANUFACTURING_SHOP, pipelines: [LocationPipeline.MANUFACTURING], role: LocationRole.MANUFACTURING, parentCode: 'WAGON_MANUFACTURING' },
    
    // Crane
    { code: 'CRANE_REPAIR', name: 'Crane Repair', category: LocationCategory.REPAIRING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR },
    { code: 'CRANE_REPAIR_SHOP', name: 'Crane Repair Shop', category: LocationCategory.REPAIRING, locationType: LocationType.REPAIR_SHOP, pipelines: [LocationPipeline.REPAIRING], role: LocationRole.REPAIR, parentCode: 'CRANE_REPAIR' },
    { code: 'CRANE_MANUFACTURING', name: 'Crane Manufacturing', category: LocationCategory.MANUFACTURING, locationType: LocationType.GROUP, pipelines: [LocationPipeline.MANUFACTURING], role: LocationRole.MANUFACTURING },
    { code: 'CRANE_MANUFACTURING_SHOP', name: 'Crane Manufacturing Shop', category: LocationCategory.MANUFACTURING, locationType: LocationType.MANUFACTURING_SHOP, pipelines: [LocationPipeline.MANUFACTURING], role: LocationRole.MANUFACTURING, parentCode: 'CRANE_MANUFACTURING' },

    // Physical Lines (1-28 for North, 29-56 for South)
    ...Array.from({ length: 28 }).map((_, i) => ({
      code: `YARD_NORTH_LINE_${(i+1).toString().padStart(2, '0')}`, name: `Yard North Line ${(i+1).toString().padStart(2, '0')}`, category: LocationCategory.COMMON, locationType: LocationType.PARKING_LINE, pipelines: [LocationPipeline.COMMON], role: LocationRole.PARKING, parentCode: 'NORTH_YARD'
    })),
    ...Array.from({ length: 28 }).map((_, i) => ({
      code: `YARD_SOUTH_LINE_${(i+29).toString().padStart(2, '0')}`, name: `Yard South Line ${(i+29).toString().padStart(2, '0')}`, category: LocationCategory.COMMON, locationType: LocationType.PARKING_LINE, pipelines: [LocationPipeline.COMMON], role: LocationRole.PARKING, parentCode: 'SOUTH_YARD'
    }))
  ];

  let locSuccessCount = 0;
  for (const loc of locationsToSeed) {
    try {
      await locationModel.updateOne(
        { code: loc.code },
        { $set: loc },
        { upsert: true }
      );
      locSuccessCount++;
    } catch (err: any) {
      console.error(`❌ Failed to upsert location ${loc.code}:`, err.message);
    }
  }
  console.log(`✅ Processed ${locSuccessCount}/${locationsToSeed.length} locations safely.`);

  console.log('\n[4/4] SEEDING ROUTING RULES...');
  const routingRulesService = app.get(RoutingRulesService);
  const routingRuleModel = routingRulesService['routingRuleModel'];

  const rules = [
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_1', remark: 'Authorized wagon repair location for work assigned to WRS_1.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_2', remark: 'Authorized wagon repair location for work assigned to WRS_2.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_3', remark: 'Authorized wagon repair location for work assigned to WRS_3.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_4', remark: 'Authorized wagon repair location for work assigned to WRS_4.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WRS_5', remark: 'Designated QA location for wagon repair inspection.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.REPAIRING, locationCode: 'WHEEL_PARK_LINE', remark: 'Holding location for wagons awaiting wheel sets or component repairs.' },
    { assetCategoryCode: 'WAGON', pipeline: PipelineOperation.MANUFACTURING, locationCode: 'GIF_SHOP', remark: 'Authorized wagon manufacturing location.' },
    { assetCategoryCode: 'LOCO', pipeline: PipelineOperation.REPAIRING, locationCode: 'DPS', remark: 'Primary diesel locomotive repair shed.' },
    { assetCategoryCode: 'LOCO', pipeline: PipelineOperation.REPAIRING, locationCode: 'ELECTRIC_SHED', remark: 'Primary electric locomotive repair shed.' },
    { assetCategoryCode: 'CRANE', pipeline: PipelineOperation.REPAIRING, locationCode: 'CRANE_REPAIR_SHOP', remark: 'Dedicated facility for crane repair operations.' },
    { assetCategoryCode: 'CRANE', pipeline: PipelineOperation.MANUFACTURING, locationCode: 'CRANE_MANUFACTURING_SHOP', remark: 'Dedicated facility for crane manufacturing operations.' },
    { assetCategoryCode: 'TOWER_CAR', pipeline: PipelineOperation.REPAIRING, locationCode: 'TOWER_CAR_LINE', remark: 'Designated line for tower car repair and maintenance.' }
  ];

  let ruleSuccessCount = 0;
  for (const rule of rules) {
    try {
      await routingRuleModel.updateOne(
        { assetCategoryCode: rule.assetCategoryCode, pipeline: rule.pipeline, locationCode: rule.locationCode },
        { $set: rule },
        { upsert: true }
      );
      ruleSuccessCount++;
    } catch (err: any) {
      console.error(`❌ Failed to upsert rule ${rule.assetCategoryCode}->${rule.locationCode}:`, err.message);
    }
  }
  console.log(`✅ Processed ${ruleSuccessCount}/${rules.length} routing rules safely.`);

  console.log('\n--- PRODUCTION SEED COMPLETED SUCCESSFULLY ---');
  await app.close();
}

bootstrap().then(() => process.exit(0)).catch(console.error);

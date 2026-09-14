import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module.js';
import { MovementsService } from './src/movements/movements.service.js';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MovementLogDocument } from './src/movements/schemas/movement-log.schema.js';
import { UserDocument, UserRole } from './src/users/schemas/user.schema.js';
import { AssetDocument } from './src/assets/schemas/asset.schema.js';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const movementsService = app.get(MovementsService);
  const movementLogModel = app.get<Model<MovementLogDocument>>(getModelToken('MovementLog'));
  const userModel = app.get<Model<UserDocument>>(getModelToken('User'));
  const assetModel = app.get<Model<AssetDocument>>(getModelToken('Asset'));

  console.log('Seeding Movements and verifying logic...');

  // 1. Clear previous movement logs for a clean test
  await movementLogModel.deleteMany({});

  // 2. We need a real seeded user
  let testUser = await userModel.findOne({ email: 'movement@test.com' });
  if (!testUser) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('dummy_password', saltRounds);
    testUser = await userModel.create({
      name: 'Test Movement User',
      email: 'movement@test.com',
      password: hashedPassword,
      role: UserRole.SYSTEM_ADMIN,
    });
  }

  // Edge Case 1: Invalid Routing
  try {
    await movementsService.moveAsset({
      assetNumber: '12345678901',
      toLocationCode: 'CRANE_REPAIR_SHOP',
      remark: 'Invalid routing test',
    }, testUser.id);
    throw new Error('Test failed: Should have rejected invalid routing');
  } catch (e) {
    const error = e as any;
    if (error.status === 400 && error.message.includes('not an eligible routing destination')) {
      console.log('✅ Passed: Rejected invalid routing destination.');
    } else {
      console.error('❌ Failed: Unexpected error on invalid routing.', error);
    }
  }

  // Edge Case 2: Asset not found
  try {
    await movementsService.moveAsset({
      assetNumber: 'INVALID_ASSET',
      toLocationCode: 'WRS_1',
      remark: 'Missing asset test',
    }, testUser.id);
    throw new Error('Test failed: Should have rejected missing asset');
  } catch (e) {
    const error = e as any;
    if (error.status === 404) {
      console.log('✅ Passed: Rejected missing asset.');
    } else {
      console.error('❌ Failed: Unexpected error on missing asset.', error);
    }
  }

  // Valid Movement Sequence
  try {
    // 12345678901 is currently at WRS_1 (from seed-assets)
    console.log('Running valid sequence for 12345678901...');

    // WRS_1 -> WRS_5
    await movementsService.moveAsset({
      assetNumber: '12345678901',
      toLocationCode: 'WRS_5',
      remark: 'QA Check',
    }, testUser.id);

    // Verify Asset State
    const asset = await assetModel.findOne({ assetNumber: '12345678901' });
    if (asset?.currentLocationCode === 'WRS_5') {
      console.log('✅ Passed: Asset updated to final location (WRS_5).');
    } else {
      console.error(`❌ Failed: Asset is at ${asset?.currentLocationCode} instead of WRS_5.`);
    }

    // Verify History
    const history = await movementsService.getAssetHistory('12345678901');
    if (history.length === 1 && history[0].toLocationCode === 'WRS_5') {
      console.log('✅ Passed: Movement history is correctly tracked and ordered.');
    } else {
      console.error('❌ Failed: Movement history is incorrect.', history);
    }

  } catch (error) {
    console.error('❌ Failed valid sequence:', error);
  }

  console.log('Closing application...');
  await app.close();
}

bootstrap();

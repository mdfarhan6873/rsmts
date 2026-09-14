import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Connection } from 'mongoose';
import { Asset, AssetDocument, AssetStatus } from '../assets/schemas/asset.schema.js';
import { MovementLog, MovementLogDocument } from './schemas/movement-log.schema.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { RoutingRulesService } from '../routing-rules/routing-rules.service.js';
import { LocationsService } from '../locations/locations.service.js';

@Injectable()
export class MovementsService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(MovementLog.name) private movementLogModel: Model<MovementLogDocument>,
    @Inject(RoutingRulesService) private routingRulesService: RoutingRulesService,
    @Inject(LocationsService) private locationsService: LocationsService,
    @InjectConnection() private connection: Connection,
  ) {}

  async moveAsset(createMovementDto: CreateMovementDto, userId: string) {
    const { assetNumber, toLocationCode, remark } = createMovementDto;

    // Start a transaction session
    const session = await this.connection.startSession();
    
    let result;

    try {
      await session.withTransaction(async () => {
        // 1. Load Asset inside transaction
        const asset = await this.assetModel.findOne({ assetNumber }).session(session).exec();
        
        if (!asset) {
          throw new NotFoundException(`Asset with number ${assetNumber} not found.`);
        }
        
        if (!asset.isActive) {
          throw new BadRequestException(`Asset ${assetNumber} is not active.`);
        }

        if (asset.status === AssetStatus.CONDEMNED) {
          throw new BadRequestException(`Asset ${assetNumber} is condemned and cannot be moved.`);
        }

        const fromLocationCode = asset.currentLocationCode;

        if (fromLocationCode === toLocationCode) {
          throw new BadRequestException(`Asset is already at location ${toLocationCode}.`);
        }

        // 2. Validate destination exists and is physical
        const toLocation = await this.locationsService.findOne(toLocationCode);
        if (!toLocation) {
          throw new BadRequestException(`Location ${toLocationCode} does not exist.`);
        }
        if (!toLocation.isActive) {
          throw new BadRequestException(`Location ${toLocationCode} is inactive.`);
        }
        if (toLocation.locationType === 'GROUP') { // wait, locationType is an enum, let's just use string literal or we can import LocationType
          throw new BadRequestException(`Cannot move asset to a GROUP location (${toLocationCode}).`);
        }

        // 3. Validate routing eligibility
        const allowedLocations = await this.routingRulesService.getAllowedLocations(
          asset.categoryCode,
          asset.currentPipeline,
        );

        const isAllowed = allowedLocations.includes(toLocationCode);
        if (!isAllowed) {
          throw new BadRequestException(
            `Location ${toLocationCode} is not an eligible routing destination for category ${asset.categoryCode} in pipeline ${asset.currentPipeline}.`,
          );
        }

        // 4. Create MovementLog
        const movementLogs = await this.movementLogModel.create(
          [
            {
              assetId: asset._id,
              fromLocationCode,
              toLocationCode,
              movedBy: userId,
              remark,
            },
          ],
          { session },
        );

        const movementLog = movementLogs[0];

        // 5. Update Asset's current location
        asset.currentLocationCode = toLocationCode;
        await asset.save({ session });

        result = movementLog;
      });
    } finally {
      await session.endSession();
    }

    return result;
  }

  async getAssetHistory(assetNumber: string) {
    const asset = await this.assetModel.findOne({ assetNumber }).exec();
    if (!asset) {
      throw new NotFoundException(`Asset with number ${assetNumber} not found.`);
    }

    return this.movementLogModel
      .find({ assetId: asset._id })
      .sort({ movedAt: -1 })
      .populate('movedBy', 'username name email') // assuming user has these fields
      .exec();
  }
}

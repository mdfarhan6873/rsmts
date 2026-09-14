import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Asset, AssetDocument, AssetStatus } from './schemas/asset.schema.js';
import { RegisterAssetDto } from './dto/register-asset.dto.js';
import { AssetCategoriesService } from '../asset-categories/asset-categories.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { RoutingRulesService } from '../routing-rules/routing-rules.service.js';
import { LocationType } from '../locations/schemas/location.schema.js';
import { PipelineOperation } from '../routing-rules/schemas/routing-rule.schema.js';
import { IdentificationType } from '../asset-categories/schemas/asset-category.schema.js';
import { UpdateAssetStatusDto } from './dto/update-asset-status.dto.js';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @Inject(AssetCategoriesService) private assetCategoriesService: AssetCategoriesService,
    @Inject(LocationsService) private locationsService: LocationsService,
    @Inject(RoutingRulesService) private routingRulesService: RoutingRulesService,
  ) {}

  async registerAsset(dto: RegisterAssetDto): Promise<Asset> {
    // 1 & 2. Verify Category exists and is active
    const category = await this.assetCategoriesService.findOne(dto.categoryCode);
    if (!category.isActive) {
      throw new BadRequestException(`Asset category ${dto.categoryCode} is inactive.`);
    }

    // 4. Resolve identification rule
    const idRule = await this.assetCategoriesService.getEffectiveIdentificationRule(dto.categoryCode);
    if (!idRule) {
      throw new BadRequestException(`No identification rule defined for category ${dto.categoryCode} or its ancestors.`);
    }

    // 5. Validate Asset Number (Generic Validation)
    if (idRule.type === IdentificationType.NUMERIC) {
      if (!/^\d+$/.test(dto.assetNumber)) {
        throw new BadRequestException(`Asset number must be numeric, got: ${dto.assetNumber}`);
      }
    } else if (idRule.type === IdentificationType.ALPHANUMERIC) {
      if (!/^[A-Z0-9]+$/.test(dto.assetNumber)) {
        throw new BadRequestException(`Asset number must be alphanumeric, got: ${dto.assetNumber}`);
      }
    } else {
      throw new BadRequestException(`Unsupported identification type: ${idRule.type}`);
    }

    if (dto.assetNumber.length !== idRule.length) {
      throw new BadRequestException(`Asset number must be exactly ${idRule.length} characters long, got ${dto.assetNumber.length}`);
    }

    // 6. Asset number is unique
    const existing = await this.assetModel.findOne({ assetNumber: dto.assetNumber }).exec();
    if (existing) {
      throw new BadRequestException(`Asset number ${dto.assetNumber} is already registered.`);
    }

    // 7 & 8. Verify Location exists, is active, and is PHYSICAL
    const location = await this.locationsService.findOne(dto.currentLocationCode);
    if (!location.isActive) {
      throw new BadRequestException(`Location ${dto.currentLocationCode} is inactive.`);
    }
    if (location.locationType === LocationType.GROUP) {
      throw new BadRequestException(`Location ${dto.currentLocationCode} is a GROUP location and cannot hold assets.`);
    }

    // 9. Routing eligibility validation
    const allowedLocations = await this.routingRulesService.getAllowedLocations(dto.categoryCode, dto.operation);
    if (!allowedLocations.includes(dto.currentLocationCode)) {
      throw new BadRequestException(`Location ${dto.currentLocationCode} is not permitted for category ${dto.categoryCode} in operation ${dto.operation}`);
    }

    // 10. Remark is non-empty (handled by DTO @IsNotEmpty / trim)

    // 11. Derive pipeline/status
    const currentPipeline = dto.operation;
    const status = currentPipeline === PipelineOperation.REPAIRING 
      ? AssetStatus.IN_REPAIR 
      : AssetStatus.IN_MANUFACTURING;

    // 12. Create asset
    const newAsset = new this.assetModel({
      assetNumber: dto.assetNumber,
      categoryCode: dto.categoryCode,
      status: status,
      currentLocationCode: dto.currentLocationCode,
      currentPipeline: currentPipeline,
      remark: dto.remark,
      isActive: true,
    });

    return newAsset.save();
  }

  async findAll(): Promise<Asset[]> {
    return this.assetModel.find().exec();
  }

  async findOne(assetNumber: string): Promise<Asset> {
    const asset = await this.assetModel.findOne({ assetNumber: assetNumber.toUpperCase() }).exec();
    if (!asset) {
      throw new NotFoundException(`Asset ${assetNumber} not found`);
    }
    return asset;
  }

  async updateStatus(assetNumber: string, dto: UpdateAssetStatusDto): Promise<Asset> {
    const asset = await this.assetModel.findOneAndUpdate(
      { assetNumber: assetNumber.toUpperCase() },
      { $set: { status: dto.status } },
      { new: true }
    ).exec();

    if (!asset) {
      throw new NotFoundException(`Asset ${assetNumber} not found`);
    }

    return asset;
  }
}

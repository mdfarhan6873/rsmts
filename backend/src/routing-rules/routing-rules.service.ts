import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { RoutingRule, RoutingRuleDocument, PipelineOperation } from './schemas/routing-rule.schema.js';
import { CreateRoutingRuleDto } from './dto/create-routing-rule.dto.js';
import { UpdateRoutingRuleDto } from './dto/update-routing-rule.dto.js';
import { AssetCategoriesService } from '../asset-categories/asset-categories.service.js';
import { LocationsService } from '../locations/locations.service.js';
import { LocationCategory, LocationType, LocationPipeline } from '../locations/schemas/location.schema.js';

@Injectable()
export class RoutingRulesService {
  constructor(
    @InjectModel(RoutingRule.name) private routingRuleModel: mongoose.Model<RoutingRuleDocument>,
    @Inject(AssetCategoriesService) private assetCategoriesService: AssetCategoriesService,
    @Inject(LocationsService) private locationsService: LocationsService,
  ) {}

  async create(createDto: CreateRoutingRuleDto): Promise<RoutingRule> {
    const { assetCategoryCode, pipeline, locationCode } = createDto;

    // Validate Category
    await this.assetCategoriesService.findOne(assetCategoryCode);

    // Validate Location
    const location = await this.locationsService.findOne(locationCode);

    if (location.locationType === LocationType.GROUP) {
      throw new BadRequestException(`Cannot map routing rule to a GROUP location (${locationCode}). Must be physical.`);
    }

    if (location.category === LocationCategory.COMMON) {
      throw new BadRequestException(`Cannot map explicit routing rules for COMMON locations (${locationCode}). They are inherently permitted.`);
    }

    // Validate pipeline matches location category
    if (pipeline === PipelineOperation.REPAIRING && location.category !== LocationCategory.REPAIRING) {
      throw new BadRequestException(`Cannot route REPAIRING pipeline to ${location.category} location (${locationCode}).`);
    }
    if (pipeline === PipelineOperation.MANUFACTURING && location.category !== LocationCategory.MANUFACTURING) {
      throw new BadRequestException(`Cannot route MANUFACTURING pipeline to ${location.category} location (${locationCode}).`);
    }

    // Ensure no duplicate rule
    const existing = await this.routingRuleModel.findOne({
      assetCategoryCode: assetCategoryCode.toUpperCase(),
      pipeline,
      locationCode: locationCode.toUpperCase()
    }).exec();

    if (existing) {
      throw new BadRequestException(`Routing rule already exists for ${assetCategoryCode} -> ${pipeline} -> ${locationCode}`);
    }

    const created = new this.routingRuleModel({
      ...createDto,
      assetCategoryCode: assetCategoryCode.toUpperCase().trim(),
      locationCode: locationCode.toUpperCase().trim(),
    });

    return created.save();
  }

  async findAll(): Promise<RoutingRule[]> {
    return this.routingRuleModel.find().exec();
  }

  async findOne(id: string): Promise<RoutingRule> {
    const rule = await this.routingRuleModel.findById(id).exec();
    if (!rule) {
      throw new NotFoundException(`Routing Rule with ID ${id} not found`);
    }
    return rule;
  }

  async update(id: string, updateDto: UpdateRoutingRuleDto): Promise<RoutingRule> {
    const existing = await this.routingRuleModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Routing Rule with ID ${id} not found`);
    }

    Object.assign(existing, updateDto);
    return existing.save();
  }

  async remove(id: string): Promise<RoutingRule> {
    const deleted = await this.routingRuleModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Routing Rule with ID ${id} not found`);
    }
    return deleted;
  }

  /**
   * Resolves the list of all permitted strict locations by walking up the Asset Category tree,
   * then appends all COMMON physical locations.
   */
  async getAllowedLocations(categoryCode: string, pipeline: PipelineOperation): Promise<string[]> {
    let currentCode: string | null = categoryCode.toUpperCase();
    let strictRules: RoutingRule[] = [];

    // Walk up the hierarchy until we find rules for a parent/grandparent
    while (currentCode) {
      strictRules = await this.routingRuleModel.find({
        assetCategoryCode: currentCode,
        pipeline,
        isActive: true,
      }).exec();

      if (strictRules.length > 0) {
        break; // Nearest applicable rules found
      }

      // Move up to parent
      try {
        const category = await this.assetCategoriesService.findOne(currentCode);
        currentCode = category.parentCode;
      } catch (error) {
        // Category not found (e.g. invalid base code)
        break;
      }
    }

    const strictLocationCodes = strictRules.map(rule => rule.locationCode);

    // Get all active COMMON physical locations
    const commonLocations = await this.locationsService.findPhysicalLocationsByCategory(LocationCategory.COMMON);
    const commonLocationCodes = commonLocations.map(loc => loc.code);

    return [...new Set([...strictLocationCodes, ...commonLocationCodes])];
  }
}

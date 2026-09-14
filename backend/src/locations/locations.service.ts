import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationCategory, LocationDocument, LocationPipeline, LocationType } from './schemas/location.schema.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name) private locationModel: Model<LocationDocument>,
  ) {}

  private async validateParentConstraint(parentCode: string | null) {
    if (!parentCode) return;

    const parent = await this.locationModel.findOne({ code: parentCode }).exec();
    if (!parent) {
      throw new NotFoundException(`Parent location with code ${parentCode} not found.`);
    }

    if (parent.locationType !== LocationType.GROUP) {
      throw new BadRequestException(
        `Invalid parent location: ${parentCode}. Only GROUP locations can have children.`
      );
    }
  }

  private async detectCycles(targetCode: string, newParentCode: string | null): Promise<void> {
    let currentParentCode = newParentCode;
    while (currentParentCode) {
      if (currentParentCode === targetCode) {
        throw new BadRequestException(`Cyclic hierarchy detected. A location cannot be its own ancestor.`);
      }
      const parent = await this.locationModel.findOne({ code: currentParentCode }).lean().exec();
      currentParentCode = parent?.parentCode || null;
    }
  }

  private validatePipelines(category: LocationCategory, pipelines?: LocationPipeline[]) {
    if (!pipelines || pipelines.length === 0) return;

    if (category === LocationCategory.REPAIRING && pipelines.includes(LocationPipeline.MANUFACTURING)) {
      throw new BadRequestException('REPAIRING locations cannot contain MANUFACTURING pipelines.');
    }
    if (category === LocationCategory.MANUFACTURING && pipelines.includes(LocationPipeline.REPAIRING)) {
      throw new BadRequestException('MANUFACTURING locations cannot contain REPAIRING pipelines.');
    }
  }

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    const { code, parentCode, category, pipelines } = createLocationDto;

    // Case-insensitive duplicate check
    const existing = await this.locationModel.findOne({ code: new RegExp(`^${code}$`, 'i') }).exec();
    if (existing) {
      throw new BadRequestException(`Location code ${code} already exists.`);
    }

    this.validatePipelines(category, pipelines);
    await this.validateParentConstraint(parentCode || null);

    const createdLocation = new this.locationModel(createLocationDto);
    return createdLocation.save();
  }

  async findAll(): Promise<Location[]> {
    return this.locationModel.find().exec();
  }

  /**
   * Fetches the entire hierarchy.
   */
  async findHierarchy(): Promise<any[]> {
    const allLocations = await this.locationModel.find().lean().exec();
    const locationMap = new Map<string, any>();
    const roots: any[] = [];

    // Initialize map
    for (const loc of allLocations) {
      locationMap.set(loc.code, { ...loc, children: [] });
    }

    // Build tree
    for (const loc of allLocations) {
      const node = locationMap.get(loc.code);
      if (loc.parentCode) {
        const parentNode = locationMap.get(loc.parentCode);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          roots.push(node); // Orphan fallback (shouldn't happen)
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findPhysicalLocationsByCategory(category: LocationCategory): Promise<Location[]> {
    return this.locationModel.find({
      category,
      locationType: { $ne: LocationType.GROUP },
      isActive: true,
    }).exec();
  }

  async findLocationsByPipeline(pipeline: LocationPipeline): Promise<Location[]> {
    return this.locationModel.find({
      pipelines: pipeline,
      isActive: true,
    }).exec();
  }

  async findOne(code: string): Promise<Location> {
    const location = await this.locationModel.findOne({ code }).exec();
    if (!location) {
      throw new NotFoundException(`Location with code ${code} not found`);
    }
    return location;
  }

  async update(code: string, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const locationToUpdate = await this.findOne(code);

    if (updateLocationDto.category || updateLocationDto.pipelines) {
      const finalCategory = updateLocationDto.category ?? locationToUpdate.category;
      const finalPipelines = updateLocationDto.pipelines ?? locationToUpdate.pipelines;
      this.validatePipelines(finalCategory, finalPipelines);
    }

    if (updateLocationDto.parentCode !== undefined && updateLocationDto.parentCode !== locationToUpdate.parentCode) {
      await this.validateParentConstraint(updateLocationDto.parentCode);
      await this.detectCycles(code, updateLocationDto.parentCode);
    }

    // If changing locationType to a physical type, ensure it has no children
    if (
      updateLocationDto.locationType &&
      updateLocationDto.locationType !== LocationType.GROUP &&
      locationToUpdate.locationType === LocationType.GROUP
    ) {
      const childCount = await this.locationModel.countDocuments({ parentCode: code }).exec();
      if (childCount > 0) {
        throw new BadRequestException(
          `Cannot change type of ${code} to physical because it currently has ${childCount} child location(s).`
        );
      }
    }

    // If deactivating, ensure children are deactivated or throw error
    if (updateLocationDto.isActive === false && locationToUpdate.isActive) {
      const activeChildCount = await this.locationModel.countDocuments({ parentCode: code, isActive: true }).exec();
      if (activeChildCount > 0) {
        throw new BadRequestException(
          `Cannot deactivate ${code} because it has ${activeChildCount} active child location(s). Deactivate them first.`
        );
      }
    }

    const updatedLocation = await this.locationModel
      .findOneAndUpdate({ code }, updateLocationDto, { new: true })
      .exec();

    if (!updatedLocation) {
      throw new NotFoundException(`Location with code ${code} not found`);
    }
    
    return updatedLocation;
  }

  async remove(code: string): Promise<Location> {
    // Before removing, ensure no children exist
    const childCount = await this.locationModel.countDocuments({ parentCode: code }).exec();
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete location ${code} because it has ${childCount} child location(s). Delete children first.`
      );
    }

    const deletedLocation = await this.locationModel.findOneAndDelete({ code }).exec();
    if (!deletedLocation) {
      throw new NotFoundException(`Location with code ${code} not found`);
    }
    return deletedLocation;
  }
}

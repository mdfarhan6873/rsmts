import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssetCategory, AssetCategoryDocument, AssetCategoryLevel } from './schemas/asset-category.schema.js';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto.js';
import { UpdateAssetCategoryDto } from './dto/update-asset-category.dto.js';

@Injectable()
export class AssetCategoriesService {
  constructor(
    @InjectModel(AssetCategory.name)
    private readonly assetCategoryModel: Model<AssetCategoryDocument>,
  ) {}

  async create(createDto: CreateAssetCategoryDto): Promise<AssetCategoryDocument> {
    const code = createDto.code.toUpperCase().trim();
    
    // 1. Check for duplicate code
    const existing = await this.assetCategoryModel.findOne({
      code: { $regex: new RegExp(`^${code}$`, 'i') },
    });
    if (existing) {
      throw new BadRequestException(`Asset category code '${code}' already exists`);
    }

    // 2. Validate structural integrity
    await this.validateHierarchyConstraints(
      code,
      createDto.level,
      createDto.parentCode,
    );

    const category = new this.assetCategoryModel({
      ...createDto,
      code,
      parentCode: createDto.parentCode?.toUpperCase().trim() || null,
      identificationRule: createDto.identificationRule ? {
        type: createDto.identificationRule.type,
        length: createDto.identificationRule.length,
        checkDigit: createDto.identificationRule.checkDigit ?? false,
      } : undefined,
    });
    
    return category.save();
  }

  async update(code: string, updateDto: UpdateAssetCategoryDto): Promise<AssetCategoryDocument> {
    code = code.toUpperCase().trim();
    const category = await this.assetCategoryModel.findOne({ code });
    
    if (!category) {
      throw new NotFoundException(`Asset category '${code}' not found`);
    }

    const newLevel = updateDto.level ?? category.level;
    const newParentCode = updateDto.parentCode !== undefined ? updateDto.parentCode : category.parentCode;
    const newIsActive = updateDto.isActive !== undefined ? updateDto.isActive : category.isActive;

    // 1. Prevent assignment to itself
    if (newParentCode && newParentCode.toUpperCase() === code) {
      throw new BadRequestException('Asset category cannot be its own parent');
    }

    // 2. Validate level mutations if it has children
    if (updateDto.level && updateDto.level !== category.level) {
      const hasChildren = await this.assetCategoryModel.exists({ parentCode: code });
      if (hasChildren) {
        throw new BadRequestException(`Cannot change level of '${code}' because it has children`);
      }
    }

    // 3. Validate structural integrity if parent or level changes
    if (updateDto.level || updateDto.parentCode !== undefined) {
      await this.validateHierarchyConstraints(code, newLevel, newParentCode);
    }

    // 4. Validate deactivation/deletion constraints
    if (updateDto.isActive === false && category.isActive === true) {
      const activeChildren = await this.assetCategoryModel.exists({ parentCode: code, isActive: true });
      if (activeChildren) {
        throw new BadRequestException(`Cannot deactivate '${code}' because it has active children`);
      }
    }

    // 5. Prevent cycles (recursive parent lookup)
    if (newParentCode) {
      await this.detectCycles(code, newParentCode);
    }

    Object.assign(category, {
      ...updateDto,
      parentCode: newParentCode?.toUpperCase().trim() || null,
    });
    if (updateDto.identificationRule !== undefined) {
      category.identificationRule = {
        type: updateDto.identificationRule.type,
        length: updateDto.identificationRule.length,
        checkDigit: updateDto.identificationRule.checkDigit ?? false,
      };
    }

    return category.save();
  }

  async findAll(): Promise<AssetCategoryDocument[]> {
    return this.assetCategoryModel.find().exec();
  }

  async findOne(code: string): Promise<AssetCategoryDocument> {
    const category = await this.assetCategoryModel.findOne({ code: code.toUpperCase().trim() });
    if (!category) {
      throw new NotFoundException(`Asset category '${code}' not found`);
    }
    return category;
  }

  async remove(code: string): Promise<void> {
    code = code.toUpperCase().trim();
    const hasChildren = await this.assetCategoryModel.exists({ parentCode: code });
    if (hasChildren) {
      throw new BadRequestException(`Cannot delete '${code}' because it has children`);
    }
    
    const result = await this.assetCategoryModel.deleteOne({ code });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Asset category '${code}' not found`);
    }
  }

  async findHierarchy(): Promise<any[]> {
    const allCategories = await this.assetCategoryModel.find().lean().exec();
    
    const map = new Map<string, any>();
    const roots: any[] = [];

    // Initialize map
    for (const cat of allCategories) {
      map.set(cat.code, { ...cat, children: [] });
    }

    // Build tree
    for (const cat of allCategories) {
      const node = map.get(cat.code);
      if (cat.parentCode) {
        const parent = map.get(cat.parentCode);
        if (parent) {
          parent.children.push(node);
        } else {
          // Orphan (should not happen with constraints)
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getEffectiveIdentificationRule(code: string): Promise<any> {
    let currentCode: string | null = code;
    const visited = new Set<string>();

    while (currentCode) {
      if (visited.has(currentCode.toUpperCase())) {
        throw new BadRequestException('Cycle detected while resolving identification rule');
      }
      visited.add(currentCode.toUpperCase());

      const category = await this.assetCategoryModel.findOne({ code: currentCode.toUpperCase() }).exec();
      if (!category) {
        return null;
      }

      if (category.identificationRule) {
        return category.identificationRule;
      }

      currentCode = category.parentCode;
    }
    return null;
  }

  private async validateHierarchyConstraints(
    code: string,
    level: AssetCategoryLevel,
    parentCode?: string | null
  ): Promise<void> {
    if (level === AssetCategoryLevel.GRANDPARENT) {
      if (parentCode) {
        throw new BadRequestException('GRANDPARENT cannot have a parentCode');
      }
    } else if (level === AssetCategoryLevel.PARENT) {
      if (!parentCode) {
        throw new BadRequestException('PARENT must have a parentCode');
      }
      
      const parent = await this.assetCategoryModel.findOne({ code: parentCode.toUpperCase().trim() });
      if (!parent) {
        throw new BadRequestException(`Parent '${parentCode}' not found`);
      }
      if (!parent.isActive) {
        throw new BadRequestException(`Parent '${parentCode}' is inactive`);
      }
      if (parent.level !== AssetCategoryLevel.GRANDPARENT) {
        throw new BadRequestException(`PARENT must be child of a GRANDPARENT. '${parentCode}' is ${parent.level}`);
      }
    } else if (level === AssetCategoryLevel.CHILD) {
      if (!parentCode) {
        throw new BadRequestException('CHILD must have a parentCode');
      }
      
      const parent = await this.assetCategoryModel.findOne({ code: parentCode.toUpperCase().trim() });
      if (!parent) {
        throw new BadRequestException(`Parent '${parentCode}' not found`);
      }
      if (!parent.isActive) {
        throw new BadRequestException(`Parent '${parentCode}' is inactive`);
      }
      if (parent.level !== AssetCategoryLevel.PARENT) {
        throw new BadRequestException(`CHILD must be child of a PARENT. '${parentCode}' is ${parent.level}`);
      }
    }
  }

  private async detectCycles(code: string, parentCode: string): Promise<void> {
    let currentParentCode: string | null = parentCode;
    const visited = new Set<string>();
    
    while (currentParentCode) {
      if (currentParentCode.toUpperCase() === code) {
        throw new BadRequestException('Cycle detected in category hierarchy');
      }
      
      if (visited.has(currentParentCode.toUpperCase())) {
        break; // Cycle elsewhere, will be caught if relevant
      }
      visited.add(currentParentCode.toUpperCase());
      
      const parent = await this.assetCategoryModel.findOne({ code: currentParentCode.toUpperCase() }).exec();
      if (!parent) break;
      
      currentParentCode = parent.parentCode;
    }
  }
}

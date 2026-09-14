import { IsString, IsEnum, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AssetCategoryLevel } from '../schemas/asset-category.schema.js';
import { IdentificationRuleDto } from './create-asset-category.dto.js';

export class UpdateAssetCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(AssetCategoryLevel)
  @IsOptional()
  level?: AssetCategoryLevel;

  @IsString()
  @IsOptional()
  parentCode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ValidateNested()
  @Type(() => IdentificationRuleDto)
  @IsOptional()
  identificationRule?: IdentificationRuleDto;
}

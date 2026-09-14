import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { AssetCategoryLevel, IdentificationType } from '../schemas/asset-category.schema.js';

export class IdentificationRuleDto {
  @IsEnum(IdentificationType)
  @IsNotEmpty()
  type: IdentificationType;

  @IsNumber()
  @IsNotEmpty()
  length: number;

  @IsBoolean()
  @IsOptional()
  checkDigit?: boolean;
}

export class CreateAssetCategoryDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AssetCategoryLevel)
  @IsNotEmpty()
  level: AssetCategoryLevel;

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

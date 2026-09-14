import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { LocationCategory, LocationPipeline, LocationRole, LocationType } from '../schemas/location.schema.js';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toUpperCase())
  code: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEnum(LocationCategory)
  @IsNotEmpty()
  category: LocationCategory;

  @IsEnum(LocationType)
  @IsNotEmpty()
  locationType: LocationType;

  @IsArray()
  @IsEnum(LocationPipeline, { each: true })
  @IsOptional()
  pipelines?: LocationPipeline[];

  @IsEnum(LocationRole)
  @IsNotEmpty()
  role: LocationRole;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim().toUpperCase())
  parentCode?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxCapacity?: number | null;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  remark?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

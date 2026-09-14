import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { PipelineOperation } from '../schemas/routing-rule.schema.js';

export class CreateRoutingRuleDto {
  @IsString()
  @IsNotEmpty()
  assetCategoryCode: string;

  @IsEnum(PipelineOperation)
  @IsNotEmpty()
  pipeline: PipelineOperation;

  @IsString()
  @IsNotEmpty()
  locationCode: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsNotEmpty()
  remark: string;
}

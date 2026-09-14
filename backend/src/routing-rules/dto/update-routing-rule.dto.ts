import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateRoutingRuleDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  remark?: string;
}

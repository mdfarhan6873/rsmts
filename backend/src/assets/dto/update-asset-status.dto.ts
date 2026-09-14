import { IsEnum, IsNotEmpty } from 'class-validator';
import { AssetStatus } from '../schemas/asset.schema.js';

export class UpdateAssetStatusDto {
  @IsEnum(AssetStatus)
  @IsNotEmpty()
  status: AssetStatus;
}

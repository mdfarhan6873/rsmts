import { Controller, Post, Body, Get, Param, Patch, Delete, Inject } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { RegisterAssetDto } from './dto/register-asset.dto.js';
import { UpdateAssetStatusDto } from './dto/update-asset-status.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';

@Controller('assets')
export class AssetsController {
  constructor(@Inject(AssetsService) private readonly assetsService: AssetsService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  registerAsset(@Body() dto: RegisterAssetDto) {
    return this.assetsService.registerAsset(dto);
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findAll() {
    return this.assetsService.findAll();
  }

  @Get(':assetNumber')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findOne(@Param('assetNumber') assetNumber: string) {
    return this.assetsService.findOne(assetNumber);
  }

  @Patch(':assetNumber/status')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  updateStatus(
    @Param('assetNumber') assetNumber: string,
    @Body() dto: UpdateAssetStatusDto,
  ) {
    return this.assetsService.updateStatus(assetNumber, dto);
  }

  @Delete(':assetNumber')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  removeAsset(@Param('assetNumber') assetNumber: string) {
    return this.assetsService.removeAsset(assetNumber);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { AssetCategoriesService } from './asset-categories.service.js';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto.js';
import { UpdateAssetCategoryDto } from './dto/update-asset-category.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
@Controller('asset-categories')
export class AssetCategoriesController {
  constructor(@Inject(AssetCategoriesService) private readonly assetCategoriesService: AssetCategoriesService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  create(@Body() createAssetCategoryDto: CreateAssetCategoryDto) {
    return this.assetCategoriesService.create(createAssetCategoryDto);
  }

  @Get('hierarchy')
  findHierarchy() {
    return this.assetCategoriesService.findHierarchy();
  }

  @Get()
  findAll() {
    return this.assetCategoriesService.findAll();
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.assetCategoriesService.findOne(code);
  }

  @Patch(':code')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  update(@Param('code') code: string, @Body() updateAssetCategoryDto: UpdateAssetCategoryDto) {
    return this.assetCategoriesService.update(code, updateAssetCategoryDto);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  remove(@Param('code') code: string) {
    return this.assetCategoriesService.remove(code);
  }
}

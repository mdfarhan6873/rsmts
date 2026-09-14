import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AssetCategoriesService } from './asset-categories.service.js';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto.js';
import { UpdateAssetCategoryDto } from './dto/update-asset-category.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
@Controller('asset-categories')
@Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
export class AssetCategoriesController {
  constructor(private readonly assetCategoriesService: AssetCategoriesService) {}

  @Post()
  create(@Body() createAssetCategoryDto: CreateAssetCategoryDto) {
    return this.assetCategoriesService.create(createAssetCategoryDto);
  }

  @Get('hierarchy')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findHierarchy() {
    return this.assetCategoriesService.findHierarchy();
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findAll() {
    return this.assetCategoriesService.findAll();
  }

  @Get(':code')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findOne(@Param('code') code: string) {
    return this.assetCategoriesService.findOne(code);
  }

  @Patch(':code')
  update(@Param('code') code: string, @Body() updateAssetCategoryDto: UpdateAssetCategoryDto) {
    return this.assetCategoriesService.update(code, updateAssetCategoryDto);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('code') code: string) {
    return this.assetCategoriesService.remove(code);
  }
}

import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { LocationsService } from './locations.service.js';
import { CreateLocationDto } from './dto/create-location.dto.js';
import { UpdateLocationDto } from './dto/update-location.dto.js';
import { LocationCategory, LocationPipeline } from './schemas/location.schema.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
@Controller('locations')
@Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT) // Default for writes
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @Get('hierarchy')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findHierarchy() {
    return this.locationsService.findHierarchy();
  }

  @Get('physical')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findPhysicalLocationsByCategory(@Query('category') category: LocationCategory) {
    if (!category) {
      return []; // Optionally return error, or all physical locations
    }
    return this.locationsService.findPhysicalLocationsByCategory(category);
  }

  @Get('pipelines/:pipeline')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findLocationsByPipeline(@Param('pipeline') pipeline: LocationPipeline) {
    return this.locationsService.findLocationsByPipeline(pipeline);
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':code')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findOne(@Param('code') code: string) {
    return this.locationsService.findOne(code);
  }

  @Patch(':code')
  update(@Param('code') code: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationsService.update(code, updateLocationDto);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.locationsService.remove(code);
  }
}

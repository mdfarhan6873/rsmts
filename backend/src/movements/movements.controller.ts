import { Controller, Post, Body, Get, Param, Inject } from '@nestjs/common';
import { MovementsService } from './movements.service.js';
import { CreateMovementDto } from './dto/create-movement.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
@Controller('movements')
export class MovementsController {
  constructor(@Inject(MovementsService) private readonly movementsService: MovementsService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.YARD_CONTROLLER, UserRole.REPAIR_SUPERVISOR, UserRole.MANUFACTURING_SUPERVISOR, UserRole.QA_INSPECTOR)
  async moveAsset(
    @Body() createMovementDto: CreateMovementDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.movementsService.moveAsset(createMovementDto, user._id);
  }

  @Get('asset/:assetNumber')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  async getAssetHistory(@Param('assetNumber') assetNumber: string) {
    return this.movementsService.getAssetHistory(assetNumber);
  }
}

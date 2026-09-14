import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseEnumPipe } from '@nestjs/common';
import { RoutingRulesService } from './routing-rules.service.js';
import { CreateRoutingRuleDto } from './dto/create-routing-rule.dto.js';
import { UpdateRoutingRuleDto } from './dto/update-routing-rule.dto.js';
import { PipelineOperation } from './schemas/routing-rule.schema.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
@Controller('routing-rules')
@Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
export class RoutingRulesController {
  constructor(private readonly routingRulesService: RoutingRulesService) {}

  @Post()
  create(@Body() createRoutingRuleDto: CreateRoutingRuleDto) {
    return this.routingRulesService.create(createRoutingRuleDto);
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findAll() {
    return this.routingRulesService.findAll();
  }

  @Get('allowed')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER, UserRole.YARD_CONTROLLER, UserRole.REPAIR_SUPERVISOR, UserRole.MANUFACTURING_SUPERVISOR, UserRole.QA_INSPECTOR)
  getAllowedLocations(
    @Query('category') category: string,
    @Query('pipeline', new ParseEnumPipe(PipelineOperation)) pipeline: PipelineOperation
  ) {
    return this.routingRulesService.getAllowedLocations(category, pipeline);
  }

  @Get(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT, UserRole.VIEWER)
  findOne(@Param('id') id: string) {
    return this.routingRulesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoutingRuleDto: UpdateRoutingRuleDto) {
    return this.routingRulesService.update(id, updateRoutingRuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routingRulesService.remove(id);
  }
}

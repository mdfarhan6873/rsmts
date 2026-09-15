import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseEnumPipe, Inject } from '@nestjs/common';
import { RoutingRulesService } from './routing-rules.service.js';
import { CreateRoutingRuleDto } from './dto/create-routing-rule.dto.js';
import { UpdateRoutingRuleDto } from './dto/update-routing-rule.dto.js';
import { PipelineOperation } from './schemas/routing-rule.schema.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
@Controller('routing-rules')
export class RoutingRulesController {
  constructor(@Inject(RoutingRulesService) private readonly routingRulesService: RoutingRulesService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  create(@Body() createRoutingRuleDto: CreateRoutingRuleDto) {
    return this.routingRulesService.create(createRoutingRuleDto);
  }

  @Get()
  findAll() {
    return this.routingRulesService.findAll();
  }

  @Get('allowed')
  getAllowedLocations(
    @Query('category') category: string,
    @Query('pipeline', new ParseEnumPipe(PipelineOperation)) pipeline: PipelineOperation
  ) {
    return this.routingRulesService.getAllowedLocations(category, pipeline);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routingRulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  update(@Param('id') id: string, @Body() updateRoutingRuleDto: UpdateRoutingRuleDto) {
    return this.routingRulesService.update(id, updateRoutingRuleDto);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.MANAGEMENT)
  remove(@Param('id') id: string) {
    return this.routingRulesService.remove(id);
  }
}

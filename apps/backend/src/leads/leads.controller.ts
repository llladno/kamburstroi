import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('leads')
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/leads')
  findAll() {
    return this.leadsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/leads/:id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }
}

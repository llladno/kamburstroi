import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsArray, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('services')
  findAll() {
    return this.servicesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/services')
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/services/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.servicesService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/services/:id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/services/:id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}

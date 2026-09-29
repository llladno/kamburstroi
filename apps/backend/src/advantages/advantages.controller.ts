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
import { AdvantagesService } from './advantages.service';
import { CreateAdvantageDto } from './dto/create-advantage.dto';
import { UpdateAdvantageDto } from './dto/update-advantage.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class AdvantagesController {
  constructor(private readonly advantagesService: AdvantagesService) {}

  @Get('advantages')
  findAll() {
    return this.advantagesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/advantages')
  create(@Body() dto: CreateAdvantageDto) {
    return this.advantagesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/advantages/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.advantagesService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/advantages/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAdvantageDto) {
    return this.advantagesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/advantages/:id')
  remove(@Param('id') id: string) {
    return this.advantagesService.remove(id);
  }
}

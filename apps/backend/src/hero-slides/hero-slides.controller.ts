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
import { HeroSlidesService } from './hero-slides.service';
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class HeroSlidesController {
  constructor(private readonly heroSlidesService: HeroSlidesService) {}

  @Get('hero-slides')
  findAll() {
    return this.heroSlidesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/hero-slides')
  create(@Body() dto: CreateHeroSlideDto) {
    return this.heroSlidesService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/hero-slides/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.heroSlidesService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/hero-slides/:id')
  update(@Param('id') id: string, @Body() dto: UpdateHeroSlideDto) {
    return this.heroSlidesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/hero-slides/:id')
  remove(@Param('id') id: string) {
    return this.heroSlidesService.remove(id);
  }
}

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
import { ObjectsService } from './objects.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { AddObjectImageDto } from './dto/add-object-image.dto';

class ReorderDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

@Controller()
export class ObjectsController {
  constructor(private readonly objectsService: ObjectsService) {}

  @Get('objects')
  findAllPublished() {
    return this.objectsService.findAllPublished();
  }

  @Get('objects/:slug')
  findOne(@Param('slug') slug: string) {
    return this.objectsService.findOnePublishedBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/objects')
  findAllForAdmin() {
    return this.objectsService.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/objects')
  create(@Body() dto: CreateObjectDto) {
    return this.objectsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/objects/reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.objectsService.reorder(dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/objects/:id')
  update(@Param('id') id: string, @Body() dto: UpdateObjectDto) {
    return this.objectsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/objects/:id')
  remove(@Param('id') id: string) {
    return this.objectsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/objects/:id/images')
  addImage(@Param('id') id: string, @Body() dto: AddObjectImageDto) {
    return this.objectsService.addImage(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/objects/:id/images/reorder')
  reorderImages(@Param('id') id: string, @Body() dto: ReorderDto) {
    return this.objectsService.reorderImages(id, dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/objects/:id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.objectsService.removeImage(id, imageId);
  }
}

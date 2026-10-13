import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImageProcessorService } from '../uploads/image-processor.service';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller()
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  @Get('reviews')
  findApproved() {
    return this.reviewsService.findApproved();
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reviews/photo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadPhoto(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }
    const { publicUrl } = await this.imageProcessor.process(file.buffer);
    return { url: publicUrl };
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reviews')
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/reviews')
  findAllForAdmin() {
    return this.reviewsService.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/reviews/:id')
  update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('admin/reviews/:id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}

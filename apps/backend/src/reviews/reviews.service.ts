import { Injectable } from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findApproved() {
    return this.prisma.review.findMany({
      where: { status: ReviewStatus.approved },
      orderBy: { createdAt: 'desc' },
    });
  }

  findAllForAdmin() {
    return this.prisma.review.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateReviewDto) {
    return this.prisma.review.create({ data: { ...dto, status: ReviewStatus.pending } });
  }

  update(id: string, dto: UpdateReviewDto) {
    return this.prisma.review.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }

  update(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.service.update({ where: { id }, data: { order: index } })),
    );
    return this.findAll();
  }
}

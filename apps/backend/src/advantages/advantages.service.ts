import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdvantageDto } from './dto/create-advantage.dto';
import { UpdateAdvantageDto } from './dto/update-advantage.dto';

@Injectable()
export class AdvantagesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.advantage.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateAdvantageDto) {
    return this.prisma.advantage.create({ data: dto });
  }

  update(id: string, dto: UpdateAdvantageDto) {
    return this.prisma.advantage.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.advantage.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.advantage.update({ where: { id }, data: { order: index } }),
      ),
    );
    return this.findAll();
  }
}

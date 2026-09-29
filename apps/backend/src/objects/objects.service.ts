import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObjectDto } from './dto/create-object.dto';
import { UpdateObjectDto } from './dto/update-object.dto';
import { AddObjectImageDto } from './dto/add-object-image.dto';
import { slugify } from './slug.util';

@Injectable()
export class ObjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // --- public ---

  findAllPublished() {
    return this.prisma.project.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  async findOnePublishedBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, isPublished: true },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!project) {
      throw new NotFoundException('Объект не найден');
    }
    return project;
  }

  // --- admin ---

  findAllForAdmin() {
    return this.prisma.project.findMany({
      orderBy: { order: 'asc' },
      include: { images: { orderBy: { order: 'asc' } } },
    });
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;
    while (await this.prisma.project.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  async create(dto: CreateObjectDto) {
    const slug = await this.uniqueSlug(dto.title);
    return this.prisma.project.create({ data: { ...dto, slug } });
  }

  update(id: string, dto: UpdateObjectDto) {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) => this.prisma.project.update({ where: { id }, data: { order: index } })),
    );
    return this.findAllForAdmin();
  }

  // --- gallery ---

  async addImage(projectId: string, dto: AddObjectImageDto) {
    if (dto.isCover) {
      await this.prisma.projectImage.updateMany({
        where: { projectId },
        data: { isCover: false },
      });
    }
    const count = await this.prisma.projectImage.count({ where: { projectId } });
    return this.prisma.projectImage.create({
      data: { projectId, url: dto.url, isCover: dto.isCover ?? false, order: count },
    });
  }

  async removeImage(projectId: string, imageId: string) {
    return this.prisma.projectImage.delete({ where: { id: imageId } });
  }

  async reorderImages(projectId: string, ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.projectImage.update({ where: { id }, data: { order: index } }),
      ),
    );
    return this.prisma.projectImage.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }
}

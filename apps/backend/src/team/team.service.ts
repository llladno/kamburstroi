import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.teamMember.findMany({ orderBy: { order: 'asc' } });
  }

  create(dto: CreateTeamMemberDto) {
    return this.prisma.teamMember.create({ data: dto });
  }

  update(id: string, dto: UpdateTeamMemberDto) {
    return this.prisma.teamMember.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.teamMember.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.teamMember.update({ where: { id }, data: { order: index } }),
      ),
    );
    return this.findAll();
  }
}

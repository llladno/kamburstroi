import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramNotifierService } from '../telegram/telegram-notifier.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramNotifier: TelegramNotifierService,
  ) {}

  findAll() {
    return this.prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({ data: dto });
    await this.telegramNotifier.notify(
      `Новая заявка от ${lead.name}, тел. ${lead.phone}${lead.comment ? `\nКомментарий: ${lead.comment}` : ''}`,
    );
    return lead;
  }

  update(id: string, dto: UpdateLeadDto) {
    return this.prisma.lead.update({ where: { id }, data: dto });
  }
}

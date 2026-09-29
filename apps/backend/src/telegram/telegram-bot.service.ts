import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Bot } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Bot | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, bot will not start');
      return;
    }

    this.bot = new Bot(token);

    this.bot.command('start', async (ctx) => {
      const chatId = String(ctx.chat.id);
      await this.prisma.telegramSubscriber.upsert({
        where: { chatId },
        update: {},
        create: { chatId },
      });
      await ctx.reply('Вы подписаны на уведомления о новых заявках и отзывах.');
    });

    this.bot.start().catch((error) => {
      this.logger.error(`Telegram bot crashed: ${(error as Error).message}`);
    });
  }

  async onModuleDestroy() {
    await this.bot?.stop();
  }
}

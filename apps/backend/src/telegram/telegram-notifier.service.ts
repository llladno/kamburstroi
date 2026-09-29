import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramNotifierService {
  private readonly logger = new Logger(TelegramNotifierService.name);
  private readonly bot: Bot | null;

  constructor(private readonly prisma: PrismaService) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    this.bot = token ? new Bot(token) : null;
  }

  async notify(text: string): Promise<void> {
    if (!this.bot) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, skipping notification');
      return;
    }

    const subscribers = await this.prisma.telegramSubscriber.findMany();
    await Promise.all(
      subscribers.map(async (subscriber) => {
        try {
          await this.bot!.api.sendMessage(subscriber.chatId, text);
        } catch (error) {
          this.logger.error(
            `Failed to notify chatId=${subscriber.chatId}: ${(error as Error).message}`,
          );
        }
      }),
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';
import { getTelegramClientOptions } from './proxy-agent';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface NewLeadInfo {
  name: string;
  phone: string;
  comment?: string | null;
}

interface NewReviewInfo {
  name: string;
  rating: number;
  text: string;
}

@Injectable()
export class TelegramNotifierService {
  private readonly logger = new Logger(TelegramNotifierService.name);
  private readonly bot: Bot | null;
  private readonly adminBaseUrl: string;

  constructor(private readonly prisma: PrismaService) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    this.bot = token ? new Bot(token, { client: getTelegramClientOptions() }) : null;
    this.adminBaseUrl = (process.env.ADMIN_BASE_URL ?? 'http://localhost:3002').replace(/\/$/, '');
  }

  async notifyNewLead(lead: NewLeadInfo): Promise<void> {
    const lines = [
      '🔔 <b>Новая заявка</b>',
      '',
      `👤 ${escapeHtml(lead.name)}`,
      `📞 ${escapeHtml(lead.phone)}`,
    ];
    if (lead.comment) {
      lines.push(`💬 ${escapeHtml(lead.comment)}`);
    }
    await this.send(lines.join('\n'), { text: 'Открыть заявки', path: '/leads' });
  }

  async notifyNewReview(review: NewReviewInfo): Promise<void> {
    const stars = '⭐'.repeat(review.rating);
    const lines = [
      `${stars} <b>Новый отзыв</b> (${review.rating}/5)`,
      '',
      `👤 ${escapeHtml(review.name)}`,
      `💬 ${escapeHtml(review.text)}`,
    ];
    await this.send(lines.join('\n'), { text: 'Открыть отзывы', path: '/reviews' });
  }

  private async send(text: string, button: { text: string; path: string }): Promise<void> {
    if (!this.bot) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, skipping notification');
      return;
    }

    const subscribers = await this.prisma.telegramSubscriber.findMany();
    const replyMarkup = {
      inline_keyboard: [[{ text: button.text, url: `${this.adminBaseUrl}${button.path}` }]],
    };

    await Promise.all(
      subscribers.map(async (subscriber) => {
        try {
          await this.bot!.api.sendMessage(subscriber.chatId, text, {
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
          });
        } catch (error) {
          this.logger.error(
            `Failed to notify chatId=${subscriber.chatId}: ${(error as Error).message}`,
          );
        }
      }),
    );
  }
}

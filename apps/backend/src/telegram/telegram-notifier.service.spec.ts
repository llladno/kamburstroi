import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';

const sendMessageMock = jest.fn().mockRejectedValue(new Error('network error'));

jest.mock('grammy', () => ({
  Bot: jest.fn().mockImplementation(() => ({
    api: { sendMessage: sendMessageMock },
  })),
}));

import { TelegramNotifierService } from './telegram-notifier.service';

describe('TelegramNotifierService', () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalAdminBaseUrl = process.env.ADMIN_BASE_URL;

  beforeAll(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.ADMIN_BASE_URL = 'https://admin.kambyrstroi.ru';
  });

  afterAll(() => {
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
    process.env.ADMIN_BASE_URL = originalAdminBaseUrl;
  });

  beforeEach(() => {
    sendMessageMock.mockClear();
  });

  async function createNotifier(subscribers: { chatId: string }[] = [{ chatId: '123' }]) {
    const prismaMock = {
      telegramSubscriber: { findMany: jest.fn().mockResolvedValue(subscribers) },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [TelegramNotifierService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    return { notifier: moduleRef.get(TelegramNotifierService), prismaMock };
  }

  it('sends an HTML-formatted lead notification with a button to the admin leads page', async () => {
    const { notifier } = await createNotifier();

    await notifier.notifyNewLead({ name: 'Иван Иванов', phone: '+7 900 123-45-67', comment: null });

    expect(sendMessageMock).toHaveBeenCalledWith(
      '123',
      expect.stringContaining('Иван Иванов'),
      expect.objectContaining({
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть заявки', url: 'https://admin.kambyrstroi.ru/leads' }]],
        },
      }),
    );
  });

  it('escapes HTML special characters in lead fields', async () => {
    const { notifier } = await createNotifier();

    await notifier.notifyNewLead({ name: 'Иван <script>', phone: '+7 900 123-45-67', comment: 'A & B' });

    const [, text] = sendMessageMock.mock.calls[0];
    expect(text).toContain('Иван &lt;script&gt;');
    expect(text).toContain('A &amp; B');
    expect(text).not.toContain('<script>');
  });

  it('sends an HTML-formatted review notification with a button to the admin reviews page', async () => {
    const { notifier } = await createNotifier();

    await notifier.notifyNewReview({ name: 'Ольга Смирнова', rating: 5, text: 'Отличная работа' });

    expect(sendMessageMock).toHaveBeenCalledWith(
      '123',
      expect.stringContaining('Ольга Смирнова'),
      expect.objectContaining({
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: 'Открыть отзывы', url: 'https://admin.kambyrstroi.ru/reviews' }]],
        },
      }),
    );
  });

  it('does not throw when the bot API call fails', async () => {
    const { notifier, prismaMock } = await createNotifier();

    await expect(
      notifier.notifyNewLead({ name: 'Иван', phone: '+7 900 000-00-00', comment: null }),
    ).resolves.toBeUndefined();
    expect(prismaMock.telegramSubscriber.findMany).toHaveBeenCalled();
    expect(sendMessageMock).toHaveBeenCalled();
  });

  it('skips silently when TELEGRAM_BOT_TOKEN is not set', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '';
    const { notifier, prismaMock } = await createNotifier();

    await expect(
      notifier.notifyNewLead({ name: 'Иван', phone: '+7 900 000-00-00', comment: null }),
    ).resolves.toBeUndefined();
    expect(prismaMock.telegramSubscriber.findMany).not.toHaveBeenCalled();

    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  });
});

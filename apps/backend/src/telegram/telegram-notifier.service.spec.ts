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

  beforeAll(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  });

  afterAll(() => {
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });

  it('does not throw when the bot API call fails', async () => {
    const prismaMock = {
      telegramSubscriber: {
        findMany: jest.fn().mockResolvedValue([{ chatId: '123' }]),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TelegramNotifierService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    const notifier = moduleRef.get(TelegramNotifierService);
    await expect(notifier.notify('Новая заявка от Иван')).resolves.toBeUndefined();
    expect(prismaMock.telegramSubscriber.findMany).toHaveBeenCalled();
    expect(sendMessageMock).toHaveBeenCalledWith('123', 'Новая заявка от Иван');
  });

  it('skips silently when TELEGRAM_BOT_TOKEN is not set', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '';
    const prismaMock = {
      telegramSubscriber: { findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TelegramNotifierService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    const notifier = moduleRef.get(TelegramNotifierService);
    await expect(notifier.notify('test')).resolves.toBeUndefined();
    expect(prismaMock.telegramSubscriber.findMany).not.toHaveBeenCalled();

    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  });
});

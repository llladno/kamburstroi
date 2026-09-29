import { Global, Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramNotifierService } from './telegram-notifier.service';

@Global()
@Module({
  providers: [TelegramBotService, TelegramNotifierService],
  exports: [TelegramNotifierService],
})
export class TelegramModule {}

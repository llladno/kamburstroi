import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdvantagesController } from './advantages.controller';
import { AdvantagesService } from './advantages.service';

@Module({
  imports: [AuthModule],
  controllers: [AdvantagesController],
  providers: [AdvantagesService],
})
export class AdvantagesModule {}

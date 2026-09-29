import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ImageProcessorService } from './image-processor.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class UploadsModule {}

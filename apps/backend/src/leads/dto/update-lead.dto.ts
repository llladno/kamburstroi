import { IsBoolean } from 'class-validator';

export class UpdateLeadDto {
  @IsBoolean()
  isProcessed: boolean;
}

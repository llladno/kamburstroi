import { PartialType } from '@nestjs/mapped-types';
import { CreateAdvantageDto } from './create-advantage.dto';

export class UpdateAdvantageDto extends PartialType(CreateAdvantageDto) {}

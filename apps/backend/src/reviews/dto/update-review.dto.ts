import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class UpdateReviewDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsEnum(ReviewStatus) status?: ReviewStatus;
}

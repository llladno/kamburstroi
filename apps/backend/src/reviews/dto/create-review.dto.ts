import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString() @IsNotEmpty() name: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsString() @IsNotEmpty() text: string;
  @IsOptional() @IsUrl({ require_tld: false }) photoUrl?: string;
  @IsOptional() @IsString() projectId?: string;
}

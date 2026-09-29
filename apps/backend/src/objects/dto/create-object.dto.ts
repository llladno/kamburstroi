import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateObjectDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() workType: string;
  @IsString() @IsNotEmpty() description: string;
  @IsInt() @Min(1900) year: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

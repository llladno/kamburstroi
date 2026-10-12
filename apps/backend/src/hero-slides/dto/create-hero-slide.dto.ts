import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateHeroSlideDto {
  @IsString() @IsNotEmpty() imageUrl: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

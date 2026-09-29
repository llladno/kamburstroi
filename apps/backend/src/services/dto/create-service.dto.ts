import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() heroTitle?: string;
  @IsOptional() @IsString() heroSubtitle?: string;
  @IsOptional() @IsString() aboutText?: string;
  @IsOptional() @IsInt() @Min(0) yearsOfExperience?: number;
  @IsOptional() @IsInt() @Min(0) completedObjectsCount?: number;
  @IsOptional() @IsInt() @Min(0) warrantyMonths?: number;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() workHours?: string;
  @IsOptional() @IsString() vkUrl?: string;
}

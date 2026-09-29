import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() role: string;
  @IsOptional() @IsUrl({ require_tld: false }) photoUrl?: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

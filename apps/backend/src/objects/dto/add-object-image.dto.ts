import { IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class AddObjectImageDto {
  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsBoolean()
  isCover?: boolean;
}

import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRepresentativeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

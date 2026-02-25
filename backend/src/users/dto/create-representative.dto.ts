import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRepresentativeDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  fullName: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

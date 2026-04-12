import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UploadBankTransferReceiptDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  note?: string;
}

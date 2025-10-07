import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateCustomerEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password: string;
}

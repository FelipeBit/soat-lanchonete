import { IsString, Length } from 'class-validator';

export class CreateCustomerCpfDto {
  @IsString()
  @Length(11, 14, { message: 'CPF deve ter entre 11 e 14 caracteres' })
  cpf: string;
}

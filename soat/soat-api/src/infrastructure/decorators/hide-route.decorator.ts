import { applyDecorators } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

/**
 * Decorator para esconder um controller inteiro da documentação Swagger
 */
export const HideFromSwagger = () => {
  return applyDecorators(ApiExcludeController());
}; 
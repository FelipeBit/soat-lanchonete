import { isValidCPF } from './cpf.validator';

describe('CPFValidator', () => {
  describe('isValidCPF', () => {
    it('should return false for empty or null CPF', () => {
      expect(isValidCPF('')).toBe(false);
      expect(isValidCPF(null)).toBe(false);
      expect(isValidCPF(undefined)).toBe(false);
    });

    it('should return false for invalid CPF format', () => {
      expect(isValidCPF('123')).toBe(false);
      expect(isValidCPF('123456789012')).toBe(false);
      expect(isValidCPF('11111111111')).toBe(false);
      expect(isValidCPF('123.456.789-00')).toBe(false);
    });

    it('should return true for valid CPF', () => {
      expect(isValidCPF('52998224725')).toBe(true);
      expect(isValidCPF('529.982.247-25')).toBe(true);
    });

    it('should return false for invalid CPF digits', () => {
      const invalidDigitCPFs = [
        '123.456.789-00', // Invalid first digit
        '123.456.789-10', // Invalid second digit
        '111.111.111-11', // All same digits
        '000.000.000-00', // All zeros
      ];

      invalidDigitCPFs.forEach((cpf) => {
        expect(isValidCPF(cpf)).toBe(false);
      });
    });

    it('should handle CPF with different formats', () => {
      const cpf = '12345678909';
      const formattedCPF = '123.456.789-09';

      expect(isValidCPF(cpf)).toBe(true);
      expect(isValidCPF(formattedCPF)).toBe(true);
    });
  });
});

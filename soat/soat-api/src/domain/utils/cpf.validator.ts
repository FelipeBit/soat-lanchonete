export function isValidCPF(cpf: string | null | undefined): boolean {
  if (!cpf) {
    return false;
  }

  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');

  // Check if CPF has 11 digits
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  // Calculate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) {
    return false;
  }

  // Calculate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) {
    return false;
  }

  return true;
}

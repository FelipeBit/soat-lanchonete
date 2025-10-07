export function formatCPF(cpf: string | null | undefined): string | null {
  if (!cpf) {
    return null;
  }
  return cpf.replace(/[.-]/g, '');
}
